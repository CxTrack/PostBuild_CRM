import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// Get webhook secret from environment
const webhookSecret = Deno.env.get("CAL_WEBHOOK_SECRET") || "";
/** Convert hex string to Uint8Array */ function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for(let i = 0; i < bytes.length; i++){
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}
/** Validate HMAC signature */ async function isValidSignature(rawBody, headerSignature, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), {
    name: "HMAC",
    hash: "SHA-256"
  }, false, [
    "verify"
  ]);
  const decodedSignature = hexToBytes(headerSignature);
  return await crypto.subtle.verify("HMAC", key, decodedSignature, rawBody);
}
Deno.serve(async (req)=>{
  const supabaseUrl = Deno.env.get("DB_URL");
  const supabaseKey = Deno.env.get("DB_SERVICE_ROLE_KEY");
  const supabase = createClient(supabaseUrl, supabaseKey);
  try {
    const signature = req.headers.get("x-cal-signature-256");
    if (!signature) {
      return new Response("Missing x-cal-signature-256 header", {
        status: 400
      });
    }
    const rawBody = new Uint8Array(await req.arrayBuffer());
    // ✅ Signature check — now this function is defined above
    //const valid = await isValidSignature(rawBody, signature, webhookSecret);
    //if (!valid) {
    //  console.error("Invalid signature");
    //  return new Response("Invalid signature", {
    //    status: 403
    //  });
    //}
    const textBody = new TextDecoder().decode(rawBody);
    const body = JSON.parse(textBody);
    const payload = body.payload;
    const title = payload.title || payload.eventTitle || "Untitled";
    let description = payload.description || payload.additionalNotes || "";
    const start = payload.startTime;
    const end = payload.endTime;
    const calEventId = payload.uid;
    console.log("📦 Parsed Body Object:\n", JSON.stringify(body, null, 2)); // Pretty-prints JSON object
    if (body.triggerEvent === "BOOKING_CREATED") {
      const eventTypeId = payload.eventTypeId;
      console.log("eventTypeId: " + eventTypeId);
      // Add attendees info
      if (Array.isArray(payload.attendees) && payload.attendees.length > 0) {
        const attendeeList = payload.attendees.map((attendee)=>{
          return `- ${attendee.name || "Unnamed"} (${attendee.email || "No email"})`;
        }).join("\n");
        description += `\n\nAttendees:\n${attendeeList}`;
      }
      // Add videoCallUrl if available
      if (payload.metadata.videoCallUrl) {
        description += `\n\nVideo Call: ${payload.metadata.videoCallUrl}`;
      }
      // Fetch user_id based on eventTypeId from calendar_settings
      const { data: settingsData, error: settingsError } = await supabase.from("callendar_settings").select("user_id").eq("event_type_id", eventTypeId).maybeSingle();
      if (settingsError || !settingsData) {
        console.error("Error retrieving user_id from calendar_settings:", settingsError);
        return new Response("User ID not found for eventTypeId", {
          status: 400
        });
      }
      const user_id = settingsData.user_id;
      const { error } = await supabase.from("calendar_events").insert({
        user_id,
        title,
        description,
        start,
        end,
        type: 'custom',
        calcom_id: calEventId
      });
      if (error) {
        console.error("Insert error:", error);
        return new Response("Database insert failed", {
          status: 500
        });
      }
    } else if (body.triggerEvent === "BOOKING_CANCELLED") {
      if (!calEventId) {
        console.error("Missing cal_event_id (uid) in cancellation payload");
        return new Response("Missing cal_event_id", {
          status: 400
        });
      }
      const { error: deleteError } = await supabase.from("calendar_events").delete().eq("calcom_id", calEventId);
      if (deleteError) {
        console.error("Delete error:", deleteError);
        return new Response("Failed to delete calendar event", {
          status: 500
        });
      }
      console.log(`🗑️ Deleted event with calcom_id ${calEventId}`);
    } else if (body.triggerEvent === "BOOKING_RESCHEDULED") {
      const rescheduleUid = payload.rescheduleUid;
      if (!rescheduleUid) {
        console.error("Missing cal_event_id (uid) in reschedule payload");
        return new Response("Missing cal_event_id", {
          status: 400
        });
      }
      const { error: updateError } = await supabase.from("calendar_events").update({
        start: start,
        end: end,
        title: title,
        description: description,
        calcom_id: calEventId
      }).eq("calcom_id", rescheduleUid);
      if (updateError) {
        console.error("Update error:", updateError);
        return new Response("Failed to update calendar event", {
          status: 500
        });
      }
      console.log(`📅 Updated event with calcom_id ${calEventId}`);
    }
    console.log("✅ Event handled successfully");
    return new Response("Event handled successfully", {
      status: 200
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({
      error: err.message
    }), {
      status: 400,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
});
