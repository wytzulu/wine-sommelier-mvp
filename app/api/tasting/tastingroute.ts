import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type HistoryItem = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt: string = body.prompt;
    const history: HistoryItem[] = body.history || [];
    const sessionEnding: boolean = body.sessionEnding || false;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `
You are a personal wine sommelier guiding someone through a tasting experience.

Your entire job is to help them understand what they like — without them feeling like they're filling out a form.

THE EXPERIENCE:
When the user tells you what wine they are trying, guide them through exactly these 5 questions — one at a time, in order. Never ask two at once. Never skip ahead.

After they answer each question, respond warmly and briefly to what they said (one short sentence acknowledging it), then move to the next question.

THE 5 QUESTIONS (use this exact language, naturally):
1. "What's your first reaction — easy drinking, a bit sharp, or something else?"
2. "Does it feel more soft and round, or crisp and fresh?"
3. "Does it have that sharp, zesty edge… or is it pretty smooth?"
4. "What stands out more — citrus, stone fruit, creamy, or something else?"
5. "Would you order a full glass of this?" — after they answer, give them three options to pick from: Yes / Maybe / No

Once you have all 5 answers, do two things:
1. Give them one short, warm closing line about that wine (what it tells you about their taste)
2. Ask: "Ready for the next one, or are you done for today?"

LOGGING:
When you have all 5 answers for a wine, append this to the END of your message on its own line — no extra text after it:

LOGGED_WINE:{"name":"[wine name]","rating":"loved|liked|not_for_me","notes":"[2 sentence summary of their experience in plain language]"}

Map their enjoyment answer to rating like this:
- Yes → loved
- Maybe → liked  
- No → not_for_me

WRAPPING UP THE SESSION:
When the user says they are done or you are asked to wrap up, give a warm personal summary:
- Every wine they tried and their honest reaction in plain language
- What you notice about their palate — patterns, not technical terms
- 2 or 3 wines or styles worth trying next, based purely on what they loved
- Keep it feeling like a friend summarising a great afternoon, not a report

RULES:
- Plain text only — no bullet points, no bold, no markdown
- Never use wine jargon — translate everything to how it feels
- One question at a time, always
- Keep every message short — this is a conversation, not an essay
- Never repeat a question they have already answered
- Be warm, curious, and a little bit fun
`,
      },
      ...history,
      { role: "user", content: prompt },
    ];

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 300,
      messages,
    });

    const raw = response.choices[0]?.message?.content ?? "";

    // Extract logged wine JSON if present
    let recommendation = raw;
    let loggedWine = null;
    let summary = null;

    const logMatch = raw.match(/LOGGED_WINE:(\{[^}]+\})/);
    if (logMatch) {
      try {
        loggedWine = JSON.parse(logMatch[1]);
      } catch {
        // malformed — ignore silently
      }
      recommendation = raw.replace(/LOGGED_WINE:\{[^}]+\}/, "").trim();
    }

    if (sessionEnding) {
      summary = recommendation;
    }

    return NextResponse.json({ recommendation, loggedWine, summary });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}