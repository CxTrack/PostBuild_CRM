-- Add the column and foreign key in one go
ALTER TABLE public.tasks
ADD COLUMN calendar_id uuid REFERENCES public.calendar_events (id) ON DELETE SET NULL;

ALTER TABLE public.tasks
ADD COLUMN customer_id uuid REFERENCES public.customers (id) ON DELETE SET NULL;