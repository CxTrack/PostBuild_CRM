/*
  # Add opportunity tracking columns to customers table
  
  1. New Columns
    - `opportunity_value` (numeric)
    - `opportunity_probability` (numeric)
    - `opportunity_close_date` (timestamptz)
    - `pipeline_stage` (pipeline_stage)
    
  2. Changes
    - Add columns with proper constraints
    - Add indexes for performance
*/

-- Add opportunity tracking columns
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS opportunity_value numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS opportunity_probability numeric DEFAULT 0 CHECK (opportunity_probability BETWEEN 0 AND 100),
ADD COLUMN IF NOT EXISTS opportunity_close_date timestamptz,
ADD COLUMN IF NOT EXISTS pipeline_stage pipeline_stage DEFAULT 'lead';

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_customers_pipeline_stage ON customers(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_customers_opportunity_close_date ON customers(opportunity_close_date);

-- Add constraint to ensure opportunity fields are set when in opportunity stage
ALTER TABLE customers
ADD CONSTRAINT opportunity_fields_check
CHECK (
  (pipeline_stage = 'opportunity' AND opportunity_value > 0 AND opportunity_close_date IS NOT NULL) OR
  pipeline_stage != 'opportunity'
);