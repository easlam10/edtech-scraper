import mongoose from "mongoose";
import Message from "../models/Message.js";
import dotenv from "dotenv";

dotenv.config();

/**
 * Connects to MongoDB if not already connected
 */
async function connectToDatabase() {
  if (mongoose.connection.readyState !== 1) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("Connected to MongoDB successfully");
    } catch (error) {
      console.error("MongoDB connection error:", error);
      throw error;
    }
  }
}

/**
 * Saves or updates an EdTech news summary message
 * @param {string} content - The formatted message content
 * @param {Object} metadata - Metadata about the message
 * @returns {Promise<Object>} - The saved message document
 */
async function saveEdTechNewsSummary(content, metadata) {
  try {
    await connectToDatabase();

    const messageType = "edtech_daily_summary";

    // Upsert the message (update if exists, create if not)
    const message = await Message.findOneAndUpdate(
      { messageType },
      {
        content,
        metadata,
        generatedAt: new Date(),
        status: "pending",
      },
      { new: true, upsert: true }
    );

    console.log(`Message saved with ID: ${message._id}`);
    return message;
  } catch (error) {
    console.error("Error saving message:", error);
    throw error;
  }
}

export { saveEdTechNewsSummary, connectToDatabase };
