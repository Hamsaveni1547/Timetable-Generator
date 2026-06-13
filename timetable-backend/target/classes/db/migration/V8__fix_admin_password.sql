-- =====================================================================
-- V8: Standardize Admin Password
-- Resets admin password to match all other seeded accounts: 123456789
-- =====================================================================

UPDATE users 
SET password = '$2a$12$ruNxHbeqN2/SKB3lLKOneOhKm/R/i55SstM5hsPMKyo8ryKA7Je7W'
WHERE username = 'admin';
