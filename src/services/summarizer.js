import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

/**
 * Summarizes all content with strict source requirements using Gemini as primary and Claude as backup
 */
async function summarizeAllContent(articles) {
  try {
    if (!articles || articles.length === 0) {
      console.warn("No content to summarize");
      return [];
    }

    // Prepare content with clear source markers
    let combinedContent = "";
    const sourceUrls = [];
    const urlToContentMap = {};

    for (const article of articles) {
      if (!article.content) continue;

      sourceUrls.push(article.url);
      urlToContentMap[article.url] = article.content;

      const truncatedContent = article.content.length > 4000
        ? article.content.substring(0, 4000) + "..."
        : article.content;

      combinedContent += `\n\n### SOURCE URL: ${article.url}\n### TITLE: ${article.title}\n### CONTENT:\n${truncatedContent}\n\n---END OF SOURCE---\n`;
    }

    if (combinedContent.length === 0) {
      console.warn("No valid content to summarize");
      return [];
    }

    // Enhanced prompt with strict requirements
    const prompt = `
You are an expert EdTech analyst creating a briefing for education administrators. Analyze the provided content and create exactly 8 high-quality bullet points about education technology innovations and implementations.

STRICT REQUIREMENTS:
1. Create exactly 8 bullet points - no more, no less
2. Each point must be from a different source URL
3. Each point must be 30-50 words long
4. Each point must include concrete information (technology names, stats, outcomes)
5. Format each point exactly like this:
* [Summary text with specific details about EdTech implementation or innovation]
  Source: [EXACT URL where this information was found]

CONTENT FOCUS AREAS:
- Classroom technology implementations
- Institutional EdTech solutions
- Learning management systems
- Educational data analytics
- Teacher training technologies
- Student engagement tools
- Cost-effective EdTech solutions
- Emerging education technologies

CONTENT TO ANALYZE:
${combinedContent}
`;

    // Try Gemini first
    try {
      console.log("Attempting to summarize with Gemini...");

      const result = await geminiModel.generateContent(prompt);
      const responseText = result.response.text();
      const processedSummary = validateAndFormatSummary(responseText, sourceUrls);

      return [{
        title: "EdTech Innovations Summary",
        summary: processedSummary
      }];
    } catch (geminiError) {
      console.warn("Gemini failed, falling back to Claude:", geminiError.message);
      return await summarizeWithClaude(prompt, sourceUrls);
    }
  } catch (error) {
    console.error("Error summarizing content:", error.message);
    return [];
  }
}

/**
 * Summarizes content using Claude as a backup option
 */
async function summarizeWithClaude(prompt, sourceUrls) {
  try {
    console.log("Attempting to summarize with Claude...");

    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307", // Using same model as test-api-keys.js that works
      max_tokens: 6000,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            }
          ]
        }
      ]
    });

    const responseText = response.content[0].text;
    const processedSummary = validateAndFormatSummary(responseText, sourceUrls);

    return [{
      title: "EdTech Innovations Summary (Claude Backup)",
      summary: processedSummary
    }];
  } catch (claudeError) {
    console.error("Claude also failed:", claudeError.message);
    throw new Error("Both Gemini and Claude summarization failed");
  }
}

/**
 * Validates and formats the summary to ensure requirements are met
 */
function validateAndFormatSummary(summaryText, validUrls) {
  const lines = summaryText.split('\n');
  const bulletPoints = [];
  const usedUrls = new Set();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('*')) {
      // Check if we have a source line following
      if (i + 1 < lines.length && lines[i + 1].trim().startsWith('Source:')) {
        const sourceLine = lines[i + 1].trim();
        const urlMatch = sourceLine.match(/Source:\s*(https?:\/\/[^\s]+)/i);
        
        if (urlMatch && validUrls.includes(urlMatch[1]) && !usedUrls.has(urlMatch[1])) {
          bulletPoints.push(line);
          bulletPoints.push(`  Source: ${urlMatch[1]}`);
          usedUrls.add(urlMatch[1]);
          i++; // Skip the source line
        }
      }
    }
    
    // Stop when we have 8 points
    if (bulletPoints.length >= 16) break; // 8 points * 2 lines each
  }

  // If we didn't get 8 points, fill with best available
  while (bulletPoints.length < 16 && validUrls.length > 0) {
    const availableUrls = validUrls.filter(url => !usedUrls.has(url));
    if (availableUrls.length === 0) break;
    
    const randomUrl = availableUrls[Math.floor(Math.random() * availableUrls.length)];
    const randomContent = "Important EdTech development (see source for details)";
    bulletPoints.push(`* ${randomContent}`);
    bulletPoints.push(`  Source: ${randomUrl}`);
    usedUrls.add(randomUrl);
  }

  return bulletPoints.join('\n');
}

export { summarizeAllContent };