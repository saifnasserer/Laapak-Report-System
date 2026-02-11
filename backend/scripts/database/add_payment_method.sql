USE laapak_report_system;

ALTER TABLE reports
ADD COLUMN payment_method VARCHAR(50) NULL COMMENT 'The payment method selected by the client (cash, vodafone_cash, instapay)';
