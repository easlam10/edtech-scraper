import dotenv from "dotenv";
import { fetchSearchResults } from "./services/search.js";
import { scrapeMultipleUrls } from "./services/scraper.js";
import { summarizeAllContent } from "./services/summarizer.js";
import { sendArticleSummaries } from "./services/messageService.js";

dotenv.config();

/**
 * Main function to execute the entire process
 */
async function main() {
  try {
    console.log("Starting EdTech news aggregation process");

    // Simple search query for EdTech articles
    const searchQuery = "education technology teaching learning tools";

    // Step 1: Fetch more search results (20) with 14-30 day range
    console.log("\nFetching search results...");
    const searchResults = await fetchSearchResults(searchQuery, 25, 21); // 3 weeks

    if (searchResults.length === 0) {
      throw new Error("No search results found");
    }
    console.log(`Found ${searchResults.length} potential articles`);

    // Step 2: Scrape content
    console.log("\nScraping article content...");
    const scrapedResults = await scrapeMultipleUrls(searchResults);

    if (scrapedResults.length === 0) {
      throw new Error("No content could be scraped");
    }
    console.log(`Successfully scraped ${scrapedResults.length} articles`);

    // Step 3: Generate high-quality summary
    console.log("\nGenerating summary with Gemini...");
    const summarizedArticles = await summarizeAllContent(scrapedResults);


    if (summarizedArticles.length === 0 || !summarizedArticles[0].summary) {
      throw new Error("No summary could be generated");
    }

    // Step 4: Send WhatsApp message
    console.log("\nSending WhatsApp message...");
    await sendArticleSummaries(summarizedArticles);

    console.log("\nProcess completed successfully!");
  } catch (error) {
    console.error("Process failed:", error.message);
    process.exit(1);
  }
}

// Run the process
main();
