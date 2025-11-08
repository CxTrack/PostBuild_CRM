CREATE TABLE IF NOT EXISTS industries (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text,
  dashboard json  
);

-- Enable Row Level Security
ALTER TABLE industries ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.profiles
ADD COLUMN industry_id BIGINT REFERENCES public.industries (id) ON DELETE SET NULL;


-- Insert industries
INSERT INTO industries (name, dashboard) VALUES ('Mortgage Broker', '{"a": "b"}');
INSERT INTO industries (name, dashboard) VALUES ('Accounts', '{"a": "b"}');
INSERT INTO industries (name, dashboard) VALUES ('General', '{"a": "b"}');
INSERT INTO industries (name, dashboard) VALUES ('Small Business  Center', '{"a": "b"}');