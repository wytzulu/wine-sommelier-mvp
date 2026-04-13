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
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You are a highly intuitive personal wine assistant. You learn quickly from the user's preferences through conversation. Focus on how wines feel, not just technical descriptions. Adapt recommendations based on mood, setting, food, and past preferences. If the user mentions wines they liked or disliked, use that to guide future suggestions. Keep responses natural, confident, and concise. Avoid being overly technical. Help the user choose a wine they will enjoy right now. If the user provides a list of wines, recommend the best option from that list based on their preferences and context. Be decisive and explain why briefly.",
        },
        {
          role: "user",
          content: `
User context:
${history.join("\n")}

Current request:
${prompt}
`,
        },
      ],
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