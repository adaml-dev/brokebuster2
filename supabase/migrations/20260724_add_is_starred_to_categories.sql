-- Migration: Add is_starred column to categories table
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT false;

-- Add comment to document the column
COMMENT ON COLUMN public.categories.is_starred IS 'Indicates whether a category is starred/favorited by the user';
