import {
  SESClient,
  SendEmailCommand,
  SendTemplatedEmailCommand,
  CreateTemplateCommand,
  UpdateTemplateCommand,
  DeleteTemplateCommand,
  GetTemplateCommand,
  ListTemplatesCommand,
} from '@aws-sdk/client-ses';
import { logger } from '@/utils/logger';
import { config } from '@/config/app.config';

export interface EmailTemplate {
  TemplateName: string;
  SubjectPart: string;
  HtmlPart: string;
  TextPart?: string | undefined;
}

export interface EmailData {
  to: string | string[];
  from?: string;
  subject?: string;
  htmlBody?: string;
  textBody?: string;
  templateName?: string;
  templateData?: Record<string, string>;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string | undefined;
  error?: string | undefined;
}

export class SESService {
  private client: SESClient;
  private defaultFromEmail: string;

  constructor() {
    this.client = new SESClient({
      region: config.aws.region,
      credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      },
    });
    this.defaultFromEmail =
      config.aws.ses.fromEmail || 'noreply@yourdomain.com';
  }

  /**
   * Send a simple email
   */
  async sendEmail(emailData: EmailData): Promise<SendEmailResult> {
    try {
      const command = new SendEmailCommand({
        Source: emailData.from || this.defaultFromEmail,
        Destination: {
          ToAddresses: Array.isArray(emailData.to)
            ? emailData.to
            : [emailData.to],
          CcAddresses: emailData.cc
            ? Array.isArray(emailData.cc)
              ? emailData.cc
              : [emailData.cc]
            : undefined,
          BccAddresses: emailData.bcc
            ? Array.isArray(emailData.bcc)
              ? emailData.bcc
              : [emailData.bcc]
            : undefined,
        },
        Message: {
          Subject: {
            Data: emailData.subject || 'No Subject',
            Charset: 'UTF-8',
          },
          Body: {
            Html: emailData.htmlBody
              ? {
                  Data: emailData.htmlBody,
                  Charset: 'UTF-8',
                }
              : undefined,
            Text: emailData.textBody
              ? {
                  Data: emailData.textBody,
                  Charset: 'UTF-8',
                }
              : undefined,
          },
        },
        ReplyToAddresses: emailData.replyTo ? [emailData.replyTo] : undefined,
      });

      const result = await this.client.send(command);

      logger.info('Email sent successfully', {
        messageId: result.MessageId,
        to: emailData.to,
        subject: emailData.subject,
      });

      return {
        success: true,
        messageId: result.MessageId,
      };
    } catch (error) {
      logger.error('Failed to send email', {
        error: error instanceof Error ? error.message : String(error),
        to: emailData.to,
        subject: emailData.subject,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Send email using a template
   */
  async sendTemplatedEmail(emailData: EmailData): Promise<SendEmailResult> {
    if (!emailData.templateName || !emailData.templateData) {
      throw new Error(
        'Template name and template data are required for templated emails'
      );
    }

    try {
      const command = new SendTemplatedEmailCommand({
        Source: emailData.from || this.defaultFromEmail,
        Destination: {
          ToAddresses: Array.isArray(emailData.to)
            ? emailData.to
            : [emailData.to],
          CcAddresses: emailData.cc
            ? Array.isArray(emailData.cc)
              ? emailData.cc
              : [emailData.cc]
            : undefined,
          BccAddresses: emailData.bcc
            ? Array.isArray(emailData.bcc)
              ? emailData.bcc
              : [emailData.bcc]
            : undefined,
        },
        Template: emailData.templateName,
        TemplateData: JSON.stringify(emailData.templateData),
        ReplyToAddresses: emailData.replyTo ? [emailData.replyTo] : undefined,
      });

      const result = await this.client.send(command);

      logger.info('Templated email sent successfully', {
        messageId: result.MessageId,
        templateName: emailData.templateName,
        to: emailData.to,
      });

      return {
        success: true,
        messageId: result.MessageId,
      };
    } catch (error) {
      logger.error('Failed to send templated email', {
        error: error instanceof Error ? error.message : String(error),
        templateName: emailData.templateName,
        to: emailData.to,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Create a new email template
   */
  async createTemplate(template: EmailTemplate): Promise<boolean> {
    try {
      const command = new CreateTemplateCommand({
        Template: {
          TemplateName: template.TemplateName,
          SubjectPart: template.SubjectPart,
          HtmlPart: template.HtmlPart,
          TextPart: template.TextPart,
        },
      });

      await this.client.send(command);

      logger.info('Email template created successfully', {
        templateName: template.TemplateName,
      });

      return true;
    } catch (error) {
      logger.error('Failed to create email template', {
        error: error instanceof Error ? error.message : String(error),
        templateName: template.TemplateName,
      });

      return false;
    }
  }

  /**
   * Update an existing email template
   */
  async updateTemplate(template: EmailTemplate): Promise<boolean> {
    try {
      const command = new UpdateTemplateCommand({
        Template: {
          TemplateName: template.TemplateName,
          SubjectPart: template.SubjectPart,
          HtmlPart: template.HtmlPart,
          TextPart: template.TextPart,
        },
      });

      await this.client.send(command);

      logger.info('Email template updated successfully', {
        templateName: template.TemplateName,
      });

      return true;
    } catch (error) {
      logger.error('Failed to update email template', {
        error: error instanceof Error ? error.message : String(error),
        templateName: template.TemplateName,
      });

      return false;
    }
  }

  /**
   * Delete an email template
   */
  async deleteTemplate(templateName: string): Promise<boolean> {
    try {
      const command = new DeleteTemplateCommand({
        TemplateName: templateName,
      });

      await this.client.send(command);

      logger.info('Email template deleted successfully', {
        templateName,
      });

      return true;
    } catch (error) {
      logger.error('Failed to delete email template', {
        error: error instanceof Error ? error.message : String(error),
        templateName,
      });

      return false;
    }
  }

  /**
   * Get an email template
   */
  async getTemplate(templateName: string): Promise<EmailTemplate | null> {
    try {
      const command = new GetTemplateCommand({
        TemplateName: templateName,
      });

      const result = await this.client.send(command);

      if (
        result.Template &&
        result.Template.TemplateName &&
        result.Template.SubjectPart &&
        result.Template.HtmlPart
      ) {
        return {
          TemplateName: result.Template.TemplateName,
          SubjectPart: result.Template.SubjectPart,
          HtmlPart: result.Template.HtmlPart,
          TextPart: result.Template.TextPart,
        };
      }

      return null;
    } catch (error) {
      logger.error('Failed to get email template', {
        error: error instanceof Error ? error.message : String(error),
        templateName,
      });

      return null;
    }
  }

  /**
   * List all email templates
   */
  async listTemplates(): Promise<string[]> {
    try {
      const command = new ListTemplatesCommand({});
      const result = await this.client.send(command);

      return (
        result.TemplatesMetadata?.map(template => template.Name).filter(
          (name): name is string => Boolean(name)
        ) || []
      );
    } catch (error) {
      logger.error('Failed to list email templates', {
        error: error instanceof Error ? error.message : String(error),
      });

      return [];
    }
  }

  /**
   * Create or update template (upsert)
   */
  async upsertTemplate(template: EmailTemplate): Promise<boolean> {
    try {
      // Try to get the template first
      const existingTemplate = await this.getTemplate(template.TemplateName);

      if (existingTemplate) {
        // Template exists, update it
        return await this.updateTemplate(template);
      } else {
        // Template doesn't exist, create it
        return await this.createTemplate(template);
      }
    } catch (error) {
      logger.error('Failed to upsert email template', {
        error: error instanceof Error ? error.message : String(error),
        templateName: template.TemplateName,
      });

      return false;
    }
  }

  /**
   * Send a welcome email using template
   */
  async sendWelcomeEmail(
    to: string,
    userName: string
  ): Promise<SendEmailResult> {
    const templateData = {
      userName,
      loginUrl: `${config.app.frontendUrl}/login`,
      supportEmail: config.app.supportEmail || 'support@yourdomain.com',
    };

    return await this.sendTemplatedEmail({
      to,
      from: this.defaultFromEmail,
      templateName: 'WelcomeEmail',
      templateData,
    });
  }

  /**
   * Send a password reset email using template
   */
  async sendPasswordResetEmail(
    to: string,
    resetToken: string,
    userName: string
  ): Promise<SendEmailResult> {
    const resetUrl = `${config.app.frontendUrl}/reset-password?token=${resetToken}`;

    const templateData = {
      userName,
      resetUrl,
      expiryHours: '24',
      supportEmail: config.app.supportEmail || 'support@yourdomain.com',
    };

    return await this.sendTemplatedEmail({
      to,
      from: this.defaultFromEmail,
      templateName: 'PasswordResetEmail',
      templateData,
    });
  }

  /**
   * Send a notification email using template
   */
  async sendNotificationEmail(
    to: string,
    notificationType: string,
    data: Record<string, string>
  ): Promise<SendEmailResult> {
    const templateData = {
      notificationType,
      ...data,
      supportEmail: config.app.supportEmail || 'support@yourdomain.com',
    };

    return await this.sendTemplatedEmail({
      to,
      from: this.defaultFromEmail,
      templateName: 'NotificationEmail',
      templateData,
    });
  }
}

// Export a singleton instance
export const sesService = new SESService();
