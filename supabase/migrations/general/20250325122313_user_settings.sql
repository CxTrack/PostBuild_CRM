/*
  # Update dashboard settings to match actual dashboard
  
  1. Changes
    - Update default dashboard settings to match actual dashboard components
    - Remove non-existent settings
    - Add missing settings
*/

-- Update user_settings table default dashboard settings
ALTER TABLE user_settings 
ALTER COLUMN dashboard_settings SET DEFAULT '{
  "showTodayEvents": true,
  "showPipelineOverview": true,
  "showLowStockItems": true,
  "showRecentExpenses": true,
  "showRecentActivity": true
}'::jsonb;

-- Update existing records to include new settings
UPDATE user_settings
SET dashboard_settings = jsonb_build_object(
  'showTodayEvents', COALESCE((dashboard_settings->>'showTodayEvents')::boolean, true),
  'showPipelineOverview', COALESCE((dashboard_settings->>'showPipelineOverview')::boolean, true),
  'showLowStockItems', COALESCE((dashboard_settings->>'showLowStockItems')::boolean, true),
  'showRecentExpenses', COALESCE((dashboard_settings->>'showRecentExpenses')::boolean, true),
  'showRecentActivity', COALESCE((dashboard_settings->>'showRecentActivity')::boolean, true)
)
WHERE dashboard_settings IS NULL 
   OR dashboard_settings = '{}'::jsonb
   OR NOT (dashboard_settings ?& array[
     'showTodayEvents',
     'showPipelineOverview',
     'showLowStockItems',
     'showRecentExpenses',
     'showRecentActivity'
   ]);