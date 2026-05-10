import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { description } = await req.json();

  if (!description || typeof description !== "string" || description.trim().length < 10) {
    return NextResponse.json({ error: "Write at least a few words first." }, { status: 400 });
  }

  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "AI not configured." }, { status: 503 });
  }

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content:
            "You are a food writing expert helping restaurant-goers share their honest dish experiences. " +
            "Improve the given description to be more vivid, appetizing, and natural-sounding, while keeping " +
            "every specific observation the person made (taste, texture, spice, portion, price, etc.). " +
            "Do not add details that weren't in the original. Keep it under 200 words. " +
            "Return only the improved description — no preamble, no explanation.",
        },
        { role: "user", content: description.trim() },
      ],
      max_tokens: 300,
      temperature: 0.6,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("Groq error:", res.status, body);
    void notifyError(`Groq API error ${res.status}`, body);
    return NextResponse.json({ error: "AI request failed. Try again." }, { status: 502 });
  }

  const data = await res.json();
  const improved = data.choices?.[0]?.message?.content?.trim();

  if (!improved) {
    void notifyError("Empty Groq response", JSON.stringify(data));
    return NextResponse.json({ error: "Empty response from AI." }, { status: 502 });
  }

  return NextResponse.json({ improved });
}

async function notifyError(subject: string, detail: string) {
  const to = process.env.SUPPORT_EMAIL;
  if (!to) return;
  await sendEmail({
    to,
    subject: `[Dish Curator] AI error: ${subject}`,
    html: `<h3>${subject}</h3><pre style="font-size:12px">${detail.slice(0, 1000)}</pre>`,
  });
}
