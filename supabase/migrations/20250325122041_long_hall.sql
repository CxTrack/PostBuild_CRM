/*
  # Update dashboard settings to match actual dashboard
  
  1. Changes
    - Update default dashboard settings to match actual dashboard components
    - Add new settings for pipeline and stock items
    - Remove non-existent settings
*/

-- Update user_settings table default dashboard settings
ALTER TABLE user_settings 
ALTER COLUMN dashboard_settings SET DEFAULT '{
  "showSalesChart": true,
  "showPurchasesChart": true, 
  "showInventoryStatus": true,
  "showTodayEvents": true,
  "showPipeline": true,
  "showLowStock": true,
  "showRecentExpenses": true
}'::jsonb;

-- Update existing records to include new settings
UPDATE user_settings
SET dashboard_settings = jsonb_build_object(
  'showSalesChart', COALESCE((dashboard_settings->>'showSalesChart')::boolean, true),
  'showPurchasesChart', COALESCE((dashboard_settings->>'showPurchasesChart')::boolean, true),
  'showInventoryStatus', COALESCE((dashboard_settings->>'showInventoryStatus')::boolean, true),
  'showTodayEvents', COALESCE((dashboard_settings->>'showTodayEvents')::boolean, true),
  'showPipeline', COALESCE((dashboard_settings->>'showPipeline')::boolean, true),
  'showLowStock', COALESCE((dashboard_settings->>'showLowStock')::boolean, true),
  'showRecentExpenses', COALESCE((dashboard_settings->>'showRecentExpenses')::boolean, true)
)
WHERE dashboard_settings IS NULL 
   OR dashboard_settings = '{}'::jsonb
   OR NOT (dashboard_settings ?& array[
     'showSalesChart',
     'showPurchasesChart',
     'showInventoryStatus', 
     'showTodayEvents',
     'showPipeline',
     'showLowStock',
     'showRecentExpenses'
   ]);