'use client';

interface LLMProviderSelectorProps {
  llmProvider: 'gemini' | 'claude';
  setLlmProvider: (provider: 'gemini' | 'claude') => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  isDev: boolean;
}

export default function LLMProviderSelector({
  llmProvider,
  setLlmProvider,
  selectedModel,
  setSelectedModel,
  isDev
}: LLMProviderSelectorProps) {
  const providerInfo = {
    gemini: {
      name: 'Google Gemini',
      description: 'Fast and efficient, good for quick resume tailoring',
      icon: '🔮',
    },
    claude: {
      name: 'Anthropic Claude',
      description: 'More detailed analysis and thoughtful modifications',
      icon: '🧠',
    },
  };

  if (!isDev) return null;

  return (
    <div className="space-y-6">
      {/* LLM Provider Selection */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Choose AI Provider
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(providerInfo) as ('gemini' | 'claude')[]).map((provider) => (
            <button
              key={provider}
              type="button"
              onClick={() => setLlmProvider(provider)}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                llmProvider === provider
                  ? 'border-primary bg-primary/10 text-primary shadow-sm'
                  : 'border-border bg-card text-card-foreground hover:border-border/80'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">{providerInfo[provider].icon}</div>
                <div className="font-medium text-sm mb-1">
                  {providerInfo[provider].name}
                </div>
                <div className="text-xs opacity-75">
                  {providerInfo[provider].description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Model Selection */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Model Selection (Optional)
        </label>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="w-full p-3 border border-input rounded-md shadow-sm focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground"
        >
          <option value="">Use default model</option>
          {llmProvider === 'gemini' ? (
            <>
              <optgroup label="Current Generation (Recommended)">
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Balanced - $0.30/$2.50)</option>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash (Fast - $0.10/$0.40)</option>
                <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash-Lite (Cheapest - $0.075/$0.30)</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro (Premium - $1.25/$10.00)</option>
              </optgroup>
              <optgroup label="Legacy Models">
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Default - $0.075/$0.30)</option>
                <option value="gemini-1.5-flash-8b">Gemini 1.5 Flash-8B (Budget - $0.0375/$0.15)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Advanced - $1.25/$5.00)</option>
              </optgroup>
            </>
          ) : (
            <>
              <optgroup label="Claude 4 Series (Latest)">
                <option value="claude-sonnet-4-20250514">Claude Sonnet 4 (Default - $3.00/$15.00)</option>
                <option value="claude-opus-4-20250514">Claude Opus 4 (Premium - $15.00/$75.00)</option>
              </optgroup>
              <optgroup label="Claude 3.x Generation">
                <option value="claude-3-7-sonnet-20250219">Claude 3.7 Sonnet (Extended Thinking - $3.00/$15.00)</option>
                <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (Reliable - $3.00/$15.00)</option>
                <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (Fast - $0.80/$4.00)</option>
              </optgroup>
              <optgroup label="Premium Models">
                <option value="claude-3-opus-20240229">Claude 3 Opus (Premium - $15.00/$75.00)</option>
              </optgroup>
              <optgroup label="Budget Models">
                <option value="claude-3-haiku-20240307">Claude 3 Haiku (Budget - $0.25/$1.25)</option>
              </optgroup>
            </>
          )}
        </select>
        <p className="mt-1 text-xs text-muted-foreground">
          Prices shown as input/output per 1M tokens. Default models are recommended for most use cases.
        </p>
      </div>
    </div>
  );
} 