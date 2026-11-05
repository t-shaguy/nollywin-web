import { NextRequest, NextResponse } from "next/server";
import { AIRTIME_API_URL, getAirtimePlan, isAirtimeAvailable } from "@/lib/airtime/config";
import { normalizeNigerianPhone, maskPhone, validateNigerianPhone } from "@/lib/airtime/phone-utils";

const isDev = process.env.NODE_ENV === "development";

interface SubscribeRequest {
  packageId: string;
  msisdn: string;
}

interface UpstreamResponse {
  tid?: number;
  msisdn?: string;
  amount?: string;
  plan?: string;
  planStr?: string;
  secureDurl?: string;
  suburl?: string;
  subUrl?: string;
  subTransId?: string;
  message?: string;
  error?: string;
}

/**
 * POST /api/airtime/subscribe
 * Server-side proxy for airtime subscription
 * Validates user, looks up package, calls hello-spin endpoint
 */
export async function POST(request: NextRequest) {
  if (isDev) {
    console.log("[Airtime Route] POST /api/airtime/subscribe called");
  }

  // ========== INPUT VALIDATION (Bad input → 400, not 500) ==========
  
  // 1. Check authentication
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 }
    );
  }

  // 2. Parse request body
  let body: SubscribeRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid request" },
      { status: 400 }
    );
  }

  const { packageId, msisdn } = body;

  // 3. Validate packageId (must be non-empty string, reject "NaN" etc.)
  if (!packageId || typeof packageId !== "string" || packageId.trim() === "" || packageId === "NaN") {
    if (isDev) {
      console.warn("[Airtime] Invalid packageId:", packageId);
    }
    return NextResponse.json(
      { message: "Invalid request" },
      { status: 400 }
    );
  }

  // 4. Validate msisdn (must be valid Nigerian number)
  if (!msisdn || typeof msisdn !== "string") {
    return NextResponse.json(
      { message: "Invalid request" },
      { status: 400 }
    );
  }

  const phoneValidationError = validateNigerianPhone(msisdn);
  if (phoneValidationError) {
    return NextResponse.json(
      { message: phoneValidationError },
      { status: 400 }
    );
  }

  // 5. Normalize phone number (validation passed, should not fail)
  const normalizedPhone = normalizeNigerianPhone(msisdn);
  if (!normalizedPhone) {
    return NextResponse.json(
      { message: "Enter a valid Nigerian phone number" },
      { status: 400 }
    );
  }

  // ========== PACKAGE LOOKUP (Not found → 404, not 500) ==========
  
  let selectedPackage: { id: string; name: string } | undefined;
  try {
    const packagesResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/subscriptions/packages`,
      {
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
      }
    );

    if (!packagesResponse.ok) {
      // Failed to fetch packages - this is a server error, not bad input
      console.error("[Airtime] Failed to fetch packages:", packagesResponse.status);
      return NextResponse.json(
        { message: "Airtime payment is temporarily unavailable" },
        { status: 502 }
      );
    }

    const packages = await packagesResponse.json();
    selectedPackage = packages.find((pkg: { id: string }) => pkg.id === packageId);

    if (!selectedPackage) {
      // Package ID not found - this is bad input (404)
      if (isDev) {
        console.warn("[Airtime] Package not found:", packageId);
      }
      return NextResponse.json(
        { message: "Plan not found" },
        { status: 404 }
      );
    }
  } catch (error) {
    // Network error or JSON parse error - server error
    console.error("[Airtime] Package lookup error:", error);
    return NextResponse.json(
      { message: "Airtime payment is temporarily unavailable" },
      { status: 502 }
    );
  }

  const packageName = selectedPackage.name;

  // 6. Get airtime plan config
  const plan = getAirtimePlan(packageName);
  if (!plan) {
    // No airtime plan for this package - bad input
    if (isDev) {
      console.warn("[Airtime] No airtime plan for package:", packageName);
    }
    return NextResponse.json(
      { message: "Airtime payment is not available for this plan" },
      { status: 400 }
    );
  }

  // 7. Check if plan is enabled (per-plan flag)
  if (!isAirtimeAvailable(packageName)) {
    return NextResponse.json(
      { message: "This payment method is not yet available for this plan" },
      { status: 400 }
    );
  }

  // ========== UPSTREAM CALL (Network/upstream errors → 502) ==========
  
  const upstreamBody = {
    msisdn: normalizedPhone,
    amount: plan.amount,
    planDesc: plan.planDesc,
    planId: plan.planId,
    network: "MTN",
    duration: plan.duration,
  };

  if (isDev) {
    console.log("[Airtime] Calling upstream:", {
      url: AIRTIME_API_URL,
      body: { ...upstreamBody, msisdn: maskPhone(normalizedPhone) },
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(AIRTIME_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(upstreamBody),
      signal: controller.signal,
    });
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (isDev) {
      console.error("[Airtime] Upstream network error:", error);
    }

    // Check for timeout
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { message: "Airtime payment is temporarily unavailable" },
        { status: 502 }
      );
    }

    // Check for certificate error
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (
      errorMessage.includes("certificate") ||
      errorMessage.includes("SSL") ||
      errorMessage.includes("TLS") ||
      errorMessage.includes("self-signed") ||
      errorMessage.includes("CERT")
    ) {
      console.error("[Airtime] Certificate error:", errorMessage);
      return NextResponse.json(
        { message: "Airtime payment is temporarily unavailable" },
        { status: 502 }
      );
    }

    // Other network errors
    return NextResponse.json(
      { message: "Airtime payment is temporarily unavailable" },
      { status: 502 }
    );
  }

  clearTimeout(timeoutId);

  // Parse upstream response
  let upstreamData: UpstreamResponse;
  try {
    upstreamData = await upstreamResponse.json();
  } catch {
    return NextResponse.json(
      { message: "Airtime payment is temporarily unavailable" },
      { status: 502 }
    );
  }

  if (isDev) {
    console.log("[Airtime] Upstream response:", {
      status: upstreamResponse.status,
      hasRedirectUrl: !!(upstreamData.secureDurl || upstreamData.subUrl || upstreamData.suburl),
    });
  }

  // Handle upstream errors
  if (!upstreamResponse.ok) {
    // Upstream returned error - server error
    if (isDev) {
      console.error("[Airtime] Upstream returned error:", upstreamResponse.status, upstreamData);
    }
    return NextResponse.json(
      { message: "Airtime payment is temporarily unavailable" },
      { status: 502 }
    );
  }

  // Extract redirect URL (priority: secureDurl > subUrl > suburl)
  // Use exact URL as returned (do not rewrite http to https)
  const redirectUrl = upstreamData.secureDurl || upstreamData.subUrl || upstreamData.suburl;

  if (!redirectUrl) {
    console.error("[Airtime] No redirect URL in response");
    return NextResponse.json(
      { message: "Airtime payment is temporarily unavailable" },
      { status: 502 }
    );
  }

  // Validate redirect URL (allow both http and https)
  try {
    const url = new URL(redirectUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      console.error("[Airtime] Invalid redirect URL protocol:", url.protocol);
      return NextResponse.json(
        { message: "Airtime payment is temporarily unavailable" },
        { status: 502 }
      );
    }
  } catch {
    console.error("[Airtime] Malformed redirect URL");
    return NextResponse.json(
      { message: "Airtime payment is temporarily unavailable" },
      { status: 502 }
    );
  }

  // Success
  return NextResponse.json({
    redirectUrl,
    transactionId: upstreamData.subTransId || "",
    tid: upstreamData.tid || 0,
  });
}
