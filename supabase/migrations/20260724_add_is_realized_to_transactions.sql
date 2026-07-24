-- Migration: Add is_realized column to transactions table
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS is_realized BOOLEAN DEFAULT false;

-- Add comment to document the column
COMMENT ON COLUMN public.transactions.is_realized IS 'Indicates whether a planned transaction has been executed/realized';
