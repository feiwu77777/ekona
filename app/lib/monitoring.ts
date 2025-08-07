import { langSmithClient } from './langchainClient';

interface MonitoringMetrics {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  totalTokens: number;
  averageLatency: number;
  totalCost: number;
}

class LLMMonitoring {
  private metrics: MonitoringMetrics = {
    totalCalls: 0,
    successfulCalls: 0,
    failedCalls: 0,
    totalTokens: 0,
    averageLatency: 0,
    totalCost: 0
  };

  private callStartTimes = new Map<string, number>();

  startCall(callId: string) {
    this.callStartTimes.set(callId, Date.now());
    this.metrics.totalCalls++;
  }

  endCall(callId: string, success: boolean, tokenUsage?: any, cost?: number) {
    const startTime = this.callStartTimes.get(callId);
    if (startTime) {
      const latency = Date.now() - startTime;
      this.updateAverageLatency(latency);
      this.callStartTimes.delete(callId);
    }

    if (success) {
      this.metrics.successfulCalls++;
    } else {
      this.metrics.failedCalls++;
    }

    if (tokenUsage) {
      this.metrics.totalTokens += (tokenUsage.inputTokens || 0) + (tokenUsage.outputTokens || 0);
    }

    if (cost) {
      this.metrics.totalCost += cost;
    }
  }

  private updateAverageLatency(newLatency: number) {
    const currentTotal = this.metrics.averageLatency * (this.metrics.successfulCalls - 1);
    this.metrics.averageLatency = (currentTotal + newLatency) / this.metrics.successfulCalls;
  }

  getMetrics(): MonitoringMetrics {
    return { ...this.metrics };
  }

  resetMetrics() {
    this.metrics = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      totalTokens: 0,
      averageLatency: 0,
      totalCost: 0
    };
  }

  async logToLangSmith(data: any) {
    try {
      // Log to LangSmith for visualization
      await langSmithClient.createRun({
        name: "blog-generation",
        run_type: "chain",
        inputs: data.inputs,
        outputs: data.outputs
      });
    } catch (error) {
      console.error('Failed to log to LangSmith:', error);
    }
  }
}

export const llmMonitoring = new LLMMonitoring();

// Cost calculation utilities
export const calculateCost = (inputTokens: number, outputTokens: number): number => {
  // Gemini 2.5 Pro pricing (approximate)
  const inputCostPer1K = 0.0025; // $0.0025 per 1K input tokens
  const outputCostPer1K = 0.01; // $0.01 per 1K output tokens
  
  const inputCost = (inputTokens / 1000) * inputCostPer1K;
  const outputCost = (outputTokens / 1000) * outputCostPer1K;
  
  return inputCost + outputCost;
};

// Performance tracking with LangSmith tracing
export const trackPerformance = async (operation: string, fn: () => Promise<any>) => {
  const startTime = Date.now();
  const callId = `${operation}-${Date.now()}`;
  
  llmMonitoring.startCall(callId);
  
  try {
    const result = await fn();
    const latency = Date.now() - startTime;
    
    llmMonitoring.endCall(callId, true, {
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens
    }, result.cost);
    
    return result;
  } catch (error) {
    llmMonitoring.endCall(callId, false);
    throw error;
  }
};
