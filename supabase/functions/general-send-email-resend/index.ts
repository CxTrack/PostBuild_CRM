// Supabase Edge Function to proxy Resend API requests
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// CORS headers to allow requests from any origin
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
// Get Resend API key from environment variables
const RESEND_API_KEY = "re_YMidva59_358mudm5UJt66YqT5ewYhrjQ";
serve(async (req)=>{
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
  try {
    // Parse request body
    const requestData = await req.json();
    const { to, subject, html, from, reply_to, attachments } = requestData;
    // Validate required fields
    if (!to || !subject || !html || !from) {
      return new Response(JSON.stringify({
        error: 'Missing required parameters: to, subject, html, or from'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Ensure 'to' is an array
    const recipients = Array.isArray(to) ? to : [
      to
    ];
    // Prepare email data
    const emailData = {
      from: from,
      to: recipients,
      subject: subject,
      html: html,
      reply_to: reply_to || from
    };
    // Add attachments if provided
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      emailData.attachments = attachments;
    }
    // Send email using Resend API with attachments if provided
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify(emailData)
    });
    const data = await res.json();
    // Return the response
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to send email'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
