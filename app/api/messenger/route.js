// Facebook Messenger Webhook API Route
// Handles webhook verification (GET) and incoming messages (POST)

import { handleMessage, handlePostback } from '@/lib/messengerBot';

const VERIFY_TOKEN = process.env.MESSENGER_VERIFY_TOKEN || 'roktoseba_verify_token';

/**
 * GET — Webhook Verification
 * Meta sends a GET request to verify the webhook URL
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Verify the webhook
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Messenger webhook verified');
    return new Response(challenge, { status: 200 });
  }

  console.error('❌ Webhook verification failed');
  return new Response('Forbidden', { status: 403 });
}

/**
 * POST — Incoming Messages
 * Meta sends message events to this endpoint
 */
export async function POST(request) {
  try {
    const body = await request.json();

    // Verify this is from a page subscription
    if (body.object !== 'page') {
      return new Response('Not Found', { status: 404 });
    }

    // Process each entry (there may be multiple)
    for (const entry of body.entry) {
      // Get the messaging events
      const messagingEvents = entry.messaging;

      if (!messagingEvents) continue;

      for (const event of messagingEvents) {
        const senderPsid = event.sender.id;

        if (event.message) {
          // Handle regular messages and quick replies
          await handleMessage(senderPsid, event.message);
        } else if (event.postback) {
          // Handle postback buttons (e.g., Get Started button)
          await handlePostback(senderPsid, event.postback.payload);
        }
      }
    }

    // Return 200 OK to acknowledge receipt
    return new Response('EVENT_RECEIVED', { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
