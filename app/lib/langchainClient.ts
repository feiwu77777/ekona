import { Client } from "langsmith";
import { GoogleGenerativeAI } from '@google/generative-ai';
import { traceable } from "langsmith/traceable";

// Initialize LangSmith client with correct environment variables
const client = new Client({
  apiKey: process.env.LANGSMITH_API_KEY,
});

// Create a traceable Gemini wrapper
const geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
// Wrap Gemini calls with LangSmith tracing
export const traceableGemini = traceable(async (prompt: string) => {
  const model_name = 'gemini-2.0-flash-lite' // 'gemini-2.5-pro'
  const model = geminiClient.getGenerativeModel({ model: model_name });
  const result = await model.generateContent(prompt);
  return result.response.text();
});

// Export the client for use in other modules
export { client as langSmithClient };
