import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key === "your_anthropic_api_key_here") return null;
  return new Anthropic({ apiKey: key });
}

export async function POST(req: NextRequest) {
  try {
    const anthropic = getClient();
    if (!anthropic) {
      return NextResponse.json({ error: "API 키 미설정" }, { status: 503 });
    }

    const { school, specs } = await req.json();

    if (!school?.name || !specs) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const prompt = `You are an expert US university admissions counselor advising a Korean international student.

Student Profile:
- GPA: ${specs.gpa || "N/A"}
- SAT: ${specs.sat || "N/A"}
- TOEFL: ${specs.toefl || "N/A"}
- Major: ${specs.major || "Undecided"}
- EC Tier: ${specs.ecTier || "N/A"} (1=best, 4=basic)
- Admission Probability: ${school.prob}%
- Category: ${school.cat}

Target School: ${school.name}
- US News Rank: #${school.rank}
- SAT Range: ${school.satRange}
- GPA Median: ${school.gpa}
- Acceptance Rate: ${school.acceptRate}%

Write a concise 3-sentence admission story in Korean:
1. First sentence: How this student's profile matches (or doesn't match) this school's strengths
2. Second sentence: The biggest risk or weakness in this application
3. Third sentence: One specific, actionable recommendation to improve chances

Keep it warm but honest. Use 반말 (casual speech). Do NOT use bullet points or headers — write as flowing prose.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    return NextResponse.json({ story: textBlock?.text || "" });
  } catch (error) {
    console.error("Story API error:", error);
    return NextResponse.json({ error: "Failed to generate story" }, { status: 500 });
  }
}
