import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_URL = "https://api.resend.com/emails";

type EmailTemplate =
  | "welcome"
  | "subscription-confirmed"
  | "payment-receipt"
  | "payment-failed"
  | "certification-purchased"
  | "certification-approved"
  | "certification-rejected"
  | "event-ticket"
  | "event-reminder"
  | "new-module"
  | "progress-milestone"
  | "newsletter"
  | "promotional"
  | "team-invite";

interface EmailRequest {
  to: string;
  user_id?: string;
  template: EmailTemplate;
  data: Record<string, unknown>;
  skip_preference_check?: boolean;
}

// Map templates to preference fields
const templatePreferences: Record<EmailTemplate, string | null> = {
  welcome: null, // Always send
  "subscription-confirmed": "subscription_updates",
  "payment-receipt": "payment_receipts",
  "payment-failed": "subscription_updates",
  "certification-purchased": "certification_updates",
  "certification-approved": "certification_updates",
  "certification-rejected": "certification_updates",
  "event-ticket": "event_confirmations",
  "event-reminder": "event_reminders",
  "new-module": "learning_updates",
  "progress-milestone": "progress_milestones",
  newsletter: "newsletter",
  promotional: "promotional_emails",
  "team-invite": null, // Always send - transactional invite
};

interface TemplateContent {
  subject: string;
  html: string;
}

function getEmailStyles(): string {
  return `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
      .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
      .header { background-color: #000000; padding: 24px; text-align: center; }
      .header img { height: 40px; }
      .header h1 { color: #ffffff; margin: 12px 0 0 0; font-size: 24px; font-weight: 600; }
      .content { padding: 32px 24px; }
      .content h2 { color: #1a1a1a; font-size: 20px; margin: 0 0 16px 0; }
      .content p { color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0; }
      .button { display: inline-block; background-color: #000000; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin: 16px 0; }
      .details-box { background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin: 20px 0; }
      .details-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
      .details-row:last-child { border-bottom: none; }
      .details-label { color: #666; }
      .details-value { color: #1a1a1a; font-weight: 500; }
      .footer { background-color: #f5f5f5; padding: 24px; text-align: center; }
      .footer p { color: #888; font-size: 12px; margin: 4px 0; }
      .footer a { color: #666; text-decoration: underline; }
      .highlight { color: #000000; font-weight: 600; }
      .success { color: #22c55e; }
      .warning { color: #f59e0b; }
      .error { color: #ef4444; }
    </style>
  `;
}

function getEmailHeader(): string {
  return `
    <div class="header">
      <h1>Bob University</h1>
    </div>
  `;
}

function getEmailFooter(unsubscribeUrl?: string): string {
  return `
    <div class="footer">
      <p>Bob University - Master the Art of Hair</p>
      <p>&copy; ${new Date().getFullYear()} Bob University. All rights reserved.</p>
      ${unsubscribeUrl ? `<p><a href="${unsubscribeUrl}">Unsubscribe from these emails</a></p>` : ""}
    </div>
  `;
}

function generateTemplate(
  template: EmailTemplate,
  data: Record<string, unknown>,
  unsubscribeUrl?: string
): TemplateContent {
  const styles = getEmailStyles();
  const header = getEmailHeader();
  const footer = getEmailFooter(unsubscribeUrl);

  const wrapHtml = (content: string) => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${styles}
      </head>
      <body>
        <div class="container">
          ${header}
          ${content}
          ${footer}
        </div>
      </body>
    </html>
  `;

  switch (template) {
    case "welcome":
      return {
        subject: "Welcome to Bob University!",
        html: wrapHtml(`
          <div class="content">
            <h2>Welcome, ${data.firstName || "there"}!</h2>
            <p>We're thrilled to have you join the Bob University community. You've just taken the first step toward mastering the art of hair.</p>
            <p>Here's what you can do next:</p>
            <ul>
              <li>Explore our video library and start learning</li>
              <li>Complete your first module to earn points</li>
              <li>Check out the certification program when you're ready</li>
            </ul>
            <a href="https://app.bobuniversity.com" class="button">Start Learning</a>
            <p>Have questions? We're here to help!</p>
          </div>
        `),
      };

    case "subscription-confirmed":
      return {
        subject: "Your Bob University Subscription is Active!",
        html: wrapHtml(`
          <div class="content">
            <h2>Welcome to ${data.planName || "Premium"}!</h2>
            <p>Your subscription is now active. You have unlimited access to all premium content.</p>
            <div class="details-box">
              <div class="details-row">
                <span class="details-label">Plan</span>
                <span class="details-value">${data.planName || "Premium"}</span>
              </div>
              <div class="details-row">
                <span class="details-label">Billing Period</span>
                <span class="details-value">${data.billingPeriod || "Monthly"}</span>
              </div>
              <div class="details-row">
                <span class="details-label">Next Billing Date</span>
                <span class="details-value">${data.nextBillingDate || "N/A"}</span>
              </div>
            </div>
            <a href="https://app.bobuniversity.com" class="button">Access Premium Content</a>
          </div>
        `),
      };

    case "payment-receipt":
      return {
        subject: `Payment Receipt - $${data.amount || "0.00"}`,
        html: wrapHtml(`
          <div class="content">
            <h2>Payment Received</h2>
            <p>Thank you for your payment. Here are your receipt details:</p>
            <div class="details-box">
              <div class="details-row">
                <span class="details-label">Amount</span>
                <span class="details-value">$${data.amount || "0.00"}</span>
              </div>
              <div class="details-row">
                <span class="details-label">Description</span>
                <span class="details-value">${data.description || "Bob University Subscription"}</span>
              </div>
              <div class="details-row">
                <span class="details-label">Date</span>
                <span class="details-value">${data.date || new Date().toLocaleDateString()}</span>
              </div>
              <div class="details-row">
                <span class="details-label">Receipt #</span>
                <span class="details-value">${data.receiptId || "N/A"}</span>
              </div>
            </div>
            <p>If you have any questions about this charge, please contact us.</p>
          </div>
        `),
      };

    case "payment-failed":
      return {
        subject: "Action Required: Payment Failed",
        html: wrapHtml(`
          <div class="content">
            <h2 class="warning">Payment Failed</h2>
            <p>We were unable to process your payment for your Bob University subscription.</p>
            <div class="details-box">
              <div class="details-row">
                <span class="details-label">Amount</span>
                <span class="details-value">$${data.amount || "0.00"}</span>
              </div>
              <div class="details-row">
                <span class="details-label">Reason</span>
                <span class="details-value">${data.reason || "Payment declined"}</span>
              </div>
            </div>
            <p>Please update your payment method to continue your access to premium content.</p>
            <a href="https://app.bobuniversity.com/settings/billing" class="button">Update Payment Method</a>
            <p>If you believe this is an error, please contact your bank or reach out to us for assistance.</p>
          </div>
        `),
      };

    case "certification-purchased":
      return {
        subject: "Your Certification Journey Begins!",
        html: wrapHtml(`
          <div class="content">
            <h2>Certification Purchased!</h2>
            <p>Congratulations on taking this exciting step! You've purchased the ${data.certificationName || "Ray-Certified Stylist"} certification.</p>
            <div class="details-box">
              <div class="details-row">
                <span class="details-label">Certification</span>
                <span class="details-value">${data.certificationName || "Ray-Certified Stylist"}</span>
              </div>
              <div class="details-row">
                <span class="details-label">Amount Paid</span>
                <span class="details-value">$${data.amount || "0.00"}</span>
              </div>
            </div>
            <h3>Next Steps:</h3>
            <ol>
              <li>Review the certification requirements in the app</li>
              <li>Record your submission video demonstrating your skills</li>
              <li>Upload your video through the certification portal</li>
            </ol>
            <a href="https://app.bobuniversity.com/certification" class="button">Start Your Submission</a>
            <p>Good luck! We can't wait to see your skills.</p>
          </div>
        `),
      };

    case "certification-approved":
      return {
        subject: "Congratulations! You're Now Certified!",
        html: wrapHtml(`
          <div class="content">
            <h2 class="success">Certification Approved!</h2>
            <p>Amazing news, ${data.firstName || "stylist"}! Your ${data.certificationName || "Ray-Certified Stylist"} certification has been approved.</p>
            <p>You've demonstrated exceptional skill and are now part of an elite group of certified stylists.</p>
            <div class="details-box">
              <div class="details-row">
                <span class="details-label">Certification</span>
                <span class="details-value">${data.certificationName || "Ray-Certified Stylist"}</span>
              </div>
              <div class="details-row">
                <span class="details-label">Certified Date</span>
                <span class="details-value">${data.certifiedDate || new Date().toLocaleDateString()}</span>
              </div>
            </div>
            <h3>What's Next?</h3>
            <ul>
              <li>Your digital certificate is now available in the app</li>
              <li>You're eligible to join the Stylist Directory</li>
              <li>Share your achievement on social media!</li>
            </ul>
            <a href="https://app.bobuniversity.com/certification" class="button">View Your Certificate</a>
          </div>
        `),
      };

    case "certification-rejected":
      return {
        subject: "Certification Feedback",
        html: wrapHtml(`
          <div class="content">
            <h2>Certification Review Complete</h2>
            <p>Thank you for submitting your certification video. After careful review, we're not able to approve your submission at this time.</p>
            <div class="details-box">
              <h4>Feedback from our reviewer:</h4>
              <p>${data.feedback || "Please review the certification requirements and try again."}</p>
            </div>
            <p>Don't be discouraged! Many successful stylists need multiple attempts. Use this feedback to improve and resubmit when you're ready.</p>
            <h3>Tips for your next submission:</h3>
            <ul>
              <li>Ensure good lighting and camera angles</li>
              <li>Clearly demonstrate each required technique</li>
              <li>Review the certification checklist before recording</li>
            </ul>
            <a href="https://app.bobuniversity.com/certification" class="button">Try Again</a>
          </div>
        `),
      };

    case "event-ticket":
      return {
        subject: `Your Ticket: ${data.eventName || "Bob University Event"}`,
        html: wrapHtml(`
          <div class="content">
            <h2>You're In!</h2>
            <p>Your ticket for ${data.eventName || "the event"} has been confirmed.</p>
            <div class="details-box">
              <div class="details-row">
                <span class="details-label">Event</span>
                <span class="details-value">${data.eventName || "Bob University Event"}</span>
              </div>
              <div class="details-row">
                <span class="details-label">Date</span>
                <span class="details-value">${data.eventDate || "TBD"}</span>
              </div>
              <div class="details-row">
                <span class="details-label">Location</span>
                <span class="details-value">${data.location || "TBD"}</span>
              </div>
              <div class="details-row">
                <span class="details-label">Ticket Code</span>
                <span class="details-value highlight">${data.ticketCode || "N/A"}</span>
              </div>
            </div>
            <p>Show this email or your ticket code at the door for entry.</p>
            <a href="https://app.bobuniversity.com/events" class="button">View Event Details</a>
            <p>We can't wait to see you there!</p>
          </div>
        `),
      };

    case "event-reminder":
      return {
        subject: `Reminder: ${data.eventName || "Event"} is ${data.timeUntil || "coming up"}!`,
        html: wrapHtml(`
          <div class="content">
            <h2>Event Reminder</h2>
            <p>${data.eventName || "Your event"} is ${data.timeUntil || "coming up soon"}!</p>
            <div class="details-box">
              <div class="details-row">
                <span class="details-label">Event</span>
                <span class="details-value">${data.eventName || "Bob University Event"}</span>
              </div>
              <div class="details-row">
                <span class="details-label">Date</span>
                <span class="details-value">${data.eventDate || "TBD"}</span>
              </div>
              <div class="details-row">
                <span class="details-label">Location</span>
                <span class="details-value">${data.location || "TBD"}</span>
              </div>
              <div class="details-row">
                <span class="details-label">Your Ticket</span>
                <span class="details-value">${data.ticketCode || "N/A"}</span>
              </div>
            </div>
            <p>Don't forget to bring your ticket code for check-in!</p>
            <a href="https://app.bobuniversity.com/events" class="button">View Event</a>
          </div>
        `),
      };

    case "new-module":
      return {
        subject: `New Content: ${data.moduleName || "New Module Available"}`,
        html: wrapHtml(`
          <div class="content">
            <h2>New Content Available!</h2>
            <p>A new module has been added to Bob University:</p>
            <div class="details-box">
              <h3>${data.moduleName || "New Module"}</h3>
              <p>${data.description || "Check out the latest content in the app."}</p>
            </div>
            <a href="https://app.bobuniversity.com/modules/${data.moduleId || ""}" class="button">Start Learning</a>
          </div>
        `),
      };

    case "progress-milestone":
      return {
        subject: `Congratulations on your progress!`,
        html: wrapHtml(`
          <div class="content">
            <h2 class="success">Milestone Achieved!</h2>
            <p>Amazing work, ${data.firstName || "there"}! You've reached a new milestone:</p>
            <div class="details-box">
              <h3>${data.milestoneName || "Achievement Unlocked"}</h3>
              <p>${data.description || "Keep up the great work!"}</p>
            </div>
            <a href="https://app.bobuniversity.com" class="button">Continue Learning</a>
          </div>
        `),
      };

    case "team-invite":
      return {
        subject: `You're invited to join ${data.salonName || "a salon"} on Bob University`,
        html: wrapHtml(`
          <div class="content">
            <h2>You've Been Invited!</h2>
            <p>${data.ownerName ? `${data.ownerName} has` : "Your salon owner has"} invited you to join <strong>${data.salonName || "their salon"}</strong> on Bob University.</p>
            <p>Use the access code below to get started with your team's training:</p>
            <div class="details-box" style="text-align: center;">
              <p style="font-size: 36px; font-family: monospace; letter-spacing: 8px; font-weight: bold; color: #000; margin: 16px 0;">${data.accessCode || "------"}</p>
              <p style="color: #666; font-size: 14px; margin: 0;">This code expires ${data.expiresIn || "in 48 hours"}</p>
            </div>
            <h3>How to Join:</h3>
            <ol>
              <li>Download the Bob University app</li>
              <li>Create your account or sign in</li>
              <li>Enter the access code above when prompted</li>
              <li>Start learning with your team!</li>
            </ol>
            <a href="https://apps.apple.com/app/bob-university" class="button">Download the App</a>
            <p style="margin-top: 24px; font-size: 14px; color: #666;">Questions? Contact your salon owner or reply to this email.</p>
          </div>
        `),
      };

    default:
      return {
        subject: "Update from Bob University",
        html: wrapHtml(`
          <div class="content">
            <h2>Hello!</h2>
            <p>${data.message || "We have an update for you from Bob University."}</p>
            <a href="https://app.bobuniversity.com" class="button">Open App</a>
          </div>
        `),
      };
  }
}

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "Bob University <hello@bobuniversity.com>";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const payload: EmailRequest = await req.json();

    if (!payload.to || !payload.template) {
      throw new Error("Missing required fields: to, template");
    }

    // Initialize Supabase admin client for logging and preference checks
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Check user preferences if user_id provided and not skipping preference check
    const preferenceField = templatePreferences[payload.template];
    if (preferenceField && payload.user_id && !payload.skip_preference_check) {
      const { data: preferences } = await adminClient
        .from("notification_preferences")
        .select(preferenceField)
        .eq("user_id", payload.user_id)
        .single();

      if (preferences && preferences[preferenceField] === false) {
        // User has opted out of this type of email
        return new Response(
          JSON.stringify({
            success: true,
            skipped: true,
            reason: "User opted out of this email type",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Generate unsubscribe URL with HMAC-signed token
    let unsubscribeUrl: string | undefined;
    if (payload.user_id && preferenceField) {
      const tokenSecret = Deno.env.get("UNSUBSCRIBE_TOKEN_SECRET") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
      const tokenData = {
        user_id: payload.user_id,
        preference: preferenceField,
        timestamp: Date.now(),
      };

      // Create HMAC signature
      const encoder = new TextEncoder();
      const dataString = JSON.stringify(tokenData);
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(tokenSecret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(dataString));
      const signatureHex = Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Include signature in token
      const signedToken = btoa(JSON.stringify({ ...tokenData, sig: signatureHex }));
      unsubscribeUrl = `https://app.bobuniversity.com/unsubscribe?token=${signedToken}`;
    }

    // Generate email content
    const { subject, html } = generateTemplate(
      payload.template,
      payload.data,
      unsubscribeUrl
    );

    // Send via Resend
    const resendResponse = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: payload.to,
        subject,
        html,
        headers: unsubscribeUrl
          ? {
              "List-Unsubscribe": `<${unsubscribeUrl}>`,
              "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            }
          : undefined,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      throw new Error(`Resend API error: ${resendResponse.status} - ${errorText}`);
    }

    const resendResult = await resendResponse.json();

    // Log the email
    await adminClient.from("email_logs").insert({
      user_id: payload.user_id || null,
      template: payload.template,
      to_email: payload.to,
      subject,
      resend_id: resendResult.id,
      status: "sent",
      metadata: payload.data,
    });

    return new Response(
      JSON.stringify({
        success: true,
        resend_id: resendResult.id,
        template: payload.template,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Send email error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
