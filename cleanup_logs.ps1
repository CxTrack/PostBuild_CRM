
$files = @(
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
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file
        $newContent = @()
        foreach ($line in $content) {
            # Check for console log
            if ($line -match 'console\.(log|error|warn|info|debug)') {
                # Case: Catch block on same line
                if ($line -match 'catch') {
                    # If it's a catch block, replace console call with comment
                    # Use regex to replace only the console part
                    $newLine = $line -replace 'console\.(log|error|warn|info|debug)\(.*\);?', '// Error handled silently'
                    $newContent += $newLine
                }
                # Case: Console log is the only thing on the line (ignoring whitespace and optional semicolon)
                elseif ($line -match '^\s*console\.(log|error|warn|info|debug)\(.*\);?\s*$') {
                    # Skip adding this line (DELETE)
                    continue
                }
                # Case: Console log with other code on the line
                else {
                    # Comment out the console log part
                    $newLine = $line -replace 'console\.(log|error|warn|info|debug)\(.*\);?', '/* console removed */'
                    $newContent += $newLine
                }
            } else {
                $newContent += $line
            }
        }
        $newContent | Set-Content -Path $file -Encoding UTF8
        Write-Host "Processed $file"
    } else {
        Write-Host "File not found: $file"
    }
}
