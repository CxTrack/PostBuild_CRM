/*
  # Fix subscription plans
  
  1. Changes
    - Remove duplicate free plans
    - Update plan features to match website
    - Ensure consistent pricing and descriptions
*/

-- First, delete any duplicate free plans
DELETE FROM subscription_plans 
WHERE price = 0 AND name != 'Free Plan';

-- Update the remaining free plan
UPDATE subscription_plans 
SET name = 'Free Plan',
    description = 'Basic features for small businesses',
    price = 0,
    interval = 'month',
    features = jsonb_build_array(
      'Basic invoicing functionality',
      'PDF invoice generation',
      'Manual invoice downloads',
      'Limited to 5 invoices per month',
      'Single user account',
      'Basic email support',
      'Simple customer database',
      'Basic invoice templates',
      'CSV export functionality',
      'Email notifications',
      'Basic dashboard',
      'Mobile app access',
      'Standard documentation',
      'Community support',
      'Basic reporting',
      'Simple search function',
      'Manual data backup',
      'Basic product catalog',
      'Standard security features',
      'Regular updates'
    ),
    is_active = true,
    stripe_price_id = NULL
WHERE price = 0;

-- Update Basic plan
UPDATE subscription_plans 
SET name = 'Basic Plan',
    description = 'Essential features for small businesses',
    price = 19.99,
    interval = 'month',
    features = jsonb_build_array(
      'All Free Plan features',
      'Email delivery to customers',
      'Invoice templates',
      'Recurring invoices',
      'Up to 25 customers',
      'Customer contact management',
      'Basic customer history',
      'Up to 10 products',
      'Basic product catalog',
      'Email notifications',
      'Basic reporting',
      'CSV data export',
      'Standard support',
      'Mobile app access',
      'Basic inventory tracking',
      'Simple dashboard',
      'Payment reminders',
      'Basic document storage',
      'Customer notes',
      'Basic search functionality',
      'Email templates',
      'Basic task management',
      'Simple workflow automation',
      'Basic API access'
    ),
    is_active = true,
    stripe_price_id = 'price_1QypERGmarpEtABMTcKBe5wEa'
WHERE name = 'Basic';

-- Update Business plan
UPDATE subscription_plans 
SET name = 'Business Plan',
    description = 'Advanced features for growing businesses',
    price = 99.99,
    interval = 'month',
    features = jsonb_build_array(
      'All Basic Plan features',
      'Up to 50 customers',
      'Customer segmentation',
      'Advanced customer analytics',
      'Customer communication history',
      'Up to 50 products',
      'Product categories',
      'Stock tracking',
      'Accounting software integration',
      'Payment gateway integration',
      'Email marketing tools',
      'Multiple invoice templates',
      'Bulk invoice generation',
      'Invoice scheduling',
      'Custom branding',
      'Advanced reporting',
      'Team collaboration',
      'Role-based access control',
      'Audit logs',
      'Priority support',
      'Advanced search',
      'Custom fields',
      'Automated workflows',
      'Data backup',
      'API access',
      'Multi-currency support',
      'Customizable dashboards',
      'Advanced document management',
      'Batch processing',
      'Business intelligence tools'
    ),
    is_active = true,
    stripe_price_id = 'price_1QypERGmarpEtABMWQOjiPTR'
WHERE name = 'Business';

-- Update Enterprise plan
UPDATE subscription_plans 
SET name = 'Enterprise Plan',
    description = 'Complete AI-powered solution for large businesses',
    price = 399.99,
    interval = 'month',
    features = jsonb_build_array(
      'All Business Plan features',
      'AI-Powered Virtual Assistant',
      'Automated Voice Collection Calls',
      'Smart Payment Reminders',
      'AI Customer Sentiment Analysis',
      'Voice-to-Text Transcription',
      'Predictive Payment Analysis',
      'Natural Language Processing',
      'Automated Follow-up System',
      'AI Revenue Forecasting',
      'Smart Customer Segmentation',
      'Voice Authentication',
      'Multi-Language Support',
      'Custom AI Training',
      'Unlimited Team Members',
      'Advanced Analytics Dashboard',
      'Custom Integration Support',
      'Priority 24/7 Support',
      'Dedicated Account Manager'
    ),
    is_active = true,
    stripe_price_id = 'price_1QypERGmarpEtABMXeIyF1Dq'
WHERE name = 'Enterprise';