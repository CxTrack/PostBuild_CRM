ALTER TABLE recent_activities
    DROP COLUMN IF EXISTS supplier,
    DROP COLUMN IF EXISTS product,
    DROP COLUMN IF EXISTS amount,
    DROP COLUMN IF EXISTS quantity;
