/**
 * Lottery Number Generator Service
 * Generates unique lottery numbers for tickets
 */

export class LotteryNumberGenerator {
  private minNumber: number;
  private maxNumber: number;
  private numbersPerTicket: number;

  constructor(
    minNumber: number = 1,
    maxNumber: number = 45,
    numbersPerTicket: number = 6
  ) {
    this.minNumber = minNumber;
    this.maxNumber = maxNumber;
    this.numbersPerTicket = numbersPerTicket;
  }

  /**
   * Generate a single set of lottery numbers
   * @returns Array of unique random numbers, sorted
   */
  generateSingleTicket(): number[] {
    const numbers = new Set<number>();

    while (numbers.size < this.numbersPerTicket) {
      const randomNum = Math.floor(
        Math.random() * (this.maxNumber - this.minNumber + 1)
      ) + this.minNumber;
      numbers.add(randomNum);
    }

    return Array.from(numbers).sort((a, b) => a - b);
  }

  /**
   * Generate multiple lottery tickets
   * @param count Number of tickets to generate
   * @returns Array of lottery number sets
   */
  generateMultipleTickets(count: number): number[][] {
    const tickets: number[][] = [];

    for (let i = 0; i < count; i++) {
      tickets.push(this.generateSingleTicket());
    }

    return tickets;
  }

  /**
   * Format lottery numbers for display
   * @param numbers Array of lottery numbers
   * @returns Formatted string
   */
  formatNumbers(numbers: number[]): string {
    return numbers.join(' - ');
  }

  /**
   * Format multiple tickets for display
   * @param tickets Array of lottery number sets
   * @returns Formatted string with line breaks
   */
  formatMultipleTickets(tickets: number[][]): string {
    return tickets
      .map((ticket, index) => `Ticket ${index + 1}: ${this.formatNumbers(ticket)}`)
      .join('\n');
  }
}

export default new LotteryNumberGenerator();
