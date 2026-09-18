/**
 * Server-side route to fetch the client token
 * This keeps CLIENT_EMAIL, CLIENT_IV, CLIENT_KEY secret (never sent to browser)
 */

import { NextResponse } from "next/server";

export async function GET() {
  try {
    const authBaseUrl = process.env.AUTH_BASE_URL;
    const clientEmail = process.env.CLIENT_EMAIL;
    const clientIv = process.env.CLIENT_IV;
    const clientKey = process.env.CLIENT_KEY;

    if (!authBaseUrl || !clientEmail || !clientIv || !clientKey) {
      return NextResponse.json(
        { error: "Missing client credentials configuration" },
        { status: 500 }
      );
    }

    const res = await fetch(`${authBaseUrl}/api/v1/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: clientEmail,
        iv: clientIv,
        key: clientKey,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Failed to fetch client token:", errorText);
      return NextResponse.json(
        { error: "Failed to obtain client token" },
        { status: res.status }
      );
    }

    const data = await res.json();
    
    return NextResponse.json({ accessToken: data.accessToken });
  } catch (error) {
    console.error("Error in client-token route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
