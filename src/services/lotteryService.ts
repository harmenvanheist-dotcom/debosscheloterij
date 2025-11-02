import { v4 as uuidv4 } from 'uuid';
import db from '../database/schema';
import lotteryGenerator from './lotteryGenerator';
import { MolliePaymentService } from './molliePayment';
import { EmailService } from './emailService';
import { LotteryTicket, CreateTicketRequest } from '../types';

/**
 * Main Lottery Service
 * Coordinates ticket creation, payment processing, and email confirmations
 */
export class LotteryService {
  private paymentService: MolliePaymentService;
  private emailService: EmailService;

  constructor(paymentService: MolliePaymentService, emailService: EmailService) {
    this.paymentService = paymentService;
    this.emailService = emailService;
  }

  /**
   * Create a new lottery ticket and initiate payment
   * @param request Ticket creation request
   * @returns Ticket with payment checkout URL
   */
  async createTicketAndPayment(request: CreateTicketRequest) {
    try {
      // Generate lottery numbers
      const lotteryNumbers = lotteryGenerator.generateMultipleTickets(
        request.ticket_count
      );

      // Calculate total amount
      const totalAmount = request.ticket_count * request.price_per_ticket;

      // Create ticket record
      const ticketId = uuidv4();
      const ticket: LotteryTicket = {
        id: ticketId,
        customer_email: request.customer_email,
        customer_name: request.customer_name,
        lottery_numbers: JSON.stringify(lotteryNumbers),
        payment_id: null,
        payment_status: 'pending',
        amount: totalAmount,
        created_at: new Date().toISOString(),
        paid_at: null,
        ticket_count: request.ticket_count,
      };

      // Save ticket to database
      const stmt = db.prepare(`
        INSERT INTO lottery_tickets
        (id, customer_email, customer_name, lottery_numbers, payment_status, amount, created_at, ticket_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        ticket.id,
        ticket.customer_email,
        ticket.customer_name,
        ticket.lottery_numbers,
        ticket.payment_status,
        ticket.amount,
        ticket.created_at,
        ticket.ticket_count
      );

      // Create payment with Mollie
      const payment = await this.paymentService.createPayment(
        ticketId,
        totalAmount,
        `De Boss Loterij - ${request.ticket_count} lot(en)`,
        request.customer_email
      );

      return {
        ticket_id: ticketId,
        checkout_url: payment.checkout_url,
        amount: totalAmount,
        lottery_numbers: lotteryNumbers,
      };
    } catch (error) {
      console.error('Error creating ticket and payment:', error);
      throw new Error('Failed to create ticket and payment');
    }
  }

  /**
   * Process payment webhook from Mollie
   * @param molliePaymentId Mollie payment ID
   */
  async processPaymentWebhook(molliePaymentId: string): Promise<void> {
    try {
      // Check payment status
      const status = await this.paymentService.checkPaymentStatus(molliePaymentId);

      // If payment is successful, send confirmation email
      if (status === 'paid') {
        const payment = this.paymentService.getPayment(molliePaymentId);
        if (payment) {
          const ticket = this.getTicket(payment.ticket_id);
          if (ticket) {
            await this.emailService.sendConfirmationEmail(ticket);
            console.log(`Confirmation email sent for ticket ${ticket.id}`);
          }
        }
      }
    } catch (error) {
      console.error('Error processing payment webhook:', error);
      throw error;
    }
  }

  /**
   * Get ticket by ID
   * @param ticketId Ticket ID
   * @returns Lottery ticket
   */
  getTicket(ticketId: string): LotteryTicket | null {
    const stmt = db.prepare(`
      SELECT * FROM lottery_tickets WHERE id = ?
    `);
    return stmt.get(ticketId) as LotteryTicket | null;
  }

  /**
   * Get ticket by payment ID
   * @param paymentId Mollie payment ID
   * @returns Lottery ticket
   */
  getTicketByPaymentId(paymentId: string): LotteryTicket | null {
    const stmt = db.prepare(`
      SELECT * FROM lottery_tickets WHERE payment_id = ?
    `);
    return stmt.get(paymentId) as LotteryTicket | null;
  }

  /**
   * Get all tickets for a customer email
   * @param email Customer email
   * @returns Array of lottery tickets
   */
  getTicketsByEmail(email: string): LotteryTicket[] {
    const stmt = db.prepare(`
      SELECT * FROM lottery_tickets
      WHERE customer_email = ?
      ORDER BY created_at DESC
    `);
    return stmt.all(email) as LotteryTicket[];
  }

  /**
   * Check payment status and update ticket
   * @param ticketId Ticket ID
   * @returns Updated ticket
   */
  async checkAndUpdatePaymentStatus(ticketId: string): Promise<LotteryTicket | null> {
    try {
      const ticket = this.getTicket(ticketId);
      if (!ticket || !ticket.payment_id) {
        return null;
      }

      await this.paymentService.checkPaymentStatus(ticket.payment_id);
      return this.getTicket(ticketId);
    } catch (error) {
      console.error('Error checking payment status:', error);
      return null;
    }
  }
}

export default LotteryService;
