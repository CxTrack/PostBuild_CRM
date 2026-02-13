import os
import re

files_list = [
    "src/stores/crmStore.ts",
    "src/stores/calendarStore.ts",
    "src/stores/dealStore.ts",
    "src/stores/profileStore.ts",
    "src/stores/ticketStore.ts",
    "src/stores/expenseStore.ts",
    "src/stores/preferencesStore.ts",
    "src/stores/planStore.ts",
    "src/stores/quoteStore.ts",
    "src/stores/taskStore.ts",
    "src/stores/supplierStore.ts",
    "src/stores/invoiceStore.ts",
    "src/stores/organizationStore.ts",
    "src/stores/inventoryStore.ts",
    "src/stores/pipelineConfigStore.ts",
    "src/stores/callStore.ts",
    "src/stores/authStore.ts",
    "src/stores/voiceAgentStore.ts",
    "src/pages/invoices/InvoiceBuilder.tsx",
    "src/pages/quotes/QuoteBuilder.tsx",
    "src/pages/settings/Settings.tsx",
    "src/pages/invoices/InvoiceDetail.tsx",
    "src/pages/quotes/QuoteDetail.tsx",
    "src/pages/Dashboard.tsx",
    "src/pages/CustomerProfile.tsx",
    "src/pages/auth/Register.tsx",
    "src/pages/settings/BusinessSettings.tsx",
    "src/pages/auth/Login.tsx",
    "src/pages/Invoices.tsx",
    "src/pages/Quotes.tsx",
    "src/pages/settings/SharingSettings.tsx",
    "src/pages/ChatPage.tsx",
    "src/pages/Tasks.tsx",
    "src/pages/Pipeline.tsx",
    "src/pages/calls/Calls.tsx",
    "src/pages/calls/CallDetail.tsx",
    "src/pages/products/ProductForm.tsx",
    "src/pages/customers/CustomerForm.tsx",
    "src/pages/auth/ResetPassword.tsx",
    "src/pages/auth/ForgotPassword.tsx",
    "src/pages/auth/GDPRNotice.tsx",
    "src/pages/admin/UsersTab.tsx",
    "src/pages/admin/BillingTab.tsx",
    "src/pages/admin/AnalyticsTab.tsx",
    "src/pages/settings/CalendarSettings.tsx",
    "src/services/pdf.service.ts",
    "src/services/revenue.service.ts",
    "src/services/twilio.service.ts",
    "src/components/share/ShareModal.tsx",
    "src/components/calendar/EventModal.tsx",
    "src/components/ui/AddressAutocomplete.tsx",
    "src/components/chat/ChatPanel.tsx",
    "src/components/shared/QuickAddCustomerModal.tsx",
    "src/components/customers/CustomerModal.tsx",
    "src/components/calendar/AppointmentDetailModal.tsx",
    "src/components/calls/LogCallModal.tsx",
    "src/components/tasks/TaskDetailModal.tsx",
    "src/components/settings/ProfileTab.tsx",
    "src/components/settings/InviteMemberModal.tsx",
    "src/components/admin/BroadcastPanel.tsx",
    "src/components/compact/ResizableTable.tsx",
    "src/website/components/MiniAuditSection.tsx",
    "src/lib/supabase.ts",
    "src/hooks/useVisibleModules.ts",
    "src/layouts/DashboardLayout.tsx",
    "src/contexts/AuthContext.tsx",
    "src/main.tsx",
    "src/App.tsx",
    "src/contexts/CoPilotContext.tsx",
    "src/api/stripe/webhook.ts"
]

root_dir = r"c:\Users\cxtra\Final_CxTrack_production\PostBuild_CRM"

def remove_console_statements(content):
    if not re.search(r'console\.(log|error|warn|debug|info)', content):
        return content

    new_content = content
    # Loop to remove all instances
    while True:
        # Find start
        match = re.search(r'console\.(log|error|warn|debug|info)\s*\(', new_content)
        if not match:
            break
        
        start_idx = match.start()
        
        # Find end of statement
        open_parens = 0
        in_string = False
        string_char = ''
        end_idx = -1
        
        i = start_idx
        # Advance to opening paren
        while i < len(new_content) and new_content[i] != '(':
             i += 1
             
        if i >= len(new_content):
            break # Should not happen given regex
            
        open_parens = 1
        i += 1
        
        while i < len(new_content) and open_parens > 0:
            char = new_content[i]
            
            if in_string:
                if char == string_char:
                    # Check for escaping
                    escaped = False
                    backtrack = i - 1
                    while backtrack >= 0 and new_content[backtrack] == '\\':
                        escaped = not escaped
                        backtrack -= 1
                    if not escaped:
                        in_string = False
            else:
                if char == '"' or char == "'" or char == '`':
                    in_string = True
                    string_char = char
                elif char == '(':
                    open_parens += 1
                elif char == ')':
                    open_parens -= 1
            i += 1
        
        end_idx = i
        
        # Swallow semicolon if present
        if end_idx < len(new_content) and new_content[end_idx] == ';':
            end_idx += 1
            
        # Replace with empty string
        new_content = new_content[:start_idx] + new_content[end_idx:]
        
    return new_content

def process_file(file_path):
    print(f"Processing {file_path}...")
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        original_content = content
        
        # Remove logs
        content = remove_console_statements(content)
        
        # Replace empty catch blocks
        # We look for catch (...) { <whitespace> }
        # And replace with catch (...) { // Error handled silently or pass to UI }
        
        # Regex explanation:
        # (catch\s*\([^)]*\)\s*\{)  -> capture group 1: "catch (e) {"
        # (\s*)                     -> capture group 2: whitespace inside
        # (\})                      -> capture group 3: "}"
        # Only match if group 2 is ONLY whitespace.
        
        content = re.sub(
            r'(catch\s*\([^)]*\)\s*\{)(\s*)(\})',
            r'\1 // Error handled silently or pass to UI \3',
            content
        )

        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated {file_path}")
        else:
            print(f"No changes in {file_path}")
            
    except Exception as e:
        print(f"Error processing {file_path}: {e}")

for rel_path in files_list:
    abs_path = os.path.join(root_dir, rel_path)
    if os.path.exists(abs_path):
        process_file(abs_path)
    else:
        print(f"File not found: {abs_path}")
