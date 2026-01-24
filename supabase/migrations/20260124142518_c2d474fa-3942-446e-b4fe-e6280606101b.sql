-- Add new columns for novelty analysis and identified assumptions
ALTER TABLE public.analyses 
ADD COLUMN novelty_analysis jsonb,
ADD COLUMN identified_assumptions jsonb,
ADD COLUMN pdf_extraction_status text DEFAULT 'not_applicable';