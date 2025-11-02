import nodemailer from 'nodemailer';
import { LotteryTicket } from '../types';
import lotteryGenerator from './lotteryGenerator';

/**
 * Email Service
 * Sends confirmation emails to customers
 */
export class EmailService {
  private transporter;
  private fromEmail: string;
  private fromName: string;

  constructor(smtpConfig: any, fromEmail: string, fromName: string = 'De Boss Loterij') {
    this.transporter = nodemailer.createTransport(smtpConfig);
    this.fromEmail = fromEmail;
    this.fromName = fromName;
  }

  /**
   * Send payment confirmation email with lottery numbers
   * @param ticket Lottery ticket object
   * @returns Promise<boolean> Success status
   */
  async sendConfirmationEmail(ticket: LotteryTicket): Promise<boolean> {
    try {
      const lotteryNumbers = JSON.parse(ticket.lottery_numbers) as number[][];
      const formattedNumbers = lotteryGenerator.formatMultipleTickets(lotteryNumbers);

      const htmlContent = this.generateEmailHTML(
        ticket.customer_name,
        ticket.ticket_count,
        formattedNumbers,
        ticket.amount,
        ticket.id
      );

      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: ticket.customer_email,
        subject: 'Bevestiging van uw loterij deelname - De Boss Loterij',
        html: htmlContent,
        text: this.generateEmailText(
          ticket.customer_name,
          ticket.ticket_count,
          formattedNumbers,
          ticket.amount,
          ticket.id
        ),
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Confirmation email sent to ${ticket.customer_email}`);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  /**
   * Generate HTML email content
   */
  private generateEmailHTML(
    customerName: string,
    ticketCount: number,
    formattedNumbers: string,
    amount: number,
    ticketId: string
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
    .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
    .numbers { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4CAF50; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
    .ticket-info { background-color: #e8f5e9; padding: 15px; margin: 15px 0; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 De Boss Loterij</h1>
      <p>Bevestiging van uw deelname</p>
    </div>

    <div class="content">
      <h2>Beste ${customerName},</h2>

      <p>Bedankt voor uw deelname aan De Boss Loterij! Uw betaling is succesvol ontvangen.</p>

      <div class="ticket-info">
        <strong>Bestelling details:</strong><br>
        Aantal loten: ${ticketCount}<br>
        Totaalbedrag: €${amount.toFixed(2)}<br>
        Ticket ID: ${ticketId}
      </div>

      <h3>Uw lotnummers:</h3>
      <div class="numbers">
        <pre style="font-size: 14px; margin: 0;">${formattedNumbers}</pre>
      </div>

      <p>Bewaar deze e-mail goed! U heeft deze nodig om uw prijs op te halen indien u wint.</p>

      <p><strong>Veel succes! 🍀</strong></p>
    </div>

    <div class="footer">
      <p>Dit is een automatisch gegenereerde e-mail. Bewaar deze e-mail als bewijs van deelname.</p>
      <p>&copy; ${new Date().getFullYear()} De Boss Loterij</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate plain text email content
   */
  private generateEmailText(
    customerName: string,
    ticketCount: number,
    formattedNumbers: string,
    amount: number,
    ticketId: string
  ): string {
    return `
De Boss Loterij - Bevestiging van uw deelname

Beste ${customerName},

Bedankt voor uw deelname aan De Boss Loterij! Uw betaling is succesvol ontvangen.

Bestelling details:
Aantal loten: ${ticketCount}
Totaalbedrag: €${amount.toFixed(2)}
Ticket ID: ${ticketId}

Uw lotnummers:
${formattedNumbers}

Bewaar deze e-mail goed! U heeft deze nodig om uw prijs op te halen indien u wint.

Veel succes!

---
Dit is een automatisch gegenereerde e-mail.
© ${new Date().getFullYear()} De Boss Loterij
    `;
  }

  /**
   * Test email configuration
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('Email service is ready');
      return true;
    } catch (error) {
      console.error('Email service error:', error);
      return false;
    }
  }
}

export default EmailService;
