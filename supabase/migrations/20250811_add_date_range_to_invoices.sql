-- Add date_range_start and date_range_end columns to invoices table if not exists
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS date_range_start date NOT NULL DEFAULT CURRENT_DATE;

ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS date_range_end date NOT NULL DEFAULT CURRENT_DATE;
