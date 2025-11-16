CREATE TABLE IF NOT EXISTS public.industries (
  id bigint generated always as identity not null,
  name text null,
  dashboard json null,
  constraint industries_pkey primary key (id)
) TABLESPACE pg_default;


create policy "Enable read access for all users"
on "public"."industries"
for select using (true);


create policy "Enable insert for authenticated users only"
on "public"."industries"
for insert to authenticated
with check (true);