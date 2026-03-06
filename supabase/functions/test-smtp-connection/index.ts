/**
 * test-smtp-connection
 * Tests a saved SMTP configuration by connecting to the server and sending
 * a test email to the configured sender address.
 * On success, marks the settings as verified.
 *
 * POST body: { organization_id }
 */
import { createClient } from 'jsr:@supabase/supabase-js@2'
import nodemailer from 'npm:nodemailer@6'
import { getCorsHeaders, corsPreflightResponse } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return corsPreflightResponse(req)
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Authenticate
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) throw new Error('Unauthorized')

    const { organization_id } = await req.json()
    if (!organization_id) throw new Error('Missing organization_id')

    // Fetch SMTP settings for this user + org
    const { data: settings, error: fetchErr } = await supabase
      .from('user_email_smtp_settings')
      .select('*')
      .eq('user_id', user.id)
      .eq('organization_id', organization_id)
      .single()

    if (fetchErr || !settings) {
      throw new Error('No SMTP settings found. Please save your settings first.')
    }

    // Read the decrypted password from Vault
    if (!settings.smtp_password_vault_id) {
      throw new Error('SMTP password not found. Please re-save your settings.')
    }

    const { data: decryptedPassword, error: vaultErr } = await supabase.rpc(
      'vault_read_secret',
      { p_id: settings.smtp_password_vault_id }
    )

    if (vaultErr || !decryptedPassword) {
      console.error('Vault read error:', vaultErr)
      throw new Error('Failed to retrieve SMTP password')
    }

    // Create nodemailer transporter and verify the connection
    const transporter = nodemailer.createTransport({
      host: settings.smtp_host,
      port: settings.smtp_port,
      secure: settings.smtp_secure, // true = SSL/TLS (465), false = STARTTLS (587)
      auth: {
        user: settings.smtp_username,
        pass: decryptedPassword,
      },
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    })

    // First verify the connection (handshake + auth)
    try {
      await transporter.verify()
    } catch (verifyErr: unknown) {
      const msg = verifyErr instanceof Error ? verifyErr.message : String(verifyErr)
      console.error('SMTP verify failed:', msg)

      // Provide user-friendly error messages
      if (msg.includes('ECONNREFUSED')) {
        throw new Error(`Cannot connect to ${settings.smtp_host}:${settings.smtp_port}. Check your host and port.`)
      }
      if (msg.includes('ENOTFOUND') || msg.includes('getaddrinfo')) {
        throw new Error(`SMTP host "${settings.smtp_host}" not found. Check the hostname.`)
      }
      if (msg.includes('auth') || msg.includes('535') || msg.includes('Authentication')) {
        throw new Error('SMTP authentication failed. Check your username and password.')
      }
      if (msg.includes('ETIMEDOUT') || msg.includes('timeout')) {
        throw new Error(`Connection timed out. Try ${settings.smtp_secure ? 'STARTTLS (587)' : 'SSL/TLS (465)'} instead.`)
      }
      if (msg.includes('certificate') || msg.includes('TLS') || msg.includes('SSL')) {
        throw new Error('TLS/SSL error. Try switching between SSL/TLS (465) and STARTTLS (587).')
      }
      throw new Error(`SMTP connection failed: ${msg}`)
    }

    // Send a test email
    const fromAddress = settings.sender_name
      ? `"${settings.sender_name}" <${settings.sender_email}>`
      : settings.sender_email

    await transporter.sendMail({
      from: fromAddress,
      to: settings.sender_email, // Send to self
      subject: 'CxTrack CRM - SMTP Test Successful',
      text: 'Your SMTP connection is working correctly. You can now send emails from CxTrack CRM.',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px 20px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #22c55e, #16a34a); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 24px;">&#10003;</span>
            </div>
          </div>
          <h2 style="color: #111827; font-size: 18px; text-align: center; margin-bottom: 12px;">SMTP Connection Verified</h2>
          <p style="color: #6B7280; font-size: 14px; line-height: 1.6; text-align: center;">
            Your email settings are working correctly. Emails sent from CxTrack CRM will be delivered via <strong>${settings.smtp_host}</strong>.
          </p>
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
          <p style="color: #9CA3AF; font-size: 11px; text-align: center;">
            This is an automated test from CxTrack CRM.
          </p>
        </div>
      `,
    })

    // Mark as verified
    await supabase
      .from('user_email_smtp_settings')
      .update({ is_verified: true, updated_at: new Date().toISOString() })
      .eq('id', settings.id)

    transporter.close()

    return new Response(
      JSON.stringify({ success: true, message: 'SMTP connection verified. Test email sent.' }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('test-smtp-connection error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    )
  }
})
