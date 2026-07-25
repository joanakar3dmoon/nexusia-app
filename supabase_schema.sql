-- Nexusia — Supabase Schema
-- Ejecutar en el SQL Editor de tu proyecto Supabase

-- Tabla principal de estado de la app
CREATE TABLE IF NOT EXISTS nexusia_state (
  key         TEXT PRIMARY KEY,
  state       JSONB NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Tabla de transacciones
CREATE TABLE IF NOT EXISTS nexusia_transactions (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_at    TIMESTAMPTZ DEFAULT now(),
  type          TEXT NOT NULL,
  status        TEXT DEFAULT 'PENDING',
  amount        NUMERIC(12,2) NOT NULL,
  reference     TEXT,
  description   TEXT,
  gateway       TEXT DEFAULT 'INTERNAL'
);

-- Índices
CREATE INDEX IF NOT EXISTS nexusia_transactions_created_at_idx ON nexusia_transactions(created_at DESC);

-- RLS desactivado (acceso solo desde server con service key)
ALTER TABLE nexusia_state DISABLE ROW LEVEL SECURITY;
ALTER TABLE nexusia_transactions DISABLE ROW LEVEL SECURITY;