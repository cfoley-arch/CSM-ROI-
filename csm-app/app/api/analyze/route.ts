import { GoogleGenerativeAI } from "@google/generative-ai";

const client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

const SYSTEM_PROMPT = `You are a Customer Success Manager assistant. When given a Gong call transcript and/or recap, extract structured data and return ONLY valid JSON with no markdown, no code fences, no explanation.

Return exactly this structure:
{
  "catalyst": {
    "notes": "Concise CRM notes summarizing the call: key topics discussed, customer sentiment, outcomes, and next steps.",
    "healthScore": "Green" | "Amber" | "Red"
  },
  "jiraIssues": [
    { "type": "Bug" | "Story" | "Task", "title": "string", "description": "string" }
  ],
  "ahaIdeas": [
    { "category": "string", "title": "string", "description": "string" }
  ],
  "actionItems": {
    "day0": ["string"],
    "day1": ["string"],
    "day2to3": ["string"],
    "day5to7": ["string"]
  },
  "followUpEmail": {
    "subject": "string",
    "body": "string"
  }
}

Guidelines:
- healthScore: Green = healthy/positive, Amber = some concerns/risks, Red = at-risk/churning
- jiraIssues: Extract any bugs reported, features requested, or tasks mentioned
- ahaIdeas: Product feedback and feature ideas to log in Aha!
- actionItems: CSM tasks grouped by timeline (day0=immediate/same day, day1=next day, day2to3=2-3 days out, day5to7=end of week)
- followUpEmail: Professional follow-up email to send to the customer after the call
- If the input is not a call transcript, still return the JSON structure with empty arrays and reasonable defaults`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { transcript } = body as { transcript: string };

    if (!transcript || typeof transcript !== "string") {
      return Response.json(
        { error: "Missing or invalid transcript" },
        { status: 400 }
      );
    }

    const model = client.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    const result = await model.generateContent(
      `Please analyze this call transcript and extract the structured data:\n\n${transcript}`
    );
    const text = result.response.text();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        return Response.json(
          { error: "Failed to parse response as JSON" },
          { status: 500 }
        );
      }
    }

    return Response.json(parsed);
  } catch (error) {
    console.error("Error analyzing transcript:", error);
    return Response.json(
      { error: "Failed to analyze transcript" },
      { status: 500 }
    );
  }
}
