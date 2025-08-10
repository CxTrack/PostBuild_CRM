-- Add the column and foreign key in one go
ALTER TABLE public.tasks
ADD COLUMN calendar_id uuid REFERENCES public.calendar_events (id) ON DELETE SET NULL;