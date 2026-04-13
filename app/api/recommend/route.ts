import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = body.prompt;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You are a modern personal wine sommelier. Recommend wines in a simple, confident, and relatable way. Focus on mood, setting, food, and taste preferences. Avoid overly technical language. Keep responses short and useful.",
        },
        {
          role: "user",
          content: `Recommend a wine for this situation: ${prompt}`,
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