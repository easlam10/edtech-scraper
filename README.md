# EdTech Scraper

This service scrapes educational technology news, summarizes it using AI, and stores the summaries in MongoDB for the messenger service to send via WhatsApp.

## Features

- Fetches recent EdTech news articles using Google Custom Search API
- Scrapes content from the articles using Puppeteer
- Summarizes the articles using Google's Gemini AI
- Saves the summarized content to MongoDB
- Tracks processed URLs to avoid duplicate scraping

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/edtech-scraper.git
cd edtech-scraper
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file based on `.env.example` and add your API keys:

```
# Google Custom Search API credentials
GOOGLE_API_KEY=your_google_api_key
SEARCH_ENGINE_ID=your_search_engine_id

# Google Gemini API credentials
GEMINI_API_KEY=your_gemini_api_key

# MongoDB connection string
MONGODB_URI=mongodb+srv://username:password@cluster0.example.mongodb.net/edtech_db
```

## Usage

Run the scraper with default parameters:

```bash
npm start
```

Run with custom parameters:

```bash
# Format: node src/index.js [searchQuery] [numResults] [daysAgo]
node src/index.js "AI in education" 10 2
```

## Database Schema

The service saves messages to MongoDB with the following schema:

```javascript
{
  messageType: "edtech_daily_summary", // Unique identifier for message type
  content: "Formatted message content...",
  generatedAt: Date,
  status: "pending", // pending, sent, failed
  metadata: {
    articleCount: Number,
    searchQuery: String,
    sources: [String]
  }
}
```

## Running on a Schedule

To run the scraper daily, you can set up a cron job:

```bash
# Run every day at 8 AM
0 8 * * * cd /path/to/edtech-scraper && npm start
```

## Dependencies

- puppeteer - Web scraping
- axios - HTTP requests
- cheerio - HTML parsing
- @google/generative-ai - Gemini AI for summarization
- mongoose - MongoDB interaction
