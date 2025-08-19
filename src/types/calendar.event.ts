export interface CalendarEvent {
    title: string;
    start: Date;
    end: Date;
    description: string;
    type: "invoice" | "expense" | "task" | "custom";
}