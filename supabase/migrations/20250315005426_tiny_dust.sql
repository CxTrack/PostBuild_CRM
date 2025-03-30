/*
  # Add Pipeline Tracking
  
  1. New Types
    - pipeline_stage enum for tracking deal stages
  
  2. Changes
    - Add stage tracking to quotes and invoices
    - Add function for pipeline calculations with security checks
*/

-- Create pipeline_stages enum type
CREATE TYPE pipeline_stage AS ENUM (
  'lead',
  'opportunity', 
  'quote',
  'invoice_sent',
  'invoice_pending',
  'closed_won',
  'closed_lost'
);

-- Add stage tracking to quotes
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS pipeline_stage pipeline_stage 
DEFAULT 'quote';

-- Add stage tracking to invoices
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS pipeline_stage pipeline_stage 
DEFAULT 'invoice_sent';

-- Create function to calculate pipeline value
CREATE OR REPLACE FUNCTION calculate_pipeline_value(stage pipeline_stage)
RETURNS numeric AS $$
BEGIN
  RETURN CASE stage
    WHEN 'lead' THEN 0
    WHEN 'opportunity' THEN 0.2
    WHEN 'quote' THEN 0.4
    WHEN 'invoice_sent' THEN 0.6
    WHEN 'invoice_pending' THEN 0.8
    WHEN 'closed_won' THEN 1.0
    WHEN 'closed_lost' THEN 0
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to get pipeline summary with security check
CREATE OR REPLACE FUNCTION get_pipeline_summary(p_user_id uuid)
RETURNS TABLE (
  pipeline_stage pipeline_stage,
  deal_count bigint,
  total_value numeric,
  completion_percentage numeric
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  RETURN QUERY
  WITH combined_pipeline AS (
    -- Quotes pipeline
    SELECT 
      q.pipeline_stage,
      q.total
    FROM quotes q
    WHERE q.user_id = p_user_id
    AND q.status NOT IN ('Declined', 'Expired')
    
    UNION ALL
    
    -- Invoices pipeline
    SELECT 
      i.pipeline_stage,
      i.total
    FROM invoices i
    WHERE i.user_id = p_user_id
    AND i.status != 'Cancelled'
  )
  SELECT 
    p.pipeline_stage,
    COUNT(*) as deal_count,
    SUM(p.total) as total_value,
    calculate_pipeline_value(p.pipeline_stage) as completion_percentage
  FROM combined_pipeline p
  GROUP BY p.pipeline_stage
  ORDER BY completion_percentage;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for pipeline queries
CREATE INDEX IF NOT EXISTS idx_quotes_pipeline_stage ON quotes(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_invoices_pipeline_stage ON invoices(pipeline_stage);

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_pipeline_summary(uuid) TO authenticated;