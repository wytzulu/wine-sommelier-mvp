import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = body.prompt;
    const history = body.history || [];

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const trimmedHistory = history.slice(-5);

    const systemPrompt = `
You are a highly intuitive personal wine sommelier.

Your job is to recommend wines based on:
- the user's taste preferences
- mood and setting
- environment and context

PRIORITIES:
- Focus on how the wine feels in the moment
- Be decisive and confident
- Keep it simple and clear

RESPONSE STYLE:
- Suggest ONE primary wine
- Optionally include ONE alternative if useful
- Keep response concise (2–4 short paragraphs max)
- Use natural language (no lists or rigid formatting)

BEHAVIOUR:
- Guide the user toward a decision
- Do not overwhelm with options
- Do not be vague or uncertain

TONE:
- calm
- confident
- premium but relaxed
- like a trusted friend

Your goal:
Help the user confidently choose the right wine for their moment.
`.trim();

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `
User history:
${trimmedHistory.join("\n")}

Current request:
${prompt}
`,
        },
      ],
      max_output_tokens: 300,
    });

    return NextResponse.json({
      recommendation: response.output_text,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}