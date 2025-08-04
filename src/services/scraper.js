import axios from "axios";
import dotenv from "dotenv";
import puppeteer from "puppeteer";
import { load } from "cheerio";

dotenv.config();

/**
 * Enhanced scraping with better logging and timeout handling
 */
async function scrapeContent(url) {
  let browser = null;
  console.log(`Starting scrape: ${url}`);

  try {
    browser = await puppeteer.launch({
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
      headless: "new",
      timeout: 60000,
    });

    const page = await browser.newPage();

    // Configure page
    await page.setDefaultNavigationTimeout(30000);
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );

    // Block unnecessary resources
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      if (
        ["image", "stylesheet", "font", "media"].includes(req.resourceType())
      ) {
        req.abort();
      } else {
        req.continue();
      }
    });

    console.log(`Navigating to: ${url}`);
    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    if (!response.ok()) {
      throw new Error(`HTTP ${response.status()} for ${url}`);
    }

    console.log(`Extracting content from: ${url}`);
    const content = await page.content();
    const $ = load(content);

    // Clean content
    $("script, style, iframe, noscript").remove();
    const text = $("body").text().replace(/\s+/g, " ").trim();

    console.log(`Successfully scraped ${text.length} chars from ${url}`);
    return text;
  } catch (error) {
    console.error(`Scrape failed for ${url}:`, error.message);
    return "";
  } finally {
    if (browser) {
      try {
        console.log(`Closing browser for ${url}`);
        await browser.close();
      } catch (err) {
        console.error("Error closing browser:", err.message);
      }
    }
  }
}

/**
 * Scrape multiple URLs with concurrency control
 */
async function scrapeMultipleUrls(searchResults) {
  console.log(`Starting to scrape ${searchResults.length} URLs`);

  const scrapedResults = [];
  const CONCURRENCY = 3; // Process 3 URLs at a time
  const BATCH_DELAY = 2000; // 2 second delay between batches

  for (let i = 0; i < searchResults.length; i += CONCURRENCY) {
    const batch = searchResults.slice(i, i + CONCURRENCY);
    console.log(
      `Processing batch ${i / CONCURRENCY + 1}: ${batch.map((r) => r.url)}`
    );

    const batchPromises = batch.map((result) =>
      scrapeContent(result.url).then((content) => ({
        ...result,
        content,
      }))
    );

    const batchResults = await Promise.all(batchPromises);
    scrapedResults.push(...batchResults.filter((r) => r.content));

    if (i + CONCURRENCY < searchResults.length) {
      console.log(`Waiting ${BATCH_DELAY}ms before next batch...`);
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY));
    }
  }

  console.log(`Finished scraping. Got ${scrapedResults.length} valid results`);
  return scrapedResults;
}

export { scrapeMultipleUrls };
