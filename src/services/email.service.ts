import nodemailer from "nodemailer";
import { config } from "../config/env";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface VerificationEmailData {
  email: string;
  firstName: string;
  lastName: string;
  verificationToken: string;
}

interface PasswordResetEmailData {
  email: string;
  firstName: string;
  lastName: string;
  resetToken: string;
}

interface PaymentEmailData {
  userEmail: string;
  userName: string;
  transactionId: string;
  amount: number;
  paymentMethod: string;
  fineDetails: {
    violationType: string;
    vehicleNumber: string;
    fineAmount: number;
    issuedDate: string;
  };
  paymentDate: string;
}

interface DebtPaymentEmailData {
  userEmail: string;
  userName: string;
  transactionId: string;
  amount: number;
  paymentMethod: string;
  debtId: string;
  remainingBalance: number;
  paymentDate: string;
}

/**
 * Email Service for sending various types of emails
 */
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.smtpHost,
      port: config.email.smtpPort,
      secure: config.email.smtpSecure,
      auth: {
        user: config.email.smtpUser,
        pass: config.email.smtpPass,
      },
      connectionTimeout: 10_000, // 10s
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
  }

  /**
   * Send email using the configured transporter
   * @param options - Email options
   */
  private async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const mailOptions = {
        from: `"${config.email.fromName}" <${config.email.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ""),
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${options.to}`);
    } catch (error) {
      const err = error as any;
      console.error("Failed to send email:", {
        code: err?.code,
        command: err?.command,
        message: err?.message,
      });
      throw new Error(
        `Failed to send email: ${err?.code || "UNKNOWN"} ${
          err?.command || ""
        }`.trim()
      );
    }
  }

  /**
   * Send email verification email
   * @param data - Verification email data
   */
  async sendVerificationEmail(data: VerificationEmailData): Promise<void> {
    const verificationUrl = `${config.email.baseUrl}/verify-email?token=${data.verificationToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Email Verification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 5px; }
          .content { padding: 20px; }
          .button { 
            display: inline-block; 
            background-color: #007bff; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
          }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Nirapoth!</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.firstName} ${data.lastName},</h2>
            <p>Thank you for registering with Nirapoth! To complete your registration and verify your email address, please click the button below:</p>
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><a href="${verificationUrl}">${verificationUrl}</a></p>
            <p><strong>Note:</strong> This verification link will expire in 24 hours.</p>
            <p>If you didn't create an account with Nirapoth, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2024 Nirapoth. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: data.email,
      subject: "Verify Your Email Address - Nirapoth",
      html,
    });
  }

  /**
   * Send password reset email
   * @param data - Password reset email data
   */
  async sendPasswordResetEmail(data: PasswordResetEmailData): Promise<void> {
    const resetUrl = `${config.email.baseUrl}/reset-password?token=${data.resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Reset</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 5px; }
          .content { padding: 20px; }
          .button { 
            display: inline-block; 
            background-color: #dc3545; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
          }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.firstName} ${data.lastName},</h2>
            <p>We received a request to reset your password for your Nirapoth account. If you made this request, click the button below to reset your password:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <div class="warning">
              <p><strong>Security Notice:</strong></p>
              <ul>
                <li>This password reset link will expire in 1 hour</li>
                <li>If you didn't request this password reset, please ignore this email</li>
                <li>Your password will not be changed unless you click the link above</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <p>© 2024 Nirapoth. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: data.email,
      subject: "Password Reset Request - Nirapoth",
      html,
    });
  }

  /**
   * Send welcome email after successful verification
   * @param email - User email
   * @param firstName - User first name
   * @param lastName - User last name
   */
  async sendWelcomeEmail(
    email: string,
    firstName: string,
    lastName: string
  ): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to Nirapoth!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #28a745; padding: 20px; text-align: center; border-radius: 5px; color: white; }
          .content { padding: 20px; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to Nirapoth!</h1>
          </div>
          <div class="content">
            <h2>Hello ${firstName} ${lastName},</h2>
            <p>Congratulations! Your email has been successfully verified and your account is now active.</p>
            <p>You can now:</p>
            <ul>
              <li>Log in to your account</li>
              <li>Complete your profile</li>
              <li>Access all Nirapoth features</li>
            </ul>
            <p>Thank you for joining our community!</p>
          </div>
          <div class="footer">
            <p>© 2024 Nirapoth. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: "Welcome to Nirapoth! 🎉",
      html,
    });
  }

  /**
   * Test email configuration
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log("Email service connection verified");
      return true;
    } catch (error) {
      console.error("Email service connection failed:", error);
      return false;
    }
  }

  /**
   * Send payment confirmation email
   * @param data - Payment email data
   */
  async sendPaymentConfirmation(data: PaymentEmailData): Promise<boolean> {
    try {
      const html = this.generatePaymentConfirmationEmail(data);

      await this.sendEmail({
        to: data.userEmail,
        subject: `Payment Confirmation - Transaction ${data.transactionId}`,
        html,
      });

      console.log("Payment confirmation email sent to:", data.userEmail);
      return true;
    } catch (error: any) {
      console.error("Error sending payment confirmation email:", error.message);
      return false;
    }
  }

  /**
   * Generate HTML email template for payment confirmation
   * @param data - Payment email data
   */
  private generatePaymentConfirmationEmail(data: PaymentEmailData): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Confirmation</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f7fa;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 30px;
      text-align: center;
      color: #ffffff;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 10px;
      letter-spacing: 2px;
    }
    .logo-subtitle {
      font-size: 14px;
      opacity: 0.9;
      letter-spacing: 1px;
    }
    .success-icon {
      width: 80px;
      height: 80px;
      background-color: #10b981;
      border-radius: 50%;
      margin: 30px auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40px;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 24px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 15px;
    }
    .message {
      font-size: 16px;
      color: #6b7280;
      margin-bottom: 30px;
      line-height: 1.8;
    }
    .details-section {
      background-color: #f9fafb;
      border-radius: 8px;
      padding: 25px;
      margin-bottom: 25px;
    }
    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 15px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-size: 14px;
      color: #6b7280;
    }
    .detail-value {
      font-size: 14px;
      font-weight: 600;
      color: #1f2937;
      text-align: right;
    }
    .amount-highlight {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      margin: 25px 0;
    }
    .amount-label {
      font-size: 14px;
      opacity: 0.9;
      margin-bottom: 5px;
    }
    .amount-value {
      font-size: 36px;
      font-weight: bold;
    }
    .transaction-id {
      background-color: #f3f4f6;
      border-left: 4px solid #667eea;
      padding: 15px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      color: #4b5563;
      margin: 20px 0;
      word-break: break-all;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
      margin: 20px 0;
      transition: transform 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
    }
    .footer {
      background-color: #f9fafb;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer-text {
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 15px;
    }
    .social-links {
      margin: 20px 0;
    }
    .social-link {
      display: inline-block;
      margin: 0 10px;
      color: #667eea;
      text-decoration: none;
      font-size: 13px;
    }
    .divider {
      height: 1px;
      background: linear-gradient(to right, transparent, #e5e7eb, transparent);
      margin: 30px 0;
    }
    .info-box {
      background-color: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
    }
    .info-box-text {
      font-size: 13px;
      color: #1e40af;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="header">
      <div class="logo">NIRAPOTH</div>
      <div class="logo-subtitle">Traffic Management System</div>
    </div>

    <!-- Success Icon -->
    <div style="text-align: center; background-color: white;">
      <div class="success-icon">✓</div>
      <h2 style="color: #10b981; font-size: 24px; margin-bottom: 30px;">Payment Successful!</h2>
    </div>

    <!-- Main Content -->
    <div class="content">
      <div class="greeting">Dear ${data.userName},</div>
      <p class="message">
        Thank you for your payment. We have successfully received and processed your fine payment. 
        Your traffic fine has been marked as paid and you are now in good standing.
      </p>

      <!-- Amount Highlight -->
      <div class="amount-highlight">
        <div class="amount-label">AMOUNT PAID</div>
        <div class="amount-value">৳${data.amount.toLocaleString()}</div>
      </div>

      <!-- Transaction ID -->
      <div class="transaction-id">
        <strong>Transaction ID:</strong> ${data.transactionId}
      </div>

      <!-- Payment Details -->
      <div class="details-section">
        <div class="section-title">Payment Details</div>
        <div class="detail-row">
          <span class="detail-label">Payment Date</span>
          <span class="detail-value">${data.paymentDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Payment Method</span>
          <span class="detail-value">${data.paymentMethod}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Transaction ID</span>
          <span class="detail-value">${data.transactionId.substring(
            0,
            20
          )}...</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Amount Paid</span>
          <span class="detail-value">৳${data.amount.toLocaleString()}</span>
        </div>
      </div>

      <!-- Fine Details -->
      <div class="details-section">
        <div class="section-title">Fine Details</div>
        <div class="detail-row">
          <span class="detail-label">Violation Type</span>
          <span class="detail-value">${data.fineDetails.violationType}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Vehicle Number</span>
          <span class="detail-value">${data.fineDetails.vehicleNumber}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Fine Amount</span>
          <span class="detail-value">৳${data.fineDetails.fineAmount.toLocaleString()}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Issued Date</span>
          <span class="detail-value">${data.fineDetails.issuedDate}</span>
        </div>
      </div>

      <!-- Important Information -->
      <div class="info-box">
        <p class="info-box-text">
          <strong>📌 Important:</strong> Please keep this email as proof of payment. 
          You can also download your payment receipt from your dashboard at any time.
        </p>
      </div>

      <div class="divider"></div>

      <!-- Call to Action -->
      <div style="text-align: center;">
        <a href="${config.email.baseUrl}/dashboard" class="button">
          View Dashboard
        </a>
      </div>

      <!-- Additional Info -->
      <p class="message" style="margin-top: 30px; font-size: 14px;">
        If you have any questions about this payment or need assistance, 
        please don't hesitate to contact our support team.
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p class="footer-text">
        <strong>Nirapoth Traffic Management System</strong><br>
        Making Roads Safer for Everyone
      </p>
      
      <div class="social-links">
        <a href="${config.email.baseUrl}" class="social-link">Website</a> |
        <a href="mailto:support@nirapoth.com" class="social-link">Support</a> |
        <a href="${
          config.email.baseUrl
        }/privacy" class="social-link">Privacy Policy</a>
      </div>

      <p class="footer-text" style="font-size: 12px; margin-top: 20px;">
        This is an automated email. Please do not reply to this message.<br>
        For support, contact us at <a href="mailto:support@nirapoth.com" style="color: #667eea;">support@nirapoth.com</a>
      </p>

      <p class="footer-text" style="font-size: 11px; color: #9ca3af; margin-top: 15px;">
        © ${new Date().getFullYear()} Nirapoth. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Send debt payment confirmation email
   * @param data - Debt payment email data
   */
  async sendDebtPaymentConfirmation(data: DebtPaymentEmailData): Promise<void> {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Debt Payment Confirmation</title>
  <style>
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      margin: 0; 
      padding: 0; 
      background-color: #f5f7fa; 
    }
    .container { 
      max-width: 650px; 
      margin: 40px auto; 
      background-color: #ffffff; 
      border-radius: 12px; 
      overflow: hidden; 
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); 
    }
    .header { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 35px 20px; 
      text-align: center; 
      color: white; 
    }
    .header h1 { 
      margin: 0; 
      font-size: 28px; 
      font-weight: 600; 
    }
    .header p { 
      margin: 10px 0 0; 
      font-size: 16px; 
      opacity: 0.9; 
    }
    .content { 
      padding: 40px 35px; 
    }
    .message { 
      font-size: 16px; 
      color: #4a5568; 
      margin-bottom: 25px; 
    }
    .success-badge {
      background-color: #10b981;
      color: white;
      padding: 12px 25px;
      border-radius: 25px;
      display: inline-block;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
    }
    .details-box { 
      background-color: #f8fafc; 
      border: 2px solid #e2e8f0; 
      border-radius: 10px; 
      padding: 25px; 
      margin: 25px 0; 
    }
    .detail-row { 
      display: flex; 
      justify-content: space-between; 
      padding: 12px 0; 
      border-bottom: 1px solid #e2e8f0; 
    }
    .detail-row:last-child { 
      border-bottom: none; 
    }
    .detail-label { 
      font-weight: 600; 
      color: #4a5568; 
    }
    .detail-value { 
      color: #1a202c; 
      font-weight: 500; 
    }
    .highlight-box {
      background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
      border-left: 4px solid #667eea;
      padding: 20px;
      border-radius: 8px;
      margin: 25px 0;
    }
    .amount-highlight { 
      font-size: 32px; 
      font-weight: 700; 
      color: #667eea; 
      margin: 15px 0; 
    }
    .remaining-balance {
      font-size: 24px;
      font-weight: 700;
      color: ${data.remainingBalance > 0 ? "#f59e0b" : "#10b981"};
      margin: 10px 0;
    }
    .button { 
      display: inline-block; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white; 
      padding: 14px 35px; 
      text-decoration: none; 
      border-radius: 8px; 
      font-weight: 600; 
      margin-top: 20px; 
      transition: transform 0.2s; 
    }
    .button:hover { 
      transform: translateY(-2px); 
    }
    .footer { 
      background-color: #f8fafc; 
      padding: 30px; 
      text-align: center; 
      border-top: 1px solid #e2e8f0; 
    }
    .footer-text { 
      color: #718096; 
      font-size: 14px; 
      margin: 5px 0; 
    }
    .divider { 
      height: 1px; 
      background: linear-gradient(to right, transparent, #e2e8f0, transparent); 
      margin: 30px 0; 
    }
    .info-box {
      background-color: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 15px 20px;
      border-radius: 6px;
      margin: 20px 0;
    }
    .info-box-text {
      color: #1e40af;
      margin: 0;
      font-size: 14px;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      margin-left: 10px;
    }
    .status-paid {
      background-color: #d1fae5;
      color: #065f46;
    }
    .status-partial {
      background-color: #fef3c7;
      color: #92400e;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>💳 Debt Payment Confirmed</h1>
      <p>Thank you for your payment</p>
    </div>

    <!-- Content -->
    <div class="content">
      <p class="message">
        Dear <strong>${data.userName}</strong>,
      </p>

      <p class="message">
        Your debt payment has been successfully processed and confirmed. 
        ${
          data.remainingBalance > 0
            ? "A partial payment has been applied to your outstanding balance."
            : "Your debt has been fully cleared! 🎉"
        }
      </p>

      <div style="text-align: center;">
        <span class="success-badge">
          ✅ Payment Successful
        </span>
      </div>

      <!-- Payment Details -->
      <div class="details-box">
        <h3 style="margin-top: 0; color: #667eea;">💰 Payment Details</h3>
        
        <div class="detail-row">
          <span class="detail-label">Transaction ID:</span>
          <span class="detail-value">${data.transactionId}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Debt ID:</span>
          <span class="detail-value">${data.debtId}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Payment Date:</span>
          <span class="detail-value">${data.paymentDate}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Payment Method:</span>
          <span class="detail-value">${data.paymentMethod}</span>
        </div>
      </div>

      <!-- Amount Paid -->
      <div class="highlight-box">
        <p style="margin: 0 0 10px; color: #4a5568; font-weight: 600;">Amount Paid:</p>
        <div class="amount-highlight">৳${data.amount.toLocaleString()}</div>
      </div>

      <!-- Remaining Balance -->
      <div class="highlight-box">
        <p style="margin: 0 0 10px; color: #4a5568; font-weight: 600;">
          Remaining Balance:
          ${
            data.remainingBalance === 0
              ? '<span class="status-badge status-paid">FULLY PAID</span>'
              : '<span class="status-badge status-partial">PARTIAL PAYMENT</span>'
          }
        </p>
        <div class="remaining-balance">৳${data.remainingBalance.toLocaleString()}</div>
        ${
          data.remainingBalance > 0
            ? '<p style="color: #f59e0b; margin: 10px 0 0; font-size: 14px;">⚠️ You still have an outstanding balance. Please clear it at your earliest convenience.</p>'
            : '<p style="color: #10b981; margin: 10px 0 0; font-size: 14px;">🎉 Congratulations! Your debt has been fully cleared.</p>'
        }
      </div>

      ${
        data.remainingBalance === 0
          ? `
      <!-- Success Message -->
      <div class="info-box" style="background-color: #d1fae5; border-left-color: #10b981;">
        <p class="info-box-text" style="color: #065f46;">
          <strong>✨ Great News!</strong> Your account is now clear with no outstanding debts. 
          Your positive balance is available for withdrawal.
        </p>
      </div>
      `
          : ""
      }

      <!-- Important Information -->
      <div class="info-box">
        <p class="info-box-text">
          <strong>📌 Important:</strong> Please keep this email as proof of payment. 
          You can view your complete payment history in your dashboard.
        </p>
      </div>

      <div class="divider"></div>

      <!-- Call to Action -->
      <div style="text-align: center;">
        <a href="${
          config.email.baseUrl
        }/dashboard/citizen/rewards" class="button">
          View My Balance
        </a>
      </div>

      <!-- Additional Info -->
      <p class="message" style="margin-top: 30px; font-size: 14px;">
        ${
          data.remainingBalance > 0
            ? "To clear your remaining balance, please visit your dashboard and make another payment."
            : "Thank you for clearing your debt promptly. Your cooperation helps us maintain a better traffic management system."
        }
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p class="footer-text">
        <strong>Nirapoth Traffic Management System</strong><br>
        Making Roads Safer for Everyone
      </p>
      
      <p class="footer-text" style="font-size: 12px; margin-top: 20px;">
        This is an automated email. Please do not reply to this message.<br>
        For support, contact us at <a href="mailto:support@nirapoth.com" style="color: #667eea;">support@nirapoth.com</a>
      </p>

      <p class="footer-text" style="font-size: 11px; color: #9ca3af; margin-top: 15px;">
        © ${new Date().getFullYear()} Nirapoth. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    await this.sendEmail({
      to: data.userEmail,
      subject: "Debt Payment Confirmation - Nirapoth",
      html,
    });
  }
}
