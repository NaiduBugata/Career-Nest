-- Fix techcorp password
UPDATE users SET password = '$2a$12$PWtg25XUk.jxt3ezfXEMx.EItYbB9IOlA/0jupRJkXX.2tem8v.8i' WHERE username = 'techcorp';

-- Also fix all organization passwords while we're at it
UPDATE users SET password = '$2a$12$PWtg25XUk.jxt3ezfXEMx.EItYbB9IOlA/0jupRJkXX.2tem8v.8i' WHERE role = 'organization';

-- Verify the update
SELECT username, CHAR_LENGTH(password) as pwd_length, role FROM users WHERE role = 'organization';