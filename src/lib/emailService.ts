import { supabase } from './supabase'

export interface EmailData {
  to: string
  subject: string
  html: string
  text?: string
}

export interface InvoiceEmailData {
  clientEmail: string
  clientName: string
  invoiceNumber: string
  amount: number
  dueDate: string
  items: Array<{
    description: string
    hours: number
    rate: number
    total: number
  }>
  dateRange: {
    start: string
    end: string
  }
}

export interface InvitationEmailData {
  recipientEmail: string
  recipientName: string
  companyName: string
  inviterName: string
  role: string
  invitationToken: string
  expiresAt: string
}

export class EmailService {
  /**
   * Send invoice email to client
   */
  static async sendInvoiceEmail(invoiceData: InvoiceEmailData): Promise<void> {
    const emailHtml = this.generateInvoiceEmailHTML(invoiceData)
    const emailText = this.generateInvoiceEmailText(invoiceData)

    const emailData: EmailData = {
      to: invoiceData.clientEmail,
      subject: `Invoice ${invoiceData.invoiceNumber} from TeamFlow - $${invoiceData.amount.toLocaleString()}`,
      html: emailHtml,
      text: emailText
    }

    return this.sendEmail(emailData)
  }

  /**
   * Send invitation email to user
   */
  static async sendInvitationEmail(invitationData: InvitationEmailData): Promise<void> {
    const emailHtml = this.generateInvitationEmailHTML(invitationData)
    const emailText = this.generateInvitationEmailText(invitationData)

    const emailData: EmailData = {
      to: invitationData.recipientEmail,
      subject: `Invitation to join ${invitationData.companyName} on TeamFlow`,
      html: emailHtml,
      text: emailText
    }

    return this.sendEmail(emailData)
  }

  /**
   * Send email using Supabase Edge Functions
   */
  static async sendEmail(emailData: EmailData): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: emailData
      })

      if (error) {
        console.error('Email sending error:', error)
        throw new Error(`Failed to send email: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('Error sending email:', error)
      throw error
    }
  }

  /**
   * Generate HTML template for invoice email
   */
  private static generateInvoiceEmailHTML(invoiceData: InvoiceEmailData): string {
    const { clientName, invoiceNumber, amount, dueDate, items, dateRange } = invoiceData
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${invoiceNumber} - TeamFlow</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #6366f1;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #6366f1;
    }
    .invoice-details {
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .services-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .services-table th,
    .services-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    .services-table th {
      background-color: #f8f9fa;
      font-weight: bold;
    }
    .total-row {
      background-color: #6366f1;
      color: white;
      font-weight: bold;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">TeamFlow</div>
      <h1>Invoice ${invoiceNumber}</h1>
    </div>
    
    <p>Dear ${clientName} Team,</p>
    
    <p>I hope this email finds you well. Please find the details for invoice ${invoiceNumber} below.</p>
    
    <div class="invoice-details">
      <h3>Invoice Details</h3>
      <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
      <p><strong>Amount:</strong> $${amount.toLocaleString()}</p>
      <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
      <p><strong>Service Period:</strong> ${new Date(dateRange.start).toLocaleDateString()} - ${new Date(dateRange.end).toLocaleDateString()}</p>
    </div>
    
    <h3>Services Provided</h3>
    <table class="services-table">
      <thead>
        <tr>
          <th>Description</th>
          <th>Hours</th>
          <th>Rate</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => `
          <tr>
            <td>${item.description}</td>
            <td>${item.hours}h</td>
            <td>$${item.rate.toFixed(2)}</td>
            <td>$${item.total.toLocaleString()}</td>
          </tr>
        `).join('')}
        <tr class="total-row">
          <td colspan="3">Total Amount</td>
          <td>$${amount.toLocaleString()}</td>
        </tr>
      </tbody>
    </table>
    
    <h3>Payment Information</h3>
    <p><strong>Payment Terms:</strong> Net 30 days</p>
    <p>Payment can be made via:</p>
    <ul>
      <li>Bank transfer</li>
      <li>Check</li>
      <li>Online payment (if available)</li>
    </ul>
    <p>Please reference invoice number <strong>${invoiceNumber}</strong> with your payment.</p>
    
    <p>If you have any questions regarding this invoice, please don't hesitate to contact us.</p>
    
    <p>Thank you for your business!</p>
    
    <p>Best regards,<br>Your TeamFlow Team</p>
    
    <div class="footer">
      <p>© 2025 TeamFlow. All rights reserved.</p>
      <p>This invoice was generated automatically by TeamFlow.</p>
    </div>
  </div>
</body>
</html>`
  }

  /**
   * Generate plain text version of invoice email
   */
  private static generateInvoiceEmailText(invoiceData: InvoiceEmailData): string {
    const { clientName, invoiceNumber, amount, dueDate, items, dateRange } = invoiceData
    
    return `
Dear ${clientName} Team,

I hope this email finds you well. Please find the details for invoice ${invoiceNumber} below.

Invoice Details:
- Invoice Number: ${invoiceNumber}
- Amount: $${amount.toLocaleString()}
- Due Date: ${new Date(dueDate).toLocaleDateString()}
- Service Period: ${new Date(dateRange.start).toLocaleDateString()} - ${new Date(dateRange.end).toLocaleDateString()}

Services Provided:
${items.map(item => `• ${item.description}: ${item.hours}h @ $${item.rate.toFixed(2)}/h = $${item.total.toLocaleString()}`).join('\n')}

Total Amount: $${amount.toLocaleString()}

Payment Information:
Payment Terms: Net 30 days
Payment can be made via bank transfer, check, or online payment (if available).
Please reference invoice number ${invoiceNumber} with your payment.

If you have any questions regarding this invoice, please don't hesitate to contact us.

Thank you for your business!

Best regards,
Your TeamFlow Team

---
© 2025 TeamFlow. All rights reserved.
This invoice was generated automatically by TeamFlow.
    `.trim()
  }

  /**
   * Generate HTML template for invitation email
   */
  private static generateInvitationEmailHTML(invitationData: InvitationEmailData): string {
    const { recipientName, companyName, inviterName, role, invitationToken, expiresAt } = invitationData
    const expirationDate = new Date(expiresAt).toLocaleDateString()
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to TeamFlow</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #6366f1;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #6366f1;
    }
    .btn {
      display: inline-block;
      padding: 12px 30px;
      background-color: #6366f1;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
      margin: 20px 0;
    }
    .btn:hover {
      background-color: #4f46e5;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #666;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">TeamFlow</div>
      <h1>You're invited to join ${companyName}!</h1>
    </div>
    
    <div class="content">
      <p>Hello ${recipientName},</p>
      
      <p>Great news! <strong>${inviterName}</strong> has invited you to join <strong>${companyName}</strong> on TeamFlow as a <strong>${role}</strong>.</p>
      
      <p>TeamFlow is a comprehensive project management platform that helps teams collaborate effectively, track time, manage projects, and streamline workflows.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${import.meta.env.VITE_APP_URL || 'http://localhost:5173'}/accept-invitation?token=${invitationToken}" class="btn">
          Accept Invitation
        </a>
      </div>
      
      <p><strong>What you can do with TeamFlow:</strong></p>
      <ul>
        <li>📊 Track time and manage projects</li>
        <li>👥 Collaborate with team members</li>
        <li>📈 Generate reports and analytics</li>
        <li>💰 Create and manage invoices</li>
        <li>📋 Organize tasks and deadlines</li>
      </ul>
      
      <p><strong>Important:</strong> This invitation expires on ${expirationDate}.</p>
      
      <p>If you have any questions, please don't hesitate to reach out to ${inviterName} or our support team.</p>
      
      <p>We're excited to have you join the team!</p>
      
      <p>Best regards,<br>
      The TeamFlow Team</p>
    </div>
    
    <div class="footer">
      <p>© 2025 TeamFlow. All rights reserved.</p>
      <p>This invitation was sent to ${invitationData.recipientEmail}. If you didn't expect this invitation, you can safely ignore this email.</p>
    </div>
  </div>
</body>
</html>`
  }

  /**
   * Generate plain text version of invitation email
   */
  private static generateInvitationEmailText(invitationData: InvitationEmailData): string {
    const { recipientName, companyName, inviterName, role, invitationToken, expiresAt } = invitationData
    const expirationDate = new Date(expiresAt).toLocaleDateString()
    
    return `
Hello ${recipientName},

Great news! ${inviterName} has invited you to join ${companyName} on TeamFlow as a ${role}.

TeamFlow is a comprehensive project management platform that helps teams collaborate effectively, track time, manage projects, and streamline workflows.

To accept this invitation, please visit:
${import.meta.env.VITE_APP_URL || 'http://localhost:5174'}/accept-invitation?token=${invitationToken}

What you can do with TeamFlow:
• Track time and manage projects
• Collaborate with team members
• Generate reports and analytics
• Create and manage invoices
• Organize tasks and deadlines

Important: This invitation expires on ${expirationDate}.

If you have any questions, please don't hesitate to reach out to ${inviterName} or our support team.

We're excited to have you join the team!

Best regards,
The TeamFlow Team

© 2025 TeamFlow. All rights reserved.
This invitation was sent to ${invitationData.recipientEmail}. If you didn't expect this invitation, you can safely ignore this email.
    `
  }
}
