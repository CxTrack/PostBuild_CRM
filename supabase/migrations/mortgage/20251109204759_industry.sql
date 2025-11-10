create table industries (
  id bigint generated always as identity not null,
  name text null,
  dashboard json null,
  constraint industry_pkey primary key (id)
) TABLESPACE pg_default;


-- Policy 1: Allow admins to SELECT
CREATE POLICY "Users can view industries"
  ON industries
  FOR SELECT
  TO authenticated
  USING (
    is_admin(auth.uid())
  );

-- Policy 2: Allow admins to modify
CREATE POLICY "Users can modify industry"
  ON industries
  FOR ALL
  TO authenticated
  USING (
    is_admin(auth.uid())  -- or use a new function is_super_admin(auth.uid())
  );

-- Policy 3: Allow users to view/update their own settings
CREATE POLICY "Users can access their own industry"
  ON industries
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- Insert Mortgage industry
  INSERT INTO profiles (name, dashboard,)
  VALUES ('Mortgage Broker', '{}')
  ON CONFLICT (user_id) DO NOTHING;