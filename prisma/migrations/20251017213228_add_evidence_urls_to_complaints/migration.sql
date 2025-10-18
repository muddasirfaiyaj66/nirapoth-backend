-- AlterTable
ALTER TABLE "complaints" ADD COLUMN     "evidenceUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
