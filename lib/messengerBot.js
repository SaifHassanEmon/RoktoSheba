// Facebook Messenger Bot — Response Logic
// Handles incoming messages and generates appropriate responses

import { getDonors, BLOOD_GROUPS, COMPATIBILITY } from '@/lib/donors';
import { BANGLADESH_DATA } from '@/data/bangladeshData';
import { BLOOD_BANKS } from '@/data/bloodBanks';

const GRAPH_API_URL = 'https://graph.facebook.com/v18.0/me/messages';

// Simple in-memory state for multi-step conversations (per user session)
const userSessions = new Map();

/**
 * Helper to parse user text and find if it matches a division, district, or area in Bangladesh
 */
function parseLocation(inputText) {
  if (!inputText) return null;
  const text = inputText.toLowerCase().trim();
  const cleanText = text.replace(/[-_]/g, ' ');
  
  // 1. Check if it's a division (exact match)
  for (const div of Object.keys(BANGLADESH_DATA)) {
    if (div.toLowerCase() === text) {
      return { type: 'division', name: div };
    }
  }
  
  // 2. Check if it's a district (exact match)
  for (const div of Object.values(BANGLADESH_DATA)) {
    for (const dist of Object.keys(div.districts)) {
      if (dist.toLowerCase() === text) {
        return { type: 'district', name: dist };
      }
    }
  }
  
  // 3. Check if it's an area (exact match)
  for (const div of Object.values(BANGLADESH_DATA)) {
    for (const districts of Object.values(div.districts)) {
      for (const area of districts) {
        if (area.toLowerCase() === text) {
          return { type: 'area', name: area };
        }
      }
    }
  }

  // 4. Substring check for districts (e.g. if someone types "cox bazar" for "Cox's Bazar")
  for (const div of Object.values(BANGLADESH_DATA)) {
    for (const dist of Object.keys(div.districts)) {
      const cleanDist = dist.toLowerCase().replace(/['s]/g, '').trim();
      if (cleanText.includes(cleanDist) || cleanDist.includes(cleanText)) {
        return { type: 'district', name: dist };
      }
    }
  }

  // 5. Substring check for areas (e.g. if someone types "mirpur 10" or "dhanmondi 15")
  // Sort areas by length descending so that longer area names (like "Mirpur DOHS") match before shorter ones ("Mirpur")
  const allAreas = [];
  for (const div of Object.values(BANGLADESH_DATA)) {
    for (const districts of Object.values(div.districts)) {
      for (const area of districts) {
        allAreas.push(area);
      }
    }
  }
  allAreas.sort((a, b) => b.length - a.length);

  for (const area of allAreas) {
    const areaLower = area.toLowerCase();
    if (cleanText.includes(areaLower) || areaLower.includes(cleanText)) {
      return { type: 'area', name: area };
    }
  }
  
  return null;
}

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
    '🩸 Welcome to RoktoSeba!\n\nWe connect blood donors with those in need across Bangladesh.\n\nHow can I help you today?'
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
 * Ask the user for their location
 */
async function sendLocationPrompt(senderPsid, bloodGroup) {
  // Save search state to session
  userSessions.set(senderPsid, { step: 'AWAITING_LOCATION', bloodGroup });

  const divisions = ['Dhaka', 'Chattogram', 'Sylhet', 'Rajshahi', 'Khulna', 'Barishal', 'Mymensingh', 'Rangpur'];

  await sendQuickReplies(
    senderPsid,
    `Looking for ${bloodGroup} donors. Please type your Division, District, or Area (e.g. Sylhet, Bogra, Mirpur, Zindabazar) or select a division:`,
    divisions.map(div => ({
      title: div,
      payload: `LOC_${div}_${bloodGroup}`,
    }))
  );
}

/**
 * Send donor search results
 */
async function sendDonorResults(senderPsid, bloodGroup, locationInput) {
  // Clear user session if any
  userSessions.delete(senderPsid);

  const loc = parseLocation(locationInput);
  
  const filters = {
    bloodGroup,
    availableOnly: true,
    eligibleOnly: false,
  };

  if (loc) {
    if (loc.type === 'division') filters.division = loc.name;
    else if (loc.type === 'district') filters.district = loc.name;
    else if (loc.type === 'area') filters.area = loc.name;
  } else {
    // Fallback: search by area name directly
    filters.area = locationInput;
  }

  const donors = await getDonors(filters);
  const locationLabel = loc ? loc.name : locationInput;

  if (donors.length === 0) {
    await sendTextMessage(senderPsid,
      `😔 Sorry, no available ${bloodGroup} donors found in "${locationLabel}" right now.\n\nTry searching for compatible blood groups or a different location.`
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

  let resultText = `✅ Found ${donors.length} available ${bloodGroup} donor${donors.length > 1 ? 's' : ''} in "${locationLabel}":\n\n`;

  displayDonors.forEach((d, i) => {
    resultText += `${i + 1}. ${d.name}\n`;
    const donorLoc = d.area ? `${d.district || 'Dhaka'} / ${d.area}` : (d.district || 'Dhaka');
    resultText += `   🩸 ${d.bloodGroup} | 📍 ${donorLoc}\n`;
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

/**
 * Ask user for location to search blood banks
 */
async function promptBloodBanksLocation(senderPsid) {
  userSessions.set(senderPsid, { step: 'AWAITING_BANKS_LOCATION' });

  const divisions = ['Dhaka', 'Chattogram', 'Sylhet', 'Rajshahi', 'Khulna', 'Barishal', 'Mymensingh', 'Rangpur'];

  await sendQuickReplies(
    senderPsid,
    'Please type your Division, District, or Area, or select a division below to search for blood banks:',
    divisions.map(div => ({
      title: div,
      payload: `BANKSLOC_${div}`,
    }))
  );
}

/**
 * Search and send blood bank results
 */
async function sendBloodBankResults(senderPsid, locationInput) {
  userSessions.delete(senderPsid);

  const loc = parseLocation(locationInput);
  let filteredBanks = BLOOD_BANKS;

  if (loc) {
    if (loc.type === 'division') {
      filteredBanks = BLOOD_BANKS.filter(b => b.division.toLowerCase() === loc.name.toLowerCase());
    } else if (loc.type === 'district') {
      filteredBanks = BLOOD_BANKS.filter(b => b.district.toLowerCase() === loc.name.toLowerCase());
    } else if (loc.type === 'area') {
      filteredBanks = BLOOD_BANKS.filter(b => b.address.toLowerCase().includes(loc.name.toLowerCase()) || b.name.toLowerCase().includes(loc.name.toLowerCase()));
    }
  } else {
    // Fallback search in address/name/division/district
    const searchVal = locationInput.toLowerCase().trim();
    filteredBanks = BLOOD_BANKS.filter(b => 
      b.address.toLowerCase().includes(searchVal) || 
      b.name.toLowerCase().includes(searchVal) ||
      b.division.toLowerCase().includes(searchVal) ||
      b.district.toLowerCase().includes(searchVal)
    );
  }

  const locationLabel = loc ? loc.name : locationInput;

  if (filteredBanks.length === 0) {
    await sendTextMessage(senderPsid,
      `😔 Sorry, no registered blood banks found in "${locationLabel}" right now.\n\nTry searching for a major division or district like Dhaka, Chattogram, or Sylhet.`
    );
    
    // Suggest options
    return sendQuickReplies(senderPsid, 'What would you like to do?', [
      { title: '🏥 Search Blood Banks', payload: 'BLOOD_BANKS' },
      { title: '🏠 Main Menu', payload: 'GET_STARTED' }
    ]);
  }

  let resultText = `🏥 Found ${filteredBanks.length} blood bank${filteredBanks.length > 1 ? 's' : ''} in "${locationLabel}":\n\n`;
  filteredBanks.slice(0, 5).forEach((b, i) => {
    resultText += `${i + 1}. ${b.name}\n`;
    resultText += `   📍 ${b.address}\n`;
    resultText += `   📞 ${b.phone}\n`;
    if (b.website) resultText += `   🌐 ${b.website}\n`;
    resultText += `   🕒 ${b.availableStatus}\n\n`;
  });

  if (filteredBanks.length > 5) {
    resultText += `\n... and ${filteredBanks.length - 5} more. Visit our website for the full directory and directions.`;
  }

  await sendTextMessage(senderPsid, resultText);

  // Follow-up options
  await sendQuickReplies(senderPsid, 'Need anything else?', [
    { title: '🔍 Find a Donor', payload: 'FIND_DONOR' },
    { title: '🏥 Search Blood Banks', payload: 'BLOOD_BANKS' },
    { title: '🏠 Main Menu', payload: 'GET_STARTED' },
  ]);
}

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
    // 1. Check for standard commands/keywords first
    
    // Greetings
    if (['hi', 'hello', 'hey', 'start', 'menu', 'help me'].some(g => messageText.includes(g))) {
      userSessions.delete(senderPsid);
      return sendWelcomeMessage(senderPsid);
    }

    // Blood group search (e.g., "need B+ blood", "B+ donor", "I need O-", or just "O+")
    const bgMatch = messageText.match(/\b(ab|a|b|o)[+-]/i);
    const isExactBg = BLOOD_GROUPS.includes(messageText.toUpperCase());
    if (bgMatch && (isExactBg || messageText.includes('need') || messageText.includes('find') || messageText.includes('donor') || messageText.includes('blood'))) {
      const bloodGroup = bgMatch[0].toUpperCase();
      return sendLocationPrompt(senderPsid, bloodGroup);
    }

    // Compatibility query
    if (messageText.startsWith('compatible')) {
      userSessions.delete(senderPsid);
      const bg = messageText.replace('compatible', '').trim().toUpperCase();
      if (BLOOD_GROUPS.includes(bg)) {
        return sendCompatibilityInfo(senderPsid, bg);
      }
    }

    // FAQ keywords
    if (['faq', 'question', 'help', 'info', 'about'].some(k => messageText.includes(k))) {
      userSessions.delete(senderPsid);
      return sendFAQ(senderPsid);
    }

    // Donate intent
    if (['donate', 'register', 'sign up', 'i want to donate'].some(k => messageText.includes(k))) {
      userSessions.delete(senderPsid);
      return handlePostback(senderPsid, 'WANT_TO_DONATE');
    }

    // 2. If no keywords match, check if there is an active session awaiting input
    const session = userSessions.get(senderPsid);
    if (session) {
      if (session.step === 'AWAITING_LOCATION') {
        userSessions.delete(senderPsid);
        return sendDonorResults(senderPsid, session.bloodGroup, messageText);
      }

      if (session.step === 'AWAITING_BANKS_LOCATION') {
        userSessions.delete(senderPsid);
        return sendBloodBankResults(senderPsid, messageText);
      }
    }

    // 3. Fallback if no match and no active session
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
      { title: '🏥 Blood Banks', payload: 'BLOOD_BANKS' },
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
    return sendLocationPrompt(senderPsid, bloodGroup);
  }

  // Location selected for search — send results
  if (payload.startsWith('LOC_')) {
    const parts = payload.replace('LOC_', '').split('_');
    const location = parts[0];
    const bloodGroup = parts.slice(1).join('_'); // Handle AB+
    return sendDonorResults(senderPsid, bloodGroup, location);
  }

  // Want to donate
  if (payload === 'WANT_TO_DONATE') {
    await sendTextMessage(senderPsid,
      '🩸 Thank you for wanting to donate blood!\n\n' +
      'To register as a donor, please visit our website:\n' +
      '🌐 https://roktoseba.vercel.app/register\n\n' +
      'You can also find nearby blood banks to donate directly using our directory!'
    );
    return promptBloodBanksLocation(senderPsid);
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

  // Blood banks flow
  if (payload === 'BLOOD_BANKS') {
    return promptBloodBanksLocation(senderPsid);
  }

  // Blood banks location selected
  if (payload.startsWith('BANKSLOC_')) {
    const location = payload.replace('BANKSLOC_', '');
    return sendBloodBankResults(senderPsid, location);
  }

  // FAQ
  if (payload === 'FAQ') {
    return sendFAQ(senderPsid);
  }
}
