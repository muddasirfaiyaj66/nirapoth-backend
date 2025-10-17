/*
  Reconcile legacy finance data before production
  - Ensures only one active (OUTSTANDING|PARTIAL) debt per user by merging
  - Fixes negative/overpaid amounts and inconsistent PAID status
  - Backfills missing REWARD credits for historical DEBT_PAYMENT transactions

  Usage (from repo root):
    npx ts-node nirapoth-backend/scripts/reconcileFinance.ts
*/

import {
  PrismaClient,
  DebtStatus,
  TransactionStatus,
  TransactionType,
  TransactionSource,
} from "@prisma/client";

const prisma = new PrismaClient();

type ActiveDebt = {
  id: string;
  userId: string;
  originalAmount: number;
  currentAmount: number;
  paidAmount: number;
  lateFees: number;
  status: DebtStatus;
  dueDate: Date;
  createdAt: Date;
  paidAt: Date | null;
};

async function clampDebt(debt: ActiveDebt) {
  let { originalAmount, currentAmount, paidAmount, status, paidAt } = debt;

  // Clamp negatives
  originalAmount = Math.max(0, Math.abs(originalAmount));
  currentAmount = Math.max(0, Math.abs(currentAmount));
  paidAmount = Math.max(0, Math.abs(paidAmount));

  // Prevent overpay
  if (paidAmount > currentAmount) {
    paidAmount = currentAmount;
  }

  // Align status with amounts
  if (currentAmount === 0 || paidAmount >= currentAmount) {
    status = DebtStatus.PAID;
    if (!paidAt) paidAt = new Date();
  }

  const updated = await prisma.outstandingDebt.update({
    where: { id: debt.id },
    data: {
      originalAmount,
      currentAmount,
      paidAmount,
      status,
      paidAt,
    },
  });

  return updated;
}

async function mergeActiveDebtsForUser(userId: string) {
  const debts = await prisma.outstandingDebt.findMany({
    where: {
      userId,
      status: { in: [DebtStatus.OUTSTANDING, DebtStatus.PARTIAL] },
    },
    orderBy: { createdAt: "asc" },
  });

  if (debts.length <= 1) return { merged: false };

  // First, clamp each to ensure no invalid states
  for (const d of debts) {
    await clampDebt(d as ActiveDebt);
  }

  // Re-query after clamps
  const fresh = await prisma.outstandingDebt.findMany({
    where: {
      userId,
      status: { in: [DebtStatus.OUTSTANDING, DebtStatus.PARTIAL] },
    },
    orderBy: { createdAt: "asc" },
  });

  if (fresh.length <= 1) return { merged: true };

  // Compute combined remaining
  const totalRemaining = fresh.reduce(
    (acc, d) => acc + Math.max(0, d.currentAmount - d.paidAmount),
    0
  );
  const totalLateFees = fresh.reduce((acc, d) => acc + (d.lateFees || 0), 0);

  const primary = fresh[0];
  const others = fresh.slice(1);

  await prisma.$transaction(async (tx) => {
    if (totalRemaining > 0) {
      // Set primary to hold all remaining
      await tx.outstandingDebt.update({
        where: { id: primary.id },
        data: {
          // currentAmount = already paid + remaining
          currentAmount: primary.paidAmount + totalRemaining,
          originalAmount: Math.max(
            primary.originalAmount,
            primary.paidAmount + totalRemaining - totalLateFees
          ),
          lateFees: totalLateFees,
          status: DebtStatus.OUTSTANDING,
        },
      });
    } else {
      // Nothing remaining → mark primary PAID if not already
      await tx.outstandingDebt.update({
        where: { id: primary.id },
        data: {
          paidAmount: primary.currentAmount,
          status: DebtStatus.PAID,
          paidAt: primary.paidAt ?? new Date(),
        },
      });
    }

    // Archive the others by zeroing remaining and marking as WAIVED (to avoid double counting)
    for (const d of others) {
      const notes = `Merged into debt ${
        primary.id
      } on ${new Date().toISOString()}`;
      await tx.outstandingDebt.update({
        where: { id: d.id },
        data: {
          status: DebtStatus.WAIVED,
          paidAmount: d.currentAmount,
          notes,
        },
      });
    }
  });

  return { merged: true };
}

async function backfillDebtPaymentCredits() {
  const debtPayments = await prisma.rewardTransaction.findMany({
    where: {
      type: TransactionType.DEBT_PAYMENT,
      status: TransactionStatus.COMPLETED,
    },
    orderBy: { createdAt: "asc" },
  });

  let created = 0;

  for (const dp of debtPayments) {
    const txId = (dp.description || "").replace("Debt payment - ", "");
    if (!txId) continue;

    const exists = await prisma.rewardTransaction.findFirst({
      where: {
        userId: dp.userId,
        type: TransactionType.REWARD,
        source: TransactionSource.DEBT_PAYMENT,
        description: `Debt payment credit - ${txId}`,
        status: TransactionStatus.COMPLETED,
      },
    });

    if (exists) continue;

    await prisma.rewardTransaction.create({
      data: {
        userId: dp.userId,
        amount: Math.abs(dp.amount),
        type: TransactionType.REWARD,
        source: TransactionSource.DEBT_PAYMENT,
        status: TransactionStatus.COMPLETED,
        description: `Debt payment credit - ${txId}`,
        processedAt: new Date(),
      },
    });
    created++;
  }

  return created;
}

async function fixPerDebtInvariants() {
  const debts = await prisma.outstandingDebt.findMany({
    orderBy: { createdAt: "asc" },
  });
  let fixed = 0;

  for (const d of debts) {
    const before = JSON.stringify({
      oa: d.originalAmount,
      ca: d.currentAmount,
      pa: d.paidAmount,
      s: d.status,
      paidAt: d.paidAt,
    });
    const updated = await clampDebt(d as ActiveDebt);
    const after = JSON.stringify({
      oa: updated.originalAmount,
      ca: updated.currentAmount,
      pa: updated.paidAmount,
      s: updated.status,
      paidAt: updated.paidAt,
    });
    if (before !== after) fixed++;
  }

  return fixed;
}

async function main() {
  console.log("🔧 Starting finance reconciliation...");

  // Step 1: Fix per-debt invariants
  const fixed = await fixPerDebtInvariants();
  console.log(`✅ Per-debt invariants fixed: ${fixed}`);

  // Step 2: Merge multiple active debts per user
  const usersWithActive = await prisma.outstandingDebt.findMany({
    where: { status: { in: [DebtStatus.OUTSTANDING, DebtStatus.PARTIAL] } },
    select: { userId: true },
    distinct: ["userId"],
  });

  let mergedUsers = 0;
  for (const u of usersWithActive) {
    const { merged } = await mergeActiveDebtsForUser(u.userId);
    if (merged) mergedUsers++;
  }
  console.log(`✅ Users processed for active debt merge: ${mergedUsers}`);

  // Step 3: Backfill REWARD credits for historical DEBT_PAYMENTs
  const creditsCreated = await backfillDebtPaymentCredits();
  console.log(`✅ Debt payment credits backfilled: ${creditsCreated}`);

  console.log("🎉 Finance reconciliation completed successfully.");
}

main()
  .catch((err) => {
    console.error("❌ Reconciliation failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
