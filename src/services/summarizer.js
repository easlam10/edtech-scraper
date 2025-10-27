import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

// Initialize API clients only when needed to ensure environment variables are loaded
function getGeminiModel() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not found in environment variables");
  }
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
}


/**
 * Summarizes content using Gemini with retry logic (only uses top 10 articles)
 */
async function summarizeAllContent(articles) {
  try {
    if (!articles || articles.length === 0) {
      console.warn("No content to summarize");
      return [];
    }

    // Use only the first 10 articles for summarization to manage input size
    const articlesToSummarize = articles.slice(0, 10);
    console.log(`Using ${articlesToSummarize.length} articles out of ${articles.length} available for summarization`);

    // Prepare content with clear source markers
    let combinedContent = "";
    const sourceUrls = [];
    const urlToContentMap = {};

    for (const article of articlesToSummarize) {
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

    // Try Gemini with retry logic (3 attempts with 3-minute intervals)
    const maxRetries = 3;
    const retryDelayMs = 3 * 60 * 1000; // 3 minutes

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempting to summarize with Gemini (attempt ${attempt}/${maxRetries})...`);
        const geminiModel = getGeminiModel();

        const result = await geminiModel.generateContent(prompt);
        const responseText = result.response.text();
        const processedSummary = validateAndFormatSummary(responseText, sourceUrls);

        return [{
          title: "EdTech Innovations Summary",
          summary: processedSummary
        }];
      } catch (geminiError) {
        console.error(`Gemini attempt ${attempt} failed:`, geminiError.message);

        if (attempt < maxRetries) {
          console.log(`Waiting 3 minutes before retry ${attempt + 1}...`);
          await new Promise(resolve => setTimeout(resolve, retryDelayMs));
        } else {
          console.error("All Gemini attempts failed. Unable to generate summary.");
          throw new Error(`Gemini summarization failed after ${maxRetries} attempts: ${geminiError.message}`);
        }
      }
    }
  } catch (error) {
    console.error("Error summarizing content:", error.message);
    return [];
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