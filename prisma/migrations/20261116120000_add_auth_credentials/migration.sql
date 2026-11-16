-- Authentication credentials.
--
-- `users.email` and `users.password` already exist from the init migration.
-- Authentication needs `password` to be NULLable so an account can exist
-- without a usable credential: the seeded demo player ("detective") was
-- created with the placeholder value 'not-a-real-hash', which is not a hash
-- and must never be treated as one. No default password is assigned anywhere.

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;

-- Clear placeholder / non-hash passwords so they can never verify.
-- Real hashes start with "$2" (bcrypt) or "$argon2" (argon2id).
UPDATE "users"
   SET "password" = NULL
 WHERE "password" IS NOT NULL
   AND "password" NOT LIKE '$2%'
   AND "password" NOT LIKE '$argon2%';
