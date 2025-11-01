import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

console.log("GEMINI_API_KEY loaded:", apiKey ? "✅ yes" : "❌ no");

// Ensure key exists before proceeding
if (!apiKey) {
  console.error("❌ No Gemini API key found. Please check your .env file.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function main() {
  const prompt = "Who invented AI?";
  const result = await model.generateContent(prompt);
  console.log("AI Response:", result.response.text());
}

main().catch(console.error);
