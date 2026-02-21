export type ActionType =
  | 'create_customer'
  | 'create_deal'
  | 'create_task'
  | 'add_note'
  | 'send_email'
  | 'send_sms'
  | 'draft_call_script';

export type ActionStatus = 'proposed' | 'executing' | 'completed' | 'failed' | 'cancelled';

export interface ActionField {
  key: string;
  label: string;
  value: any;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea';
  required: boolean;
  options?: string[];
  editable: boolean;
}

export interface ActionProposal {
  actionType: ActionType;
  label: string;
  fields: ActionField[];
}

export interface ActionResult {
  success: boolean;
  message: string;
  recordId?: string;
  recordType?: string;
}
