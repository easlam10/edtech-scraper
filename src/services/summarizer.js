import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Using a valid model name
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

/**
 * Summarizes all content in a single request
 * @param {Array<Object>} articles - Array of objects with content
 * @returns {Promise<Array<Object>>} - Array of objects with summaries
 */
async function summarizeAllContent(articles) {
  try {
    if (!articles || articles.length === 0) {
      console.warn("No content to summarize");
      return [];
    }

    // Prepare the combined content, separating each URL's content
    let combinedContent = "";
    const sourceUrls = [];
    const urlToTitleMap = {}; // Map to keep track of URL to title

    for (const article of articles) {
      // Skip if no content
      if (!article.content) {
        continue;
      }

      // Store the source URL
      sourceUrls.push(article.url);

      // Store the title for this URL
      urlToTitleMap[article.url] = article.title;

      // Truncate content if it's too long
      const truncatedContent =
        article.content.length > 4000
          ? article.content.substring(0, 4000) + "..."
          : article.content;

      // Add clear separation between URL contents for the AI to distinguish them
      combinedContent += `\n\n### SOURCE: ${article.url}\n### TITLE: ${article.title}\n### CONTENT:\n${truncatedContent}\n\n--------------------\n`;
    }

    if (combinedContent.length === 0) {
      console.warn("No valid content to summarize");
      return [];
    }

    // Truncate overall content if it's too long (Gemini has token limits)
    const finalContent =
      combinedContent.length > 50000
        ? combinedContent.substring(0, 50000) + "..."
        : combinedContent;

    // Create the prompt for summarization with specific EdTech focus but simple language
    const prompt = `
You are an EdTech newsletter writer for elementary school teachers and parents with basic English skills. Your goal is to create a simple, easy-to-understand summary of classroom technology tools and methods.

Analyze the provided content and create a summary focused ONLY on CLASSROOM TECHNOLOGY:
1. Simple tools teachers use in classrooms (apps, websites, devices)
2. Basic ways technology helps students learn better
3. Easy-to-use technology for homework and learning at home
4. Simple examples of how teachers use computers, tablets, and internet in lessons
5. Technology that helps students practice reading, writing, and math
6. Fun technology activities for classroom learning
7. Simple ways parents can use technology to help children learn
8. Basic tools that make teaching easier for teachers

USE VERY SIMPLE ENGLISH (3rd grade level) - imagine explaining to someone who is just learning English.

For each bullet point:
1. Focus ONLY on classroom technology and simple learning tools
2. Mention specific tool names that teachers and parents can easily find and use
3. Explain HOW the tool helps students learn in simple terms
4. Include only information that elementary teachers and parents would find useful
5. AVOID complex academic research, advanced technology, or non-education topics
6. NEVER include anything about medical research, military, aerospace, or advanced science

EXTREMELY IMPORTANT REQUIREMENTS:
- Create 8 bullet points total about CLASSROOM TECHNOLOGY ONLY
- Each bullet point must be about a SPECIFIC tool or app teachers can use
- Use VERY SIMPLE English (3rd grade level)
- Keep each bullet point under 30 words
- Use short, simple sentences
- AVOID big words or technical terms
- Start each bullet point with * followed by a space
- Add a blank line between each bullet point
- INCLUDE THE SOURCE URL directly after each bullet point on a new line, indented with two spaces
- REJECT any content not directly related to classroom teaching tools

Examples of GOOD bullet points:
* Kahoot! lets teachers make fun quiz games. Students answer questions on tablets or phones. Kids learn while having fun.
  Source: https://example.com/article-url

* ClassDojo app helps teachers share student behavior updates with parents. Parents can see how their child is doing in school every day.
  Source: https://example.com/article-url

* Google Classroom helps teachers give homework online. Students can turn in work without paper. Teachers can grade it quickly.
  Source: https://example.com/article-url

Examples of BAD bullet points (reject these):
* CRISPR gene-editing therapy shows promising results in trials.
* Military drone technology advances with new software.
* Satellite technology improves Earth observation capabilities.
* University research programs receive new funding.

Content to analyze:
${finalContent}
`;

    // Generate content using Gemini
    const result = await model.generateContent(prompt);
    const bulletPoints = result.response.text().trim();

    console.log("Successfully summarized all content");

    // Create a single processed article with the consolidated summary
    const processedArticle = {
      title: "EdTech Summary with Sources",
      url: null, // No single URL
      summary: bulletPoints, // The complete summary with embedded source URLs
    };

    return [processedArticle]; // Return as an array with a single item for compatibility
  } catch (error) {
    console.error("Error summarizing content:", error.message);
    return [];
  }
}

/**
 * Process and filter content before summarization
 * @param {Array<Object>} articles - Array of objects with content
 * @returns {Promise<Array<Object>>} - Array of objects with summaries
 */
async function processArticles(articles) {
  try {
    if (!articles || articles.length === 0) {
      console.warn("No content to process");
      return [];
    }

    // Only filter out completely empty content
    const validContent = articles.filter(
      (article) => article.content && article.content.trim() !== ""
    );

    if (validContent.length === 0) {
      console.warn("No content to summarize");
      return [];
    }

    console.log(`Processing ${validContent.length} items for summarization`);

    // Get a single summary for all content
    const processedContent = await summarizeAllContent(validContent);
    return processedContent;
  } catch (error) {
    console.error("Error processing content:", error.message);
    return [];
  }
}

export { summarizeAllContent, processArticles };
