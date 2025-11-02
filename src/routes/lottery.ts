import { Router, Request, Response } from 'express';
import { LotteryService } from '../services/lotteryService';

export function createLotteryRouter(lotteryService: LotteryService): Router {
  const router = Router();

  /**
   * POST /api/lottery/ticket
   * Create a new lottery ticket and initiate payment
   */
  router.post('/ticket', async (req: Request, res: Response) => {
    try {
      const { customer_email, customer_name, ticket_count, price_per_ticket } = req.body;

      // Validation
      if (!customer_email || !customer_name || !ticket_count || !price_per_ticket) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['customer_email', 'customer_name', 'ticket_count', 'price_per_ticket'],
        });
      }

      if (ticket_count < 1 || ticket_count > 100) {
        return res.status(400).json({
          error: 'Ticket count must be between 1 and 100',
        });
      }

      if (price_per_ticket < 0.01) {
        return res.status(400).json({
          error: 'Price per ticket must be at least €0.01',
        });
      }

      // Create ticket and payment
      const result = await lotteryService.createTicketAndPayment({
        customer_email,
        customer_name,
        ticket_count: parseInt(ticket_count),
        price_per_ticket: parseFloat(price_per_ticket),
      });

      res.status(201).json({
        success: true,
        data: result,
        message: 'Ticket created successfully. Redirect customer to checkout_url to complete payment.',
      });
    } catch (error) {
      console.error('Error creating ticket:', error);
      res.status(500).json({
        error: 'Failed to create ticket',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/lottery/ticket/:ticketId
   * Get ticket details by ID
   */
  router.get('/ticket/:ticketId', async (req: Request, res: Response) => {
    try {
      const { ticketId } = req.params;

      const ticket = lotteryService.getTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({
          error: 'Ticket not found',
        });
      }

      res.json({
        success: true,
        data: {
          ...ticket,
          lottery_numbers: JSON.parse(ticket.lottery_numbers),
        },
      });
    } catch (error) {
      console.error('Error fetching ticket:', error);
      res.status(500).json({
        error: 'Failed to fetch ticket',
      });
    }
  });

  /**
   * GET /api/lottery/ticket/:ticketId/status
   * Check payment status for a ticket
   */
  router.get('/ticket/:ticketId/status', async (req: Request, res: Response) => {
    try {
      const { ticketId } = req.params;

      const ticket = await lotteryService.checkAndUpdatePaymentStatus(ticketId);
      if (!ticket) {
        return res.status(404).json({
          error: 'Ticket not found or no payment associated',
        });
      }

      res.json({
        success: true,
        data: {
          ticket_id: ticket.id,
          payment_status: ticket.payment_status,
          paid_at: ticket.paid_at,
        },
      });
    } catch (error) {
      console.error('Error checking payment status:', error);
      res.status(500).json({
        error: 'Failed to check payment status',
      });
    }
  });

  /**
   * GET /api/lottery/tickets/email/:email
   * Get all tickets for a customer email
   */
  router.get('/tickets/email/:email', (req: Request, res: Response) => {
    try {
      const { email } = req.params;

      const tickets = lotteryService.getTicketsByEmail(email);

      res.json({
        success: true,
        count: tickets.length,
        data: tickets.map(ticket => ({
          ...ticket,
          lottery_numbers: JSON.parse(ticket.lottery_numbers),
        })),
      });
    } catch (error) {
      console.error('Error fetching tickets:', error);
      res.status(500).json({
        error: 'Failed to fetch tickets',
      });
    }
  });

  /**
   * POST /api/lottery/webhook
   * Mollie payment webhook endpoint
   */
  router.post('/webhook', async (req: Request, res: Response) => {
    try {
      const { id: molliePaymentId } = req.body;

      if (!molliePaymentId) {
        return res.status(400).json({
          error: 'Missing payment ID',
        });
      }

      // Process webhook asynchronously
      lotteryService.processPaymentWebhook(molliePaymentId).catch(error => {
        console.error('Error processing webhook:', error);
      });

      // Return 200 immediately to Mollie
      res.status(200).send('OK');
    } catch (error) {
      console.error('Error handling webhook:', error);
      res.status(500).json({
        error: 'Webhook processing failed',
      });
    }
  });

  return router;
}
