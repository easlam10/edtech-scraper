import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Configuration object
const config = {
  // MongoDB
  mongodb: {
    uri: process.env.MONGODB_URI,
  },

  // Google Custom Search
  googleSearch: {
    apiKey: process.env.GOOGLE_API_KEY,
    searchEngineId: process.env.GOOGLE_CSE_ID,
  },

  // Google Gemini
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
  },

  // Default search parameters
  search: {
    defaultQuery: "IT news in education sector",
    defaultNumResults: 8,
    defaultDaysAgo: 1,
  },
};

// Validate required configuration
function validateConfig() {
  const requiredVars = [
    { key: "googleSearch.apiKey", name: "GOOGLE_API_KEY" },
    { key: "googleSearch.searchEngineId", name: "SEARCH_ENGINE_ID" },
    { key: "gemini.apiKey", name: "GEMINI_API_KEY" },
    { key: "mongodb.uri", name: "MONGODB_URI" },
  ];

  const missingVars = requiredVars.filter(({ key }) => {
    const parts = key.split(".");
    let value = config;

    for (const part of parts) {
      value = value[part];
      if (value === undefined || value === null || value === "") {
        return true;
      }
    }

    return false;
  });

  if (missingVars.length > 0) {
    const missing = missingVars.map((v) => v.name).join(", ");
    throw new Error(`Missing required environment variables: ${missing}`);
  }
}

export { config, validateConfig };
