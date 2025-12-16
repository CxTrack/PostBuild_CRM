export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  type: 'invoice' | 'expense' | 'task' | 'custom' | 'holiday';
  allDay?: boolean;
  user_email?: string;
  user_id?: string;
}