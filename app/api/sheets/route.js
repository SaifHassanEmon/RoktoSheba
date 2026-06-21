import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const data = await request.json();
    
    // We expect the script URL to be in the environment variables
    const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
    
    if (!scriptUrl) {
      console.warn('Google Script URL is missing in environment variables.');
      // Fail silently to not break the registration flow, but log the error
      return NextResponse.json({ success: false, message: 'Google Script URL not configured.' }, { status: 200 });
    }

    // Google Apps Script usually expects a POST request.
    const response = await fetch(scriptUrl, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // Apps script CORS workaround
      },
    });

    if (!response.ok) {
      throw new Error(`Google Script responded with status: ${response.status}`);
    }
    
    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error forwarding data to Google Sheets:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
