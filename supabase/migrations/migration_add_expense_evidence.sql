-- Migration: Add evidence_url to expenses table
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS evidence_url TEXT;

-- Instructions for USER:
-- Please run this SQL in your Supabase SQL Editor.
-- Also, ensure you have a storage bucket named 'evidence' created and public (or with appropriate RLS).
