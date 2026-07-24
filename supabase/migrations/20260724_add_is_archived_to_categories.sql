-- Migration: Add is_archived column to categories table
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- Add comment to document the column
COMMENT ON COLUMN public.categories.is_archived IS 'Indicates whether a category is archived';
