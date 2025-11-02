import Database from 'better-sqlite3';
import type BetterSqlite3 from 'better-sqlite3';
import path from 'path';

const db: BetterSqlite3.Database = new Database(path.join(__dirname, '../../lottery.db'));

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS lottery_tickets (
    id TEXT PRIMARY KEY,
    customer_email TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    lottery_numbers TEXT NOT NULL,
    payment_id TEXT,
    payment_status TEXT DEFAULT 'pending',
    amount REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    paid_at DATETIME,
    ticket_count INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    mollie_payment_id TEXT UNIQUE NOT NULL,
    ticket_id TEXT NOT NULL,
    amount REAL NOT NULL,
    status TEXT NOT NULL,
    checkout_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES lottery_tickets(id)
  );

  CREATE INDEX IF NOT EXISTS idx_lottery_tickets_email ON lottery_tickets(customer_email);
  CREATE INDEX IF NOT EXISTS idx_lottery_tickets_payment ON lottery_tickets(payment_id);
  CREATE INDEX IF NOT EXISTS idx_payments_mollie ON payments(mollie_payment_id);
  CREATE INDEX IF NOT EXISTS idx_payments_ticket ON payments(ticket_id);
`);

export default db;
