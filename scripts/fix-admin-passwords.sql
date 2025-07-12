-- Laapak Report System - Fix Admin Passwords SQL Script
-- Updates existing admin users with plain text passwords to use bcrypt hashed passwords
-- Run this script directly in MySQL

-- First, let's see what admin users we have
SELECT id, username, password, name, role FROM admins;

-- Update admin user with username 'admin' - hash the password 'admin123'
UPDATE admins 
SET password = '$2a$10$7cc4mnr1l.Jru6rN8oFzAOX0mnAAW.SQ1Q7ZJ4EHeAXe9oBJMhlgW' 
WHERE username = 'admin' AND password = 'admin123';

-- Update admin user with username 'tech' - hash the password 'tech123'
UPDATE admins 
SET password = '$2a$10$JGSxHQVjbW6YJqrCy.pqOOSwR8W2D6enHqC46xoHPMFu4B6H5EAsq' 
WHERE username = 'tech' AND password = 'tech123';

-- Update admin user with username 'viewer' - hash the password 'viewer123'
UPDATE admins 
SET password = '$2a$10$/NVojtOpo.v8m9q5u97gOeGuhSEh/hZDA3zXbukmtmyM5yqFUikrC' 
WHERE username = 'viewer' AND password = 'viewer123';

-- Check the results after update
SELECT id, username, password, name, role FROM admins;

-- Note: These are the correct bcrypt hashes for the respective passwords
-- The hashes were generated using bcrypt with salt rounds of 10 