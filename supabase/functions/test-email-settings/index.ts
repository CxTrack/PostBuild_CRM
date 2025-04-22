import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SmtpClient } from "npm:nodemailer";

serve(async (req) => {
  try {
    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error("Error parsing JSON:", e);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid JSON in request body' 
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const { settings } = body;
    
    console.log("Received settings:", JSON.stringify({
      ...settings,
      smtp_password: settings?.smtp_password ? '***REDACTED***' : undefined
    }));

    // Validate required fields
    if (!settings || !settings.smtp_host || !settings.smtp_port || 
        !settings.smtp_username || !settings.smtp_password || 
        !settings.from_email || !settings.from_name) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing required email settings' 
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Validate email format
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(settings.from_email)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid email format' 
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Create transporter
    try {
      const portNumber = parseInt(settings.smtp_port);
      if (isNaN(portNumber) || portNumber < 1 || portNumber > 65535) {
        throw new Error('Invalid SMTP port number');
      }

      const transporter = new SmtpClient({
        host: settings.smtp_host,
        port: portNumber,
        secure: portNumber === 465, // true for 465, false for other ports
        auth: {
          user: settings.smtp_username,
          pass: settings.smtp_password,
        },
        tls: {
          // Do not fail on invalid certs
          rejectUnauthorized: false,
        },
        debug: true, // Enable debug output
        logger: true, // Log to console
      });

      // Verify connection configuration
      await transporter.verify();

      // Send test email
      const info = await transporter.sendMail({
        from: `"${settings.from_name}" <${settings.from_email}>`,
        to: settings.from_email, // Send to self for testing
        subject: "CxTrack Email Settings Test",
        text: "This is a test email to verify your SMTP settings are working correctly.",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #4f46e5;">CxTrack Email Settings Test</h2>
            <p>This is a test email to verify your SMTP settings are working correctly.</p>
            <p>If you're seeing this message, your email configuration is working properly!</p>
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <p style="font-size: 12px; color: #666;">This is an automated message from CxTrack. Please do not reply to this email.</p>
            </div>
          </div>
        `,
      });

      console.log("Test email sent successfully:", info.messageId);

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Test email sent successfully',
        info: info
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (smtpError) {
      console.error('SMTP Error:', smtpError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: `SMTP Error: ${smtpError.message || 'Failed to connect to email server'}`
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  } catch (error) {
    console.error('Error sending test email:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Failed to send test email'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});