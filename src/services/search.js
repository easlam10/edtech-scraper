import axios from "axios";
import { config, validateConfig } from "../util/config.js";

/**
 * Enhanced EdTech article search
 */
async function fetchSearchResults(query, numResults = 25, daysAgo = 14) {
  try {
    console.log(`Searching for: "${query}"`);

    // Validate configuration
    try {
      validateConfig();
    } catch (error) {
      console.error("Configuration error:", error.message);
      return [];
    }

    console.log("API Key exists:", !!config.googleSearch.apiKey);
    console.log("CSE ID exists:", !!config.googleSearch.searchEngineId);

    const allResults = [];
    const maxResults = Math.min(numResults, 100); // Google CSE max is 100 total
    const resultsPerRequest = 10; // Google CSE limit per request
    const numRequests = Math.ceil(maxResults / resultsPerRequest);

    for (let i = 0; i < numRequests; i++) {
      const startIndex = i * resultsPerRequest + 1;

      console.log(
        `Making request ${i + 1}/${numRequests} (start: ${startIndex})`
      );

      const response = await axios.get(
        "https://www.googleapis.com/customsearch/v1",
        {
          params: {
            key: config.googleSearch.apiKey,
            cx: config.googleSearch.searchEngineId,
            q: query,
            start: startIndex,
          },
          timeout: 10000,
        }
      );

      if (response.data.items) {
        const results = response.data.items.map((item) => ({
          title: item.title,
          url: item.link,
          snippet: item.snippet,
          date:
            item.pagemap?.metatags?.[0]?.["article:published_time"] || "Recent",
        }));

        allResults.push(...results);

        // If we got fewer than 10 results, we've reached the end
        if (results.length < 10) {
          break;
        }
      } else {
        break; // No more results
      }

      // Small delay between requests to be respectful
      if (i < numRequests - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log(`Total results found: ${allResults.length}`);
    return allResults.slice(0, maxResults);
  } catch (error) {
    console.error("Search error:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error(
        "Response data:",
        JSON.stringify(error.response.data, null, 2)
      );
    }
    return [];
  }
}

export { fetchSearchResults };
