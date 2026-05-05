-- Migration 009: "Currently obsessed with" status on curator profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS obsessed_with text,
  ADD COLUMN IF NOT EXISTS obsessed_with_updated_at timestamptz;
