/**
 * save-smtp-settings
 * Save, update, or delete custom SMTP email configuration for an organization.
 * Passwords are encrypted via Supabase Vault (never stored in plaintext).
 *
 * POST body:
 *   { organization_id, smtp_host, smtp_port, smtp_secure, smtp_username, smtp_password, sender_email, sender_name }
 *   OR { organization_id, action: "delete" }
 */
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { getCorsHeaders, corsPreflightResponse } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return corsPreflightResponse(req)
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Authenticate the user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) throw new Error('Unauthorized')

    const body = await req.json()
    const { organization_id, action } = body

    if (!organization_id) throw new Error('Missing organization_id')

    // Verify the user belongs to this organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', organization_id)
      .single()

    if (!membership) throw new Error('Not a member of this organization')

    // --- DELETE action ---
    if (action === 'delete') {
      const { data: existing } = await supabase
        .from('user_email_smtp_settings')
        .select('id, smtp_password_vault_id')
        .eq('user_id', user.id)
        .eq('organization_id', organization_id)
        .single()

      if (existing) {
        // Remove the vault secret first
        if (existing.smtp_password_vault_id) {
          await supabase.rpc('vault_delete_secret', {
            p_id: existing.smtp_password_vault_id,
          })
        }

        // Delete the settings row
        await supabase
          .from('user_email_smtp_settings')
          .delete()
          .eq('id', existing.id)
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    // --- SAVE / UPDATE action ---
    const {
      smtp_host,
      smtp_port,
      smtp_secure,
      smtp_username,
      smtp_password,
      sender_email,
      sender_name,
    } = body

    if (!smtp_host?.trim() || !smtp_username?.trim() || !sender_email?.trim()) {
      throw new Error('Missing required fields: smtp_host, smtp_username, sender_email')
    }

    // Check for existing settings
    const { data: existing } = await supabase
      .from('user_email_smtp_settings')
      .select('id, smtp_password_vault_id')
      .eq('user_id', user.id)
      .eq('organization_id', organization_id)
      .maybeSingle()

    let vaultId = existing?.smtp_password_vault_id ?? null

    // Store or update the password in Vault if a new one is provided
    if (smtp_password?.trim()) {
      if (vaultId) {
        // Update existing vault secret
        await supabase.rpc('vault_update_secret', {
          p_id: vaultId,
          p_secret: smtp_password.trim(),
        })
      } else {
        // Create a new vault secret
        const { data: newVaultId, error: vaultErr } = await supabase.rpc(
          'vault_store_secret',
          {
            p_secret: smtp_password.trim(),
            p_name: `smtp_pw_${organization_id}_${user.id}`,
            p_description: `SMTP password for org ${organization_id}`,
          }
        )
        if (vaultErr) {
          console.error('Vault store error:', vaultErr)
          throw new Error('Failed to securely store password')
        }
        vaultId = newVaultId
      }
    }

    // New configurations must include a password
    if (!vaultId && !existing) {
      throw new Error('SMTP password is required for new configurations')
    }

    const now = new Date().toISOString()
    const settingsData = {
      smtp_host: smtp_host.trim(),
      smtp_port: smtp_port || 465,
      smtp_secure: smtp_secure !== false,
      smtp_username: smtp_username.trim(),
      smtp_password_vault_id: vaultId,
      sender_email: sender_email.trim(),
      sender_name: sender_name?.trim() || null,
      is_verified: false, // Reset verification on any change
      updated_at: now,
    }

    if (existing) {
      const { error: updateErr } = await supabase
        .from('user_email_smtp_settings')
        .update(settingsData)
        .eq('id', existing.id)

      if (updateErr) throw new Error(`Failed to update settings: ${updateErr.message}`)
    } else {
      const { error: insertErr } = await supabase
        .from('user_email_smtp_settings')
        .insert({
          ...settingsData,
          user_id: user.id,
          organization_id,
          created_at: now,
        })

      if (insertErr) throw new Error(`Failed to save settings: ${insertErr.message}`)
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('save-smtp-settings error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    )
  }
})
