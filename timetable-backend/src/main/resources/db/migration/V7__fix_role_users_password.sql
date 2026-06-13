-- =====================================================================
-- V7: Update Seeded User Passwords
-- Ensures seeded csehod, csefaculty1, and csestudent1 accounts match
-- the BCrypt strength 12 format.
-- Password: 123456789
-- =====================================================================

UPDATE users 
SET password = '$2a$12$ruNxHbeqN2/SKB3lLKOneOhKm/R/i55SstM5hsPMKyo8ryKA7Je7W'
WHERE username IN ('csehod', 'csefaculty1', 'csestudent1');
