-- Runs once on first Postgres boot (mounted into docker-entrypoint-initdb.d).
-- Tables themselves are created by Sequelize sync() in the backend; here we
-- only ensure required extensions exist (UUID generation, etc.).
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
