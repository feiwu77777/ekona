import { Client } from "langsmith";
import { GoogleGenerativeAI } from '@google/generative-ai';
import { traceable } from "langsmith/traceable";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import { LLMResult } from "@langchain/core/outputs";

// Initialize LangSmith client with correct environment variables
const client = new Client({
  apiKey: process.env.LANGSMITH_API_KEY,
});

// Create a traceable Gemini wrapper (legacy - for backward compatibility)
const geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
export const traceableGemini = traceable(async (prompt: string) => {
  const model_name = 'gemini-2.0-flash-lite' // 'gemini-2.5-pro'
  const model = geminiClient.getGenerativeModel({ model: model_name });
  const result = await model.generateContent(prompt);
  return result.response.text();
});

// Custom callback handler for token tracking
class TokenTrackingCallback extends BaseCallbackHandler {
  name = "token_tracking";
  private tokenUsage: any = {};
  private modelName: string;
  private inputPrompt: string = "";

  constructor(modelName: string) {
    super();
    this.modelName = modelName;
  }

  async handleLLMStart(llm: any, prompts: string[], runId: string, parentRunId?: string, extraParams?: any) {
    this.inputPrompt = prompts[0] || "";
    console.log("Gemini call started:", { 
      model: this.modelName, 
      prompts: prompts.length,
      firstPrompt: prompts[0]?.substring(0, 100) + "...",
      runId
    });
  }

  async handleLLMEnd(output: LLMResult, runId: string, parentRunId?: string) {
    // Extract token usage from Gemini response
    const geminiResponse = output.llmOutput as any;
    if (geminiResponse?.tokenUsage) {
      this.tokenUsage = geminiResponse.tokenUsage;
    } else {
      // Fallback: estimate tokens from text length
      const outputText = output.generations[0]?.[0]?.text || "";
      this.tokenUsage = {
        inputTokens: estimateTokens(this.inputPrompt),
        outputTokens: estimateTokens(outputText)
      };
    }

    const cost = calculateGeminiCost(this.tokenUsage, this.modelName);
    
    console.log("Gemini call completed:", { 
      runId,
      tokenUsage: this.tokenUsage,
      estimatedCost: cost,
      outputLength: output.generations[0]?.[0]?.text?.length || 0
    });

    // Log to LangSmith with token usage
    try {
      await client.updateRun(runId, {
        extra: {
          tokenUsage: this.tokenUsage,
          estimatedCost: cost,
          modelName: this.modelName
        }
      });
    } catch (error) {
      console.error("Failed to update LangSmith run with token usage:", error);
    }
  }

  async handleLLMError(error: Error, runId: string, parentRunId?: string) {
    console.error("Gemini call failed:", { error, runId });
  }

  getTokenUsage() {
    return this.tokenUsage;
  }
}

// Enhanced LangChain integration with full monitoring
export const createLangChainGemini = (modelName: string = 'gemini-2.0-flash-lite') => {
  const tokenTracker = new TokenTrackingCallback(modelName);
  
  const llm = new ChatGoogleGenerativeAI({
    model: modelName,
    temperature: 0.7,
    maxOutputTokens: 4000,
    apiKey: process.env.GEMINI_API_KEY,
    callbacks: [tokenTracker]
  });

  // Add a method to get token usage
  (llm as any).getTokenUsage = () => tokenTracker.getTokenUsage();
  
  return llm;
};

// Simple token estimation for Gemini (since it doesn't provide exact token counts)
function estimateTokens(text: string): number {
  // Gemini uses a similar tokenization to GPT models
  // Rough estimate: 1 token ≈ 4 characters for English text
  // This is a simplified approach - for production, consider using a proper tokenizer
  return Math.ceil(text.length / 4);
}

// Cost calculation for Gemini models
function calculateGeminiCost(tokenUsage: any, modelName: string): number {
  if (!tokenUsage) return 0;
  
  const rates = {
    'gemini-2.0-flash-lite': { input: 0.000075, output: 0.0003 }, // per 1K tokens
    'gemini-2.0-flash': { input: 0.000075, output: 0.0003 },
    'gemini-2.0-pro': { input: 0.000375, output: 0.0015 },
    'gemini-1.5-pro': { input: 0.000375, output: 0.0015 },
    'gemini-1.5-flash': { input: 0.000075, output: 0.0003 }
  };
  
  const rate = rates[modelName as keyof typeof rates] || rates['gemini-2.0-flash-lite'];
  const inputCost = (tokenUsage.inputTokens || 0) * rate.input / 1000;
  const outputCost = (tokenUsage.outputTokens || 0) * rate.output / 1000;
  
  return inputCost + outputCost;
}

// Export the client for use in other modules
export { client as langSmithClient };
