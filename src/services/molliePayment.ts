import { createMollieClient, PaymentStatus } from '@mollie/api-client';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/schema';
import { Payment } from '../types';

/**
 * Mollie Payment Service
 * Handles all payment operations with Mollie API
 */
export class MolliePaymentService {
  private mollieClient;
  private redirectUrl: string;
  private webhookUrl: string;

  constructor(apiKey: string, redirectUrl: string, webhookUrl?: string) {
    this.mollieClient = createMollieClient({ apiKey });
    this.redirectUrl = redirectUrl;
    this.webhookUrl = webhookUrl || '';
  }

  /**
   * Create a new payment with Mollie
   * @param ticketId The lottery ticket ID
   * @param amount Payment amount
   * @param description Payment description
   * @param customerEmail Customer email
   * @returns Payment object with checkout URL
   */
  async createPayment(
    ticketId: string,
    amount: number,
    description: string,
    customerEmail: string
  ): Promise<Payment> {
    try {
      // Create payment with Mollie
      const molliePayment = await this.mollieClient.payments.create({
        amount: {
          currency: 'EUR',
          value: amount.toFixed(2),
        },
        description,
        redirectUrl: `${this.redirectUrl}?ticket=${ticketId}`,
        webhookUrl: this.webhookUrl || undefined,
        metadata: {
          ticket_id: ticketId,
          customer_email: customerEmail,
        },
      });

      // Store payment in database
      const payment: Payment = {
        id: uuidv4(),
        mollie_payment_id: molliePayment.id,
        ticket_id: ticketId,
        amount,
        status: molliePayment.status,
        checkout_url: molliePayment.getCheckoutUrl() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const stmt = db.prepare(`
        INSERT INTO payments (id, mollie_payment_id, ticket_id, amount, status, checkout_url, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        payment.id,
        payment.mollie_payment_id,
        payment.ticket_id,
        payment.amount,
        payment.status,
        payment.checkout_url,
        payment.created_at,
        payment.updated_at
      );

      // Update ticket with payment ID
      const updateTicket = db.prepare(`
        UPDATE lottery_tickets
        SET payment_id = ?
        WHERE id = ?
      `);
      updateTicket.run(payment.mollie_payment_id, ticketId);

      return payment;
    } catch (error) {
      console.error('Error creating Mollie payment:', error);
      throw new Error('Failed to create payment');
    }
  }

  /**
   * Check payment status with Mollie
   * @param molliePaymentId Mollie payment ID
   * @returns Updated payment status
   */
  async checkPaymentStatus(molliePaymentId: string): Promise<string> {
    try {
      const payment = await this.mollieClient.payments.get(molliePaymentId);

      // Update payment status in database
      const updateStmt = db.prepare(`
        UPDATE payments
        SET status = ?, updated_at = ?
        WHERE mollie_payment_id = ?
      `);
      updateStmt.run(payment.status, new Date().toISOString(), molliePaymentId);

      // Update ticket status
      if (payment.status === PaymentStatus.paid) {
        const updateTicketStmt = db.prepare(`
          UPDATE lottery_tickets
          SET payment_status = 'paid', paid_at = ?
          WHERE payment_id = ?
        `);
        updateTicketStmt.run(new Date().toISOString(), molliePaymentId);
      } else if (
        payment.status === PaymentStatus.failed ||
        payment.status === PaymentStatus.canceled ||
        payment.status === PaymentStatus.expired
      ) {
        const updateTicketStmt = db.prepare(`
          UPDATE lottery_tickets
          SET payment_status = 'failed'
          WHERE payment_id = ?
        `);
        updateTicketStmt.run(molliePaymentId);
      }

      return payment.status;
    } catch (error) {
      console.error('Error checking payment status:', error);
      throw new Error('Failed to check payment status');
    }
  }

  /**
   * Get payment by Mollie payment ID
   * @param molliePaymentId Mollie payment ID
   * @returns Payment object
   */
  getPayment(molliePaymentId: string): Payment | null {
    const stmt = db.prepare(`
      SELECT * FROM payments WHERE mollie_payment_id = ?
    `);
    return stmt.get(molliePaymentId) as Payment | null;
  }
}

export default MolliePaymentService;
