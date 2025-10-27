import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";

dotenv.config();

async function testGeminiAPI() {
  console.log("\n=== Testing Gemini API ===");
  console.log("API Key present:", !!process.env.GEMINI_API_KEY);
  console.log("API Key length:", process.env.GEMINI_API_KEY?.length || 0);

  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY is missing from .env file");
    return false;
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    // Test with a similar prompt to what the app uses
    const testPrompt = `
Create a brief 2-bullet point summary about education technology:

Sample Content:
- School District A implemented a new AI-powered learning platform that increased student engagement by 45% and improved test scores by 12%.
- University B deployed a virtual reality lab for medical students, resulting in 30% better retention rates.
- Company C launched an adaptive math tutoring system that personalizes learning paths for K-12 students.

Requirements:
- Create exactly 2 bullet points
- Each point should be 30-50 words
- Include specific statistics and outcomes
- Format: * [summary text]
`;

    const result = await model.generateContent(testPrompt);
    const response = result.response.text();

    console.log("✅ Gemini API working with summarization prompt!");
    console.log("Response preview:", response.substring(0, 200) + (response.length > 200 ? "..." : ""));
    console.log("Full response:\n", response);
    return true;
  } catch (error) {
    console.error("❌ Gemini API failed:");
    console.error("Error:", error.message);
    return false;
  }
}

async function testClaudeAPI() {
  console.log("\n=== Testing Claude API ===");
  console.log("API Key present:", !!process.env.CLAUDE_API_KEY);
  console.log("API Key length:", process.env.CLAUDE_API_KEY?.length || 0);

  if (!process.env.CLAUDE_API_KEY) {
    console.error("❌ CLAUDE_API_KEY is missing from .env file");
    return false;
  }

  try {
    const anthropic = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY,
    });

    // Test with a similar prompt to what the app uses
    const testPrompt = `
Create a brief 2-bullet point summary about education technology:

Sample Content:
- School District A implemented a new AI-powered learning platform that increased student engagement by 45% and improved test scores by 12%.
- University B deployed a virtual reality lab for medical students, resulting in 30% better retention rates.
- Company C launched an adaptive math tutoring system that personalizes learning paths for K-12 students.

Requirements:
- Create exactly 2 bullet points
- Each point should be 30-50 words
- Include specific statistics and outcomes
- Format: * [summary text]
`;

    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307", // Use the same model as in the app
      max_tokens: 1000,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: testPrompt
            }
          ]
        }
      ]
    });

    console.log("✅ Claude API working with summarization prompt!");
    const responseText = response.content[0].text;
    console.log("Response preview:", responseText.substring(0, 200) + (responseText.length > 200 ? "..." : ""));
    console.log("Full response:\n", responseText);
    return true;
  } catch (error) {
    console.error("❌ Claude API failed:");
    console.error("Error:", error.message);
    return false;
  }
}

async function main() {
  console.log("🔑 Testing API Keys for EdTech Scraper");
  console.log("=====================================");

  const geminiWorks = await testGeminiAPI();
  const claudeWorks = await testClaudeAPI();

  console.log("\n=== Summary ===");
  console.log("Gemini:", geminiWorks ? "✅ Working" : "❌ Failed");
  console.log("Claude:", claudeWorks ? "✅ Working" : "❌ Failed");

  if (!geminiWorks && !claudeWorks) {
    console.error("\n❌ Both APIs failed. Please check your .env file and API keys.");
    process.exit(1);
  } else if (!geminiWorks && claudeWorks) {
    console.log("\n⚠️  Gemini failed but Claude works. The app will use Claude as fallback.");
  } else if (geminiWorks && !claudeWorks) {
    console.log("\n⚠️  Claude failed but Gemini works. The app will use Gemini primarily.");
  } else {
    console.log("\n✅ Both APIs are working correctly!");
  }
}

main().catch(console.error);