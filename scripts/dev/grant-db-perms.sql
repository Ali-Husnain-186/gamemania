-- Run this in pgAdmin while connected as the postgres SUPERUSER
-- (server login user = postgres), against database: gamemania
-- Execute the whole script at once (these are GRANTs, not CREATE DATABASE).

GRANT ALL ON SCHEMA public TO gamemania;
ALTER SCHEMA public OWNER TO gamemania;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO gamemania;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO gamemania;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO gamemania;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO gamemania;
