import { NextRequest, NextResponse } from "next/server";

const POSTMARK_SERVICE_URL = process.env.POSTMARK_SERVICE_URL || "https://postmark.mcpfactory.org";
const POSTMARK_SERVICE_API_KEY = process.env.POSTMARK_SERVICE_API_KEY;

const FROM_EMAIL = "MCP Factory <hello@mcpfactory.org>";
const BCC_EMAIL = "kevin@mcpfactory.org";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    if (!POSTMARK_SERVICE_API_KEY) {
      console.error("POSTMARK_SERVICE_API_KEY is not configured");
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }

    // Call postmark-service
    const response = await fetch(`${POSTMARK_SERVICE_URL}/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Service-Secret": POSTMARK_SERVICE_API_KEY,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: email,
        bcc: BCC_EMAIL,
        subject: "Welcome to the MCP Factory Waitlist!",
        tag: "waitlist",
        trackOpens: false,
        trackLinks: "None",
        htmlBody: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <img src="https://mcpfactory.org/logo-title.jpg" alt="MCP Factory" style="width: 180px; margin-bottom: 30px;" />
            
            <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px;">You're on the list!</h1>
            
            <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Thanks for joining the MCP Factory waitlist. We'll notify you as soon as we're ready to launch.
            </p>
            
            <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              In the meantime, you can:
            </p>
            
            <ul style="color: #4a4a4a; font-size: 16px; line-height: 1.8; margin-bottom: 30px;">
              <li><a href="https://docs.mcpfactory.org" style="color: #6366f1;">Read the documentation</a></li>
              <li><a href="https://github.com/shamanic-technologies/mcpfactory" style="color: #6366f1;">Star us on GitHub</a></li>
            </ul>
            
            <p style="color: #888; font-size: 14px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
              MCP Factory - The DFY, BYOK MCP Platform
            </p>
          </div>
        `,
        textBody: `You're on the list!

Thanks for joining the MCP Factory waitlist. We'll notify you as soon as we're ready to launch.

In the meantime, you can:
- Read the documentation: https://docs.mcpfactory.org
- Star us on GitHub: https://github.com/shamanic-technologies/mcpfactory

MCP Factory - The DFY, BYOK MCP Platform`,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      console.error("Postmark service error:", error);
      return NextResponse.json(
        { error: "Failed to send confirmation email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Waitlist signup error:", error);
    return NextResponse.json(
      { error: "Failed to process signup" },
      { status: 500 }
    );
  }
}
