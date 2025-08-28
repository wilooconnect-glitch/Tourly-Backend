import { sesService, EmailTemplate } from './sesService';
import { logger } from '@/utils/logger';

export class EmailTemplateManager {
  /**
   * Initialize default email templates
   */
  async initializeDefaultTemplates(): Promise<void> {
    try {
      await this.createWelcomeTemplate();
      await this.createPasswordResetTemplate();
      await this.createNotificationTemplate();
      await this.createVerificationTemplate();
      await this.createOrderConfirmationTemplate();

      logger.info('Default email templates initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize default email templates', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Create welcome email template
   */
  async createWelcomeTemplate(): Promise<boolean> {
    const template: EmailTemplate = {
      TemplateName: 'WelcomeEmail',
      SubjectPart: 'Welcome to {{appName}}, {{userName}}!',
      HtmlPart: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to {{appName}}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to {{appName}}!</h1>
            </div>
            <div class="content">
              <h2>Hello {{userName}},</h2>
              <p>Welcome to {{appName}}! We're excited to have you on board.</p>
              <p>Your account has been successfully created and you can now access all our features.</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="{{loginUrl}}" class="button">Get Started</a>
              </p>
              <p>If you have any questions, feel free to contact our support team at <a href="mailto:{{supportEmail}}">{{supportEmail}}</a>.</p>
              <p>Best regards,<br>The {{appName}} Team</p>
            </div>
            <div class="footer">
              <p>This email was sent to {{userEmail}}. If you didn't create an account, please ignore this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      TextPart: `
        Welcome to {{appName}}, {{userName}}!
        
        Hello {{userName}},
        
        Welcome to {{appName}}! We're excited to have you on board.
        Your account has been successfully created and you can now access all our features.
        
        Get started: {{loginUrl}}
        
        If you have any questions, feel free to contact our support team at {{supportEmail}}.
        
        Best regards,
        The {{appName}} Team
        
        This email was sent to {{userEmail}}. If you didn't create an account, please ignore this email.
      `,
    };

    return await sesService.upsertTemplate(template);
  }

  /**
   * Create password reset email template
   */
  async createPasswordResetTemplate(): Promise<boolean> {
    const template: EmailTemplate = {
      TemplateName: 'PasswordResetEmail',
      SubjectPart: 'Reset Your Password - {{appName}}',
      HtmlPart: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Reset Your Password</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Reset Your Password</h1>
            </div>
            <div class="content">
              <h2>Hello {{userName}},</h2>
              <p>We received a request to reset your password for your {{appName}} account.</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="{{resetUrl}}" class="button">Reset Password</a>
              </p>
              <div class="warning">
                <strong>Important:</strong> This link will expire in {{expiryHours}} hours for security reasons.
              </div>
              <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
              <p>If you have any questions, contact our support team at <a href="mailto:{{supportEmail}}">{{supportEmail}}</a>.</p>
              <p>Best regards,<br>The {{appName}} Team</p>
            </div>
            <div class="footer">
              <p>This email was sent to {{userEmail}}. If you didn't request a password reset, please ignore this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      TextPart: `
        Reset Your Password - {{appName}}
        
        Hello {{userName}},
        
        We received a request to reset your password for your {{appName}} account.
        
        Reset your password: {{resetUrl}}
        
        Important: This link will expire in {{expiryHours}} hours for security reasons.
        
        If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
        
        If you have any questions, contact our support team at {{supportEmail}}.
        
        Best regards,
        The {{appName}} Team
        
        This email was sent to {{userEmail}}. If you didn't request a password reset, please ignore this email.
      `,
    };

    return await sesService.upsertTemplate(template);
  }

  /**
   * Create notification email template
   */
  async createNotificationTemplate(): Promise<boolean> {
    const template: EmailTemplate = {
      TemplateName: 'NotificationEmail',
      SubjectPart: '{{notificationType}} - {{appName}}',
      HtmlPart: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>{{notificationType}}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #17a2b8; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #17a2b8; color: white; text-decoration: none; border-radius: 5px; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>{{notificationType}}</h1>
            </div>
            <div class="content">
              <h2>Hello {{userName}},</h2>
              <p>{{message}}</p>
              {{#if actionUrl}}
              <p style="text-align: center; margin: 30px 0;">
                <a href="{{actionUrl}}" class="button">{{actionText}}</a>
              </p>
              {{/if}}
              <p>If you have any questions, contact our support team at <a href="mailto:{{supportEmail}}">{{supportEmail}}</a>.</p>
              <p>Best regards,<br>The {{appName}} Team</p>
            </div>
            <div class="footer">
              <p>This email was sent to {{userEmail}}. You can manage your notification preferences in your account settings.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      TextPart: `
        {{notificationType}} - {{appName}}
        
        Hello {{userName}},
        
        {{message}}
        
        {{#if actionUrl}}
        {{actionText}}: {{actionUrl}}
        {{/if}}
        
        If you have any questions, contact our support team at {{supportEmail}}.
        
        Best regards,
        The {{appName}} Team
        
        This email was sent to {{userEmail}}. You can manage your notification preferences in your account settings.
      `,
    };

    return await sesService.upsertTemplate(template);
  }

  /**
   * Create email verification template
   */
  async createVerificationTemplate(): Promise<boolean> {
    const template: EmailTemplate = {
      TemplateName: 'EmailVerification',
      SubjectPart: 'Verify Your Email Address - {{appName}}',
      HtmlPart: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Verify Your Email</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Verify Your Email Address</h1>
            </div>
            <div class="content">
              <h2>Hello {{userName}},</h2>
              <p>Please verify your email address to complete your registration with {{appName}}.</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="{{verificationUrl}}" class="button">Verify Email</a>
              </p>
              <p>If you didn't create an account, please ignore this email.</p>
              <p>If you have any questions, contact our support team at <a href="mailto:{{supportEmail}}">{{supportEmail}}</a>.</p>
              <p>Best regards,<br>The {{appName}} Team</p>
            </div>
            <div class="footer">
              <p>This email was sent to {{userEmail}}. If you didn't create an account, please ignore this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      TextPart: `
        Verify Your Email Address - {{appName}}
        
        Hello {{userName}},
        
        Please verify your email address to complete your registration with {{appName}}.
        
        Verify your email: {{verificationUrl}}
        
        If you didn't create an account, please ignore this email.
        
        If you have any questions, contact our support team at {{supportEmail}}.
        
        Best regards,
        The {{appName}} Team
        
        This email was sent to {{userEmail}}. If you didn't create an account, please ignore this email.
      `,
    };

    return await sesService.upsertTemplate(template);
  }

  /**
   * Create order confirmation template
   */
  async createOrderConfirmationTemplate(): Promise<boolean> {
    const template: EmailTemplate = {
      TemplateName: 'OrderConfirmation',
      SubjectPart: 'Order Confirmation #{{orderNumber}} - {{appName}}',
      HtmlPart: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Order Confirmation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #6f42c1; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .order-details { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 24px; background-color: #6f42c1; color: white; text-decoration: none; border-radius: 5px; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Order Confirmation</h1>
            </div>
            <div class="content">
              <h2>Hello {{userName}},</h2>
              <p>Thank you for your order! We've received your order and it's being processed.</p>
              
              <div class="order-details">
                <h3>Order Details</h3>
                <p><strong>Order Number:</strong> {{orderNumber}}</p>
                <p><strong>Order Date:</strong> {{orderDate}}</p>
                <p><strong>Total Amount:</strong> {{totalAmount}}</p>
                <p><strong>Payment Method:</strong> {{paymentMethod}}</p>
              </div>
              
              <p style="text-align: center; margin: 30px 0;">
                <a href="{{orderUrl}}" class="button">View Order</a>
              </p>
              
              <p>We'll send you an email when your order ships.</p>
              <p>If you have any questions, contact our support team at <a href="mailto:{{supportEmail}}">{{supportEmail}}</a>.</p>
              <p>Best regards,<br>The {{appName}} Team</p>
            </div>
            <div class="footer">
              <p>This email was sent to {{userEmail}}. Thank you for choosing {{appName}}!</p>
            </div>
          </div>
        </body>
        </html>
      `,
      TextPart: `
        Order Confirmation #{{orderNumber}} - {{appName}}
        
        Hello {{userName}},
        
        Thank you for your order! We've received your order and it's being processed.
        
        Order Details:
        - Order Number: {{orderNumber}}
        - Order Date: {{orderDate}}
        - Total Amount: {{totalAmount}}
        - Payment Method: {{paymentMethod}}
        
        View your order: {{orderUrl}}
        
        We'll send you an email when your order ships.
        
        If you have any questions, contact our support team at {{supportEmail}}.
        
        Best regards,
        The {{appName}} Team
        
        This email was sent to {{userEmail}}. Thank you for choosing {{appName}}!
      `,
    };

    return await sesService.upsertTemplate(template);
  }

  /**
   * Get all available template names
   */
  async getAvailableTemplates(): Promise<string[]> {
    return await sesService.listTemplates();
  }

  /**
   * Check if a template exists
   */
  async templateExists(templateName: string): Promise<boolean> {
    const templates = await this.getAvailableTemplates();
    return templates.includes(templateName);
  }

  /**
   * Delete a template
   */
  async deleteTemplate(templateName: string): Promise<boolean> {
    return await sesService.deleteTemplate(templateName);
  }

  /**
   * Get template details
   */
  async getTemplate(templateName: string): Promise<EmailTemplate | null> {
    return await sesService.getTemplate(templateName);
  }
}

// Export a singleton instance
export const emailTemplateManager = new EmailTemplateManager();
