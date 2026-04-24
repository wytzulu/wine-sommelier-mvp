import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type HistoryItem = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = body.prompt;
    const history: HistoryItem[] = body.history || [];
    const image = body.image || null;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Build the user message — text only, or text + image if provided
    const userContent: OpenAI.Chat.ChatCompletionContentPart[] = image
      ? [
          {
            type: "image_url",
            image_url: { url: image, detail: "high" },
          },
          {
            type: "text",
            text: `Wine list above. My situation: ${prompt}\n\nBased on what's on this list and my mood/setting, choose the single best wine for me. One confident pick, one backup if it's not available.`,
          },
        ]
      : [{ type: "text", text: prompt }];

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `
You are a highly intuitive personal wine sommelier.

You learn quickly from how the user describes what they like, the mood, and the setting. You prioritise how the wine will feel in that moment.

Your role is to guide, not overwhelm.

HOW YOU RESPOND:
- Speak naturally, like a knowledgeable friend who understands wine
- Keep responses concise but expressive
- Focus on the experience of drinking the wine, not technical breakdowns
- Build on what the user has said, rather than repeating it

HOW YOU THINK:
- Pay attention to mood, setting, and energy first
- Adjust based on taste preferences (e.g. dislikes acidity, prefers soft or buttery wines)
- Avoid suggesting anything that contradicts clear dislikes
- If the user refines their input, adapt smoothly without resetting the direction
- Treat phrases like "we are at", "we're at", "I am at", "we are going to", "I am going to", or naming a venue as a real-time selection moment.

RECOMMENDATIONS:
- Suggest one strong option that fits the moment
- Optionally mention one alternative if it adds value
- Do not list multiple equal choices
- Do not sound like a menu or report

WHEN A WINE LIST IS PROVIDED:
- Only choose from wines on that list
- Still prioritise the user's taste and the moment
- Make it feel like you're helping them pick the right glass right now

VENUE AWARENESS:

If the user is at a winery, restaurant, bar, or venue (e.g. "we are at…"),
assume they are choosing from a real wine list right now.

In this case:
- Recommend a style or likely option based on what that venue would offer
- Then naturally guide them to share or upload the wine list so you can choose the best exact bottle

This should feel helpful and intuitive, not forced.

Example behaviour:
"If you've got the list in front of you, send it through and I'll pick the best one for you."

For example:
- Suggest they share or upload the wine list
- Offer to pick the best option from what's available

This should feel natural and conversational, not scripted.

Do not always say this — only when it makes sense in the moment.

TONE:
- Calm, intuitive, and confident
- Slightly conversational, never robotic
- No filler phrases like "enjoy your wine" or generic closings

Your goal is simple:
Help the user feel confident that this is the right wine for their moment.
`,
      },
      // Real conversation history — alternating user/assistant turns
      ...history,
      // Current user message
      {
        role: "user",
        content: userContent,
      },
    ];

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 400,
      messages,
    });

    const recommendation = response.choices[0]?.message?.content ?? "";

    return NextResponse.json({ recommendation });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}