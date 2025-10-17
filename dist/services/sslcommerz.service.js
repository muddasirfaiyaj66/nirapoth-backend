import axios from "axios";
import { EmailService } from "./email.service";
import { prisma } from "../lib/prisma";
const emailService = new EmailService();
export class SSLCommerzService {
    config;
    baseURL;
    constructor() {
        this.config = {
            store_id: process.env.STORE_ID || "",
            store_passwd: process.env.STORE_PASSWORD || "",
            is_live: process.env.NODE_ENV === "production",
        };
        // SSLCommerz API URLs
        this.baseURL = this.config.is_live
            ? "https://sandbox.sslcommerz.com"
            : "https://sandbox.sslcommerz.com";
        if (!this.config.store_id || !this.config.store_passwd) {
            console.warn("SSLCommerz credentials not configured properly");
        }
    }
    /**
     * Initialize a payment session with SSLCommerz
     */
    async initPayment(data) {
        try {
            const paymentData = {
                store_id: this.config.store_id,
                store_passwd: this.config.store_passwd,
                ...data,
            };
            const response = await axios.post(`${this.baseURL}/gwprocess/v4/api.php`, new URLSearchParams(paymentData).toString(), {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            });
            if (response.data.status === "SUCCESS") {
                return {
                    success: true,
                    gatewayPageURL: response.data.GatewayPageURL,
                    sessionKey: response.data.sessionkey,
                    data: response.data,
                };
            }
            else {
                return {
                    success: false,
                    message: response.data.failedreason || "Payment initialization failed",
                    data: response.data,
                };
            }
        }
        catch (error) {
            console.error("SSLCommerz init payment error:", error.message);
            return {
                success: false,
                message: "Failed to initialize payment",
                error: error.message,
            };
        }
    }
    /**
     * Validate payment after successful transaction
     */
    async validatePayment(validationData) {
        try {
            const response = await axios.get(`${this.baseURL}/validator/api/validationserverAPI.php`, {
                params: {
                    val_id: validationData.val_id,
                    store_id: validationData.store_id,
                    store_passwd: validationData.store_passwd,
                    format: "json",
                },
            });
            if (response.data.status === "VALID" ||
                response.data.status === "VALIDATED") {
                return {
                    success: true,
                    data: response.data,
                };
            }
            else {
                return {
                    success: false,
                    message: "Payment validation failed",
                    data: response.data,
                };
            }
        }
        catch (error) {
            console.error("SSLCommerz validate payment error:", error.message);
            return {
                success: false,
                message: "Failed to validate payment",
                error: error.message,
            };
        }
    }
    /**
     * Process refund for a transaction
     */
    async initiateRefund(bankTranId, refundAmount, refundRemarks) {
        try {
            const refundData = {
                store_id: this.config.store_id,
                store_passwd: this.config.store_passwd,
                bank_tran_id: bankTranId,
                refund_amount: refundAmount,
                refund_remarks: refundRemarks,
                format: "json",
            };
            const response = await axios.post(`${this.baseURL}/validator/api/merchantTransIDvalidationAPI.php`, new URLSearchParams(refundData).toString(), {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            });
            if (response.data.status === "success") {
                return {
                    success: true,
                    data: response.data,
                };
            }
            else {
                return {
                    success: false,
                    message: response.data.errorReason || "Refund initiation failed",
                    data: response.data,
                };
            }
        }
        catch (error) {
            console.error("SSLCommerz refund error:", error.message);
            return {
                success: false,
                message: "Failed to initiate refund",
                error: error.message,
            };
        }
    }
    /**
     * Query transaction by transaction ID
     */
    async queryTransaction(transactionId) {
        try {
            const response = await axios.get(`${this.baseURL}/validator/api/merchantTransIDvalidationAPI.php`, {
                params: {
                    tran_id: transactionId,
                    store_id: this.config.store_id,
                    store_passwd: this.config.store_passwd,
                    format: "json",
                },
            });
            return {
                success: true,
                data: response.data,
            };
        }
        catch (error) {
            console.error("SSLCommerz query transaction error:", error.message);
            return {
                success: false,
                message: "Failed to query transaction",
                error: error.message,
            };
        }
    }
    /**
     * Generate unique transaction ID
     */
    generateTransactionId(prefix = "NIRAPOTH") {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        return `${prefix}_${timestamp}_${random}`;
    }
    /**
     * Create payment session for fine payment
     */
    async createFinePaymentSession(fineId, userId, amount, baseURL) {
        try {
            // Fetch fine and user details
            const [fine, user] = await Promise.all([
                prisma.fine.findUnique({
                    where: { id: fineId },
                    include: {
                        violation: {
                            include: {
                                rule: true,
                                vehicle: true,
                            },
                        },
                    },
                }),
                prisma.user.findUnique({
                    where: { id: userId },
                }),
            ]);
            if (!fine || !user) {
                return {
                    success: false,
                    message: "Fine or user not found",
                };
            }
            // Check if fine is already paid
            if (fine.status === "PAID") {
                return {
                    success: false,
                    message: "Fine is already paid",
                };
            }
            // Generate transaction ID
            const transactionId = this.generateTransactionId("FINE");
            // Prepare payment data
            const paymentData = {
                total_amount: amount,
                currency: "BDT",
                tran_id: transactionId,
                success_url: `${baseURL}/api/payments/sslcommerz/success`,
                fail_url: `${baseURL}/api/payments/sslcommerz/fail`,
                cancel_url: `${baseURL}/api/payments/sslcommerz/cancel`,
                ipn_url: `${baseURL}/api/payments/sslcommerz/ipn`,
                cus_name: `${user.firstName} ${user.lastName}`,
                cus_email: user.email,
                cus_add1: user.presentAddress || "N/A",
                cus_city: user.presentCity || "Dhaka",
                cus_postcode: user.presentPostalCode || "1000",
                cus_country: "Bangladesh",
                cus_phone: user.phone || "N/A",
                shipping_method: "NO",
                product_name: `Fine Payment - ${fine.violation.rule.title}`,
                product_category: "Fine",
                product_profile: "general",
            };
            // Create payment record in database (PENDING status)
            const payment = await prisma.payment.create({
                data: {
                    userId,
                    fineId,
                    amount,
                    paymentMethod: "ONLINE",
                    paymentStatus: "PENDING",
                    transactionId,
                    paidAt: new Date(),
                },
            });
            // Initialize payment with SSLCommerz
            const result = await this.initPayment(paymentData);
            if (result.success) {
                return {
                    success: true,
                    gatewayPageURL: result.gatewayPageURL,
                    sessionKey: result.sessionKey,
                    transactionId,
                    paymentId: payment.id,
                };
            }
            else {
                // Delete payment record if initialization failed
                await prisma.payment.delete({
                    where: { id: payment.id },
                });
                return {
                    success: false,
                    message: result.message,
                };
            }
        }
        catch (error) {
            console.error("Create fine payment session error:", error.message);
            return {
                success: false,
                message: "Failed to create payment session",
                error: error.message,
            };
        }
    }
    /**
     * Create payment session for multiple fines payment
     */
    async createMultipleFinesPaymentSession(fineIds, userId, baseURL) {
        try {
            // Fetch fines and user details
            const [fines, user] = await Promise.all([
                prisma.fine.findMany({
                    where: {
                        id: { in: fineIds },
                        status: "UNPAID",
                    },
                    include: {
                        violation: {
                            include: {
                                rule: true,
                                vehicle: true,
                            },
                        },
                    },
                }),
                prisma.user.findUnique({
                    where: { id: userId },
                }),
            ]);
            if (!user || fines.length === 0) {
                return {
                    success: false,
                    message: "User not found or no unpaid fines found",
                };
            }
            // Calculate total amount
            const totalAmount = fines.reduce((sum, fine) => sum + fine.amount, 0);
            // Generate transaction ID
            const transactionId = this.generateTransactionId("FINES");
            // Prepare payment data
            const paymentData = {
                total_amount: totalAmount,
                currency: "BDT",
                tran_id: transactionId,
                success_url: `${baseURL}/api/payments/sslcommerz/success`,
                fail_url: `${baseURL}/api/payments/sslcommerz/fail`,
                cancel_url: `${baseURL}/api/payments/sslcommerz/cancel`,
                ipn_url: `${baseURL}/api/payments/sslcommerz/ipn`,
                cus_name: `${user.firstName} ${user.lastName}`,
                cus_email: user.email,
                cus_add1: user.presentAddress || "N/A",
                cus_city: user.presentCity || "Dhaka",
                cus_postcode: user.presentPostalCode || "1000",
                cus_country: "Bangladesh",
                cus_phone: user.phone || "N/A",
                shipping_method: "NO",
                product_name: `Fine Payment - ${fines.length} fine(s)`,
                product_category: "Fine",
                product_profile: "general",
            };
            // Create payment records for each fine (PENDING status)
            const paymentPromises = fines.map((fine) => prisma.payment.create({
                data: {
                    userId,
                    fineId: fine.id,
                    amount: fine.amount,
                    paymentMethod: "ONLINE",
                    paymentStatus: "PENDING",
                    transactionId,
                    paidAt: new Date(),
                },
            }));
            const payments = await Promise.all(paymentPromises);
            // Initialize payment with SSLCommerz
            const result = await this.initPayment(paymentData);
            if (result.success) {
                return {
                    success: true,
                    gatewayPageURL: result.gatewayPageURL,
                    sessionKey: result.sessionKey,
                    transactionId,
                    paymentIds: payments.map((p) => p.id),
                    totalAmount,
                };
            }
            else {
                // Delete payment records if initialization failed
                await prisma.payment.deleteMany({
                    where: {
                        id: { in: payments.map((p) => p.id) },
                    },
                });
                return {
                    success: false,
                    message: result.message,
                };
            }
        }
        catch (error) {
            console.error("Create multiple fines payment session error:", error.message);
            return {
                success: false,
                message: "Failed to create payment session",
                error: error.message,
            };
        }
    }
    /**
     * Create payment session for debt payment
     */
    async createDebtPaymentSession(debtId, userId, amount, baseURL) {
        try {
            // Fetch debt and user details
            const [debt, user] = await Promise.all([
                prisma.outstandingDebt.findUnique({
                    where: { id: debtId },
                }),
                prisma.user.findUnique({
                    where: { id: userId },
                }),
            ]);
            if (!debt || !user) {
                return {
                    success: false,
                    message: "Debt or user not found",
                };
            }
            // Check if debt is already paid
            if (debt.status === "PAID") {
                return {
                    success: false,
                    message: "Debt is already paid",
                };
            }
            // Generate transaction ID with debt ID embedded
            const transactionId = `DEBT_${debtId}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
            // Prepare payment data
            const paymentData = {
                total_amount: amount,
                currency: "BDT",
                tran_id: transactionId,
                success_url: `${baseURL}/api/payments/sslcommerz/success`,
                fail_url: `${baseURL}/api/payments/sslcommerz/fail`,
                cancel_url: `${baseURL}/api/payments/sslcommerz/cancel`,
                ipn_url: `${baseURL}/api/payments/sslcommerz/ipn`,
                cus_name: `${user.firstName} ${user.lastName}`,
                cus_email: user.email,
                cus_add1: user.presentAddress || "N/A",
                cus_city: user.presentCity || "Dhaka",
                cus_postcode: user.presentPostalCode || "1000",
                cus_country: "Bangladesh",
                cus_phone: user.phone || "N/A",
                shipping_method: "NO",
                product_name: `Debt Payment - ৳${amount}`,
                product_category: "Debt",
                product_profile: "general",
            };
            // Initialize payment with SSLCommerz
            const result = await this.initPayment(paymentData);
            if (result.success) {
                console.log("💳 Debt payment session created:", {
                    debtId,
                    transactionId,
                    amount,
                });
                return {
                    success: true,
                    gatewayPageURL: result.gatewayPageURL,
                    sessionKey: result.sessionKey,
                    transactionId,
                    debtId,
                    amount,
                };
            }
            else {
                return {
                    success: false,
                    message: result.message,
                };
            }
        }
        catch (error) {
            console.error("Create debt payment session error:", error.message);
            return {
                success: false,
                message: "Failed to create payment session",
                error: error.message,
            };
        }
    }
    /**
     * Handle successful payment callback
     */
    async handleSuccessCallback(data) {
        try {
            // Validate payment
            const validation = await this.validatePayment({
                val_id: data.val_id,
                store_id: this.config.store_id,
                store_passwd: this.config.store_passwd,
            });
            if (!validation.success) {
                return {
                    success: false,
                    message: "Payment validation failed",
                };
            }
            const transactionId = data.tran_id;
            const amount = parseFloat(data.amount);
            const cardType = data.card_type;
            const bankTranId = data.bank_tran_id;
            // Check if this is a DEBT payment (transaction ID starts with "DEBT_")
            if (transactionId.startsWith("DEBT_")) {
                console.log("💳 Processing DEBT payment:", transactionId);
                // Extract debtId from transaction ID: DEBT_{debtId}_{timestamp}
                const debtIdMatch = transactionId.match(/DEBT_([^_]+)_/);
                if (!debtIdMatch) {
                    return {
                        success: false,
                        message: "Invalid debt transaction ID format",
                    };
                }
                const debtId = debtIdMatch[1];
                // Import DebtManagementService
                const { DebtManagementService } = await import("./debtManagement.service");
                // Wrap the full debt handling flow in a DB transaction
                return await prisma.$transaction(async (tx) => {
                    // 1) Update debt record
                    const updatedDebt = await DebtManagementService.recordPayment(debtId, amount, bankTranId, tx);
                    console.log("✅ Debt payment recorded:", {
                        debtId,
                        amount,
                        newStatus: updatedDebt.status,
                        paidAmount: updatedDebt.paidAmount,
                        currentAmount: updatedDebt.currentAmount,
                        remaining: updatedDebt.currentAmount - updatedDebt.paidAmount,
                    });
                    // 2) Optional: write a payment transaction log row (idempotent upsert)
                    await tx.transactionLog
                        ?.create?.({
                        data: {
                            referenceId: debtId,
                            referenceType: "DEBT",
                            amount,
                            transactionId: bankTranId,
                            provider: "SSLCOMMERZ",
                            status: "COMPLETED",
                            meta: JSON.stringify({ cardType }),
                        },
                    })
                        .catch(() => { });
                    // 3) Send confirmation email OUTSIDE transaction safety via finally
                    // We resolve success regardless of email outcome
                    // Defer email after commit by returning details
                    return {
                        success: true,
                        message: "Debt payment completed successfully",
                        debt: updatedDebt,
                        paymentType: "DEBT",
                        _email: {
                            debtId,
                            bankTranId,
                            amount,
                            cardType,
                        },
                    };
                });
            }
            // Otherwise, handle as FINE payment (existing logic)
            // Find payment record
            const payment = await prisma.payment.findFirst({
                where: { transactionId },
                include: {
                    fine: {
                        include: {
                            violation: {
                                include: {
                                    rule: true,
                                    vehicle: true,
                                },
                            },
                        },
                    },
                    user: true,
                },
            });
            if (!payment) {
                return {
                    success: false,
                    message: "Payment record not found",
                };
            }
            // Wrap fine payment update in a transaction
            const updatedPayment = await prisma.$transaction(async (tx) => {
                const up = await tx.payment.update({
                    where: { id: payment.id },
                    data: {
                        paymentStatus: "COMPLETED",
                        // Keep original merchant transactionId (FINES_...)
                        // Store gateway reference in a separate field if the schema supports it
                        // gatewayTransactionId: bankTranId,
                    },
                });
                if (payment.fine) {
                    await tx.fine.update({
                        where: { id: payment.fineId },
                        data: {
                            status: "PAID",
                            paidAt: new Date(),
                        },
                    });
                }
                // Optional: log transaction
                await tx.transactionLog
                    ?.create?.({
                    data: {
                        referenceId: payment.fineId || payment.id,
                        referenceType: payment.fine ? "FINE" : "PAYMENT",
                        amount,
                        transactionId: bankTranId,
                        provider: "SSLCOMMERZ",
                        status: "COMPLETED",
                        meta: JSON.stringify({ cardType }),
                    },
                })
                    .catch(() => { });
                return up;
            });
            // Send payment confirmation email
            if (payment.user && payment.fine) {
                try {
                    await emailService.sendPaymentConfirmation({
                        userEmail: payment.user.email,
                        userName: `${payment.user.firstName} ${payment.user.lastName}`,
                        transactionId: bankTranId,
                        amount: amount,
                        paymentMethod: data.card_type || "Online Payment",
                        fineDetails: {
                            violationType: payment.fine.violation?.rule?.title || "Traffic Violation",
                            vehicleNumber: payment.fine.violation?.vehicle?.plateNo || "N/A",
                            fineAmount: payment.fine.amount,
                            issuedDate: payment.fine.issuedAt.toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                            }),
                        },
                        paymentDate: new Date().toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                        }),
                    });
                    console.log("📧 Payment confirmation email sent successfully");
                }
                catch (emailError) {
                    console.error("Failed to send payment confirmation email:", emailError.message);
                    // Don't fail the payment if email fails
                }
            }
            return {
                success: true,
                message: "Payment completed successfully",
                payment: updatedPayment,
                paymentType: "FINE",
            };
        }
        catch (error) {
            console.error("Handle success callback error:", error.message);
            return {
                success: false,
                message: "Failed to process payment",
                error: error.message,
            };
        }
    }
    /**
     * Handle failed payment callback
     */
    async handleFailCallback(data) {
        try {
            const transactionId = data.tran_id;
            // Find payment record
            const payment = await prisma.payment.findFirst({
                where: { transactionId },
            });
            if (payment) {
                // Update payment status
                await prisma.payment.update({
                    where: { id: payment.id },
                    data: {
                        paymentStatus: "FAILED",
                    },
                });
            }
            return {
                success: true,
                message: "Payment failed",
            };
        }
        catch (error) {
            console.error("Handle fail callback error:", error.message);
            return {
                success: false,
                message: "Failed to process payment failure",
                error: error.message,
            };
        }
    }
    /**
     * Handle cancelled payment callback
     */
    async handleCancelCallback(data) {
        try {
            const transactionId = data.tran_id;
            // Find payment record
            const payment = await prisma.payment.findFirst({
                where: { transactionId },
            });
            if (payment) {
                // Delete payment record for cancelled payments
                await prisma.payment.delete({
                    where: { id: payment.id },
                });
            }
            return {
                success: true,
                message: "Payment cancelled",
            };
        }
        catch (error) {
            console.error("Handle cancel callback error:", error.message);
            return {
                success: false,
                message: "Failed to process payment cancellation",
                error: error.message,
            };
        }
    }
}
export const sslCommerzService = new SSLCommerzService();
