/*
  # Update dashboard settings defaults
  
  1. Changes
    - Update default dashboard settings to match actual dashboard
    - Remove non-existent settings
    - Add settings for pipeline and low stock items
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
  'showSalesChart', true,
  'showPurchasesChart', true,
  'showInventoryStatus', true,
  'showTodayEvents', true,
  'showPipeline', true,
  'showLowStock', true,
  'showRecentExpenses', true
)
WHERE dashboard_settings IS NULL OR dashboard_settings = '{}'::jsonb;