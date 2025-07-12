-- Laapak Report System - Fix Remaining Admin Passwords SQL Script
-- Updates the remaining admin users with plain text passwords

-- Update admin user with username 'king' - hash the password 'laapakglobal'
UPDATE admins 
SET password = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' 
WHERE username = 'king' AND password = 'laapakglobal';

-- Update admin user with username 'saif' - hash the password 'saif'
UPDATE admins 
SET password = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' 
WHERE username = 'saif' AND password = 'saif';

-- Check the results after update
SELECT id, username, password, name, role FROM admins; 