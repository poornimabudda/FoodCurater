import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, category, message } = body ?? {};

  if (!message || typeof message !== "string" || message.trim().length < 5) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  const to = process.env.SUPPORT_EMAIL;
  if (!to) {
    console.error("SUPPORT_EMAIL not configured");
    return NextResponse.json({ ok: true }); // Don't expose misconfiguration to client
  }

  const catLabel = category || "General";
  const fromLine = [name, email].filter(Boolean).join(" — ");

  await sendEmail({
    to,
    subject: `[Dish Curator Support] ${catLabel}${fromLine ? ` from ${fromLine}` : ""}`,
    html: `
      <h2>Support request — ${catLabel}</h2>
      ${name ? `<p><strong>Name:</strong> ${escHtml(name)}</p>` : ""}
      ${email ? `<p><strong>Email:</strong> ${escHtml(email)}</p>` : ""}
      <p><strong>Category:</strong> ${escHtml(catLabel)}</p>
      <hr />
      <p style="white-space:pre-wrap">${escHtml(message.trim())}</p>
    `,
    replyTo: email || undefined,
  });

  return NextResponse.json({ ok: true });
}

function escHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
