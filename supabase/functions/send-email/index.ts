import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SmtpClient } from "npm:nodemailer";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  try {
    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    let requestData;
    try {
      requestData = await req.json();
    } catch (e) {
      console.error("Error parsing JSON:", e);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid JSON in request body' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { to, subject, body, sender, settings } = requestData;
    
    console.log("Received email request:", JSON.stringify({
      to,
      subject,
      bodyLength: body?.length,
      sender,
      settings: settings ? {
        ...settings,
        smtp_password: '***REDACTED***'
      } : undefined
    }));

    // Validate required fields
    if (!to || !subject || !body || !settings) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing required email parameters' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate email format
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(to) || !emailRegex.test(settings.from_email)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid email format' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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

      // Send email
      const info = await transporter.sendMail({
        from: `"${settings.from_name}" <${settings.from_email}>`,
        to: to,
        subject: subject,
        text: body,
        html: body.replace(/\n/g, '<br>'),
      });

      console.log("Email sent successfully:", info.messageId);

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        info: info
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (smtpError) {
      console.error('SMTP Error:', smtpError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: `SMTP Error: ${smtpError.message || 'Failed to connect to email server'}`
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error sending email:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Failed to send email'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});