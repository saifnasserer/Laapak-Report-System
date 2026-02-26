-- Migration: Add update_history to Reports Table
-- This migration adds the update_history column to store the history of updates made to a report

ALTER TABLE reports
ADD COLUMN update_history JSON DEFAULT NULL COMMENT 'JSON array of updates made to the report (history)';
