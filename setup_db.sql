-- Create user if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'portfolio') THEN
    CREATE USER portfolio WITH PASSWORD 'portfolio';
  END IF;
END
$$;

-- Create database
CREATE DATABASE portfolio_dashboard OWNER portfolio;
