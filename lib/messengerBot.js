// Facebook Messenger Bot — Response Logic
// Handles incoming messages and generates appropriate responses

import { getDonors, getCompatibleDonors, BLOOD_GROUPS, DHAKA_AREAS, COMPATIBILITY } from '@/lib/donors';

const GRAPH_API_URL = 'https://graph.facebook.com/v18.0/me/messages';

/**
 * Send a response message via Meta Graph API
 */
async function callSendAPI(senderPsid, response) {
  const PAGE_ACCESS_TOKEN = process.env.MESSENGER_PAGE_ACCESS_TOKEN;

  if (!PAGE_ACCESS_TOKEN) {
    console.error('MESSENGER_PAGE_ACCESS_TOKEN is not set');
    return;
  }

  const requestBody = {
    recipient: { id: senderPsid },
    message: response,
  };

  try {
    const res = await fetch(`${GRAPH_API_URL}?access_token=${PAGE_ACCESS_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const error = await res.json();
      console.error('Messenger API error:', error);
    }
  } catch (err) {
    console.error('Failed to send message:', err);
  }
}

/**
 * Send a text message
 */
async function sendTextMessage(senderPsid, text) {
  await callSendAPI(senderPsid, { text });
}

/**
 * Send quick reply buttons
 */
async function sendQuickReplies(senderPsid, text, replies) {
  await callSendAPI(senderPsid, {
    text,
    quick_replies: replies.map(r => ({
      content_type: 'text',
      title: r.title,
      payload: r.payload,
    })),
  });
}

/**
 * Send welcome message with main menu options
 */
async function sendWelcomeMessage(senderPsid) {
  await sendTextMessage(senderPsid, 
    '🩸 Welcome to RoktoSeba!\n\nWe connect blood donors with those in need across Dhaka.\n\nHow can I help you today?'
  );

  await sendQuickReplies(senderPsid, 'Choose an option:', [
    { title: '🔍 Find a Donor', payload: 'FIND_DONOR' },
    { title: '🆘 Post Request', payload: 'POST_REQUEST' },
    { title: '🩸 I Want to Donate', payload: 'WANT_TO_DONATE' },
    { title: '🏥 Blood Banks', payload: 'BLOOD_BANKS' },
    { title: '❓ Help / FAQ', payload: 'FAQ' },
  ]);
}

/**
 * Send blood group selection buttons
 */
async function sendBloodGroupButtons(senderPsid, context = 'SEARCH') {
  await sendQuickReplies(
    senderPsid,
    'Which blood group do you need?',
    BLOOD_GROUPS.map(bg => ({
      title: bg,
      payload: `${context}_BG_${bg}`,
    }))
  );
}

/**
 * Send area selection buttons (top areas due to quick reply limit of 13)
 */
async function sendAreaButtons(senderPsid, bloodGroup) {
  const topAreas = ['Dhanmondi', 'Gulshan', 'Mirpur', 'Uttara', 'Mohammadpur', 
                    'Banani', 'Motijheel', 'Badda', 'Bashundhara', 'Tejgaon'];

  await sendQuickReplies(
    senderPsid,
    `Looking for ${bloodGroup} donors. Which area in Dhaka?`,
    [
      { title: '📍 All Areas', payload: `AREA_ALL_${bloodGroup}` },
      ...topAreas.map(area => ({
        title: area,
        payload: `AREA_${area}_${bloodGroup}`,
      })),
    ]
  );
}

/**
 * Send donor search results
 */
async function sendDonorResults(senderPsid, bloodGroup, area) {
  const filters = {
    bloodGroup,
    area: area === 'ALL' ? 'all' : area,
    availableOnly: true,
    eligibleOnly: true,
  };

  const donors = await getDonors(filters);

  if (donors.length === 0) {
    await sendTextMessage(senderPsid,
      `😔 Sorry, no available ${bloodGroup} donors found${area !== 'ALL' ? ` in ${area}` : ''} right now.\n\nTry searching for compatible blood groups or a different area.`
    );

    // Suggest compatible groups
    const compat = COMPATIBILITY[bloodGroup];
    if (compat) {
      await sendTextMessage(senderPsid,
        `💡 Compatible blood groups that can donate to ${bloodGroup}:\n${compat.canReceiveFrom.join(', ')}`
      );
    }
    return;
  }

  const displayDonors = donors.slice(0, 5); // Show max 5 results

  let resultText = `✅ Found ${donors.length} available ${bloodGroup} donor${donors.length > 1 ? 's' : ''}${area !== 'ALL' ? ` in ${area}` : ''}:\n\n`;

  displayDonors.forEach((d, i) => {
    resultText += `${i + 1}. ${d.name}\n`;
    resultText += `   🩸 ${d.bloodGroup} | 📍 ${d.area}\n`;
    resultText += `   📞 ${d.phone}\n`;
    resultText += `   💪 ${d.totalDonations} donations\n\n`;
  });

  if (donors.length > 5) {
    resultText += `\n... and ${donors.length - 5} more. Visit our website for full results.`;
  }

  await sendTextMessage(senderPsid, resultText);

  // Follow-up options
  await sendQuickReplies(senderPsid, 'Need anything else?', [
    { title: '🔍 Search Again', payload: 'FIND_DONOR' },
    { title: '🆘 Post Request', payload: 'POST_REQUEST' },
    { title: '🏠 Main Menu', payload: 'GET_STARTED' },
  ]);
}

/**
 * Send FAQ / Help information
 */
async function sendFAQ(senderPsid) {
  await sendTextMessage(senderPsid,
    `❓ Frequently Asked Questions:\n\n` +
    `🔹 Who can donate blood?\nHealthy adults aged 18-65, weighing 50kg+, who haven't donated in the last 3 months.\n\n` +
    `🔹 Is it safe to donate?\nYes! Donating blood is completely safe. New, sterile equipment is used for each donor.\n\n` +
    `🔹 How often can I donate?\nYou can donate whole blood every 3 months (90 days).\n\n` +
    `🔹 Do I need to sign up?\nDonors can register on our website. Recipients can search and request blood without any sign-up!\n\n` +
    `🔹 Which blood groups are compatible?\nType "compatible A+" (replace with your blood group) to see compatibility.`
  );

  await sendQuickReplies(senderPsid, 'What would you like to do?', [
    { title: '🔍 Find a Donor', payload: 'FIND_DONOR' },
    { title: '🩸 I Want to Donate', payload: 'WANT_TO_DONATE' },
    { title: '🏠 Main Menu', payload: 'GET_STARTED' },
  ]);
}

/**
 * Send blood compatibility info for a specific group
 */
async function sendCompatibilityInfo(senderPsid, bloodGroup) {
  const compat = COMPATIBILITY[bloodGroup];
  if (!compat) {
    await sendTextMessage(senderPsid, '❌ Invalid blood group. Please use format like: compatible O+ or compatible AB-');
    return;
  }

  await sendTextMessage(senderPsid,
    `🩸 Blood Group Compatibility: ${bloodGroup}\n\n` +
    `✅ Can donate to: ${compat.canDonateTo.join(', ')}\n` +
    `✅ Can receive from: ${compat.canReceiveFrom.join(', ')}\n\n` +
    `${bloodGroup === 'O-' ? '⭐ O- is the Universal Donor!' : ''}` +
    `${bloodGroup === 'AB+' ? '⭐ AB+ is the Universal Recipient!' : ''}`
  );
}

// Simple in-memory state for multi-step conversations (per user session)
// In production, use Redis or Firestore for persistence
const userSessions = new Map();

/**
 * Main message handler — routes incoming messages to appropriate handlers
 */
export async function handleMessage(senderPsid, receivedMessage) {
  const messageText = receivedMessage.text?.toLowerCase().trim();

  // Handle quick reply payloads
  if (receivedMessage.quick_reply) {
    return handlePostback(senderPsid, receivedMessage.quick_reply.payload);
  }

  // Handle text messages
  if (messageText) {
    // Greetings
    if (['hi', 'hello', 'hey', 'start', 'menu', 'help me'].some(g => messageText.includes(g))) {
      return sendWelcomeMessage(senderPsid);
    }

    // Blood group search (e.g., "need B+ blood", "B+ donor", "I need O-", or just "O+")
    const bgMatch = messageText.match(/\b(ab|a|b|o)[+-]/i);
    const isExactBg = BLOOD_GROUPS.includes(messageText.toUpperCase());
    if (bgMatch && (isExactBg || messageText.includes('need') || messageText.includes('find') || messageText.includes('donor') || messageText.includes('blood'))) {
      const bloodGroup = bgMatch[0].toUpperCase();
      return sendAreaButtons(senderPsid, bloodGroup);
    }

    // Compatibility query
    if (messageText.startsWith('compatible')) {
      const bg = messageText.replace('compatible', '').trim().toUpperCase();
      if (BLOOD_GROUPS.includes(bg)) {
        return sendCompatibilityInfo(senderPsid, bg);
      }
    }

    // FAQ keywords
    if (['faq', 'question', 'help', 'info', 'about'].some(k => messageText.includes(k))) {
      return sendFAQ(senderPsid);
    }

    // Donate intent
    if (['donate', 'register', 'sign up', 'i want to donate'].some(k => messageText.includes(k))) {
      return handlePostback(senderPsid, 'WANT_TO_DONATE');
    }

    // Fallback
    await sendTextMessage(senderPsid,
      "🤔 I didn't quite understand that. Here are some things you can try:\n\n" +
      "• Type 'find O+ blood' to search for donors\n" +
      "• Type 'compatible B+' to see blood compatibility\n" +
      "• Type 'help' for FAQs\n" +
      "• Type 'donate' to register as a donor"
    );

    await sendQuickReplies(senderPsid, 'Or choose an option:', [
      { title: '🔍 Find a Donor', payload: 'FIND_DONOR' },
      { title: '🆘 Post Request', payload: 'POST_REQUEST' },
      { title: '❓ Help', payload: 'FAQ' },
    ]);
  }
}

/**
 * Handle postback payloads (button clicks, quick replies)
 */
export async function handlePostback(senderPsid, payload) {
  // Main menu
  if (payload === 'GET_STARTED') {
    return sendWelcomeMessage(senderPsid);
  }

  // Find donor flow
  if (payload === 'FIND_DONOR') {
    return sendBloodGroupButtons(senderPsid, 'SEARCH');
  }

  // Blood group selected for search
  if (payload.startsWith('SEARCH_BG_')) {
    const bloodGroup = payload.replace('SEARCH_BG_', '');
    return sendAreaButtons(senderPsid, bloodGroup);
  }

  // Area selected — send results
  if (payload.startsWith('AREA_')) {
    const parts = payload.replace('AREA_', '').split('_');
    const area = parts[0];
    const bloodGroup = parts.slice(1).join(''); // Handle groups like AB+
    // Fix: rejoin for blood groups with multiple characters
    const bgParts = payload.match(/AREA_(.+?)_((?:AB|A|B|O)[+-])/);
    if (bgParts) {
      return sendDonorResults(senderPsid, bgParts[2], bgParts[1]);
    }
    return sendDonorResults(senderPsid, bloodGroup, area);
  }

  // Want to donate
  if (payload === 'WANT_TO_DONATE') {
    await sendTextMessage(senderPsid,
      '🩸 Thank you for wanting to donate blood!\n\n' +
      'To register as a donor, please visit our website:\n' +
      '🌐 https://roktoseba.vercel.app\n\n' +
      'You can also visit any of these blood banks in Dhaka to donate directly:\n\n' +
      '🏥 Quantum Foundation — Shantinagar\n' +
      '🏥 Sandhani — Dhaka Medical College\n' +
      '🏥 Bangladesh Red Crescent — Mohakhali'
    );
    return;
  }

  // Post blood request
  if (payload === 'POST_REQUEST') {
    await sendTextMessage(senderPsid,
      '🆘 To post a blood request:\n\n' +
      '📱 Visit our website and fill out the quick request form (no sign-up needed!):\n' +
      '🌐 https://roktoseba.vercel.app\n\n' +
      'Or you can search for donors right here:\n'
    );
    return sendBloodGroupButtons(senderPsid, 'SEARCH');
  }

  // Blood banks
  if (payload === 'BLOOD_BANKS') {
    await sendTextMessage(senderPsid,
      '🏥 Blood Banks in Dhaka:\n\n' +
      '1. Quantum Foundation\n   📍 Shantinagar, Dhaka\n   📞 09666-710-710\n\n' +
      '2. Sandhani (DMCH Unit)\n   📍 Dhaka Medical College\n   📞 02-9668690\n\n' +
      '3. Bangladesh Red Crescent Society\n   📍 Mohakhali, Dhaka\n   📞 02-9116563\n\n' +
      '4. Badhan (BUET Unit)\n   📍 BUET Campus, Dhaka\n   📞 01711-017880\n\n' +
      '5. Voluntary Blood Donors Bangladesh\n   📍 Dhanmondi, Dhaka\n   📞 01978-345678'
    );

    return sendQuickReplies(senderPsid, 'What else can I help with?', [
      { title: '🔍 Find a Donor', payload: 'FIND_DONOR' },
      { title: '🏠 Main Menu', payload: 'GET_STARTED' },
    ]);
  }

  // FAQ
  if (payload === 'FAQ') {
    return sendFAQ(senderPsid);
  }
}
