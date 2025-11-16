ALTER TABLE recent_activities
    DROP COLUMN IF EXISTS customer,
    ADD COLUMN customer UUID REFERENCES customers (id) ON DELETE CASCADE;