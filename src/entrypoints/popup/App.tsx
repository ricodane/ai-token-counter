import { useState, useEffect, useRef } from "react";

const API_URL = import.meta.env.WXT_API_URL

type Model = {
  value: string;
  label: string;
  pricePerMillion: number;
};

// Price per 1M input tokens in USD
// Source for each model listed below
const MODELS: Model[] = [
  // https://openai.com/api/pricing
  { value: "openai", label: "GPT-5.4", pricePerMillion: 2.50 },
  // https://www.anthropic.com/pricing#api
  { value: "claude", label: "Claude Sonnet 4.6", pricePerMillion: 3.0 },
  // https://ai.google.dev/pricing
  { value: "gemini", label: "Gemini 3.1 Pro Preview", pricePerMillion: 1.25 },
  // https://api-docs.deepseek.com/quick_start/pricing
  { value: "deepseek", label: "DeepSeek V3.2", pricePerMillion: 0.28 },
];

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState(MODELS[0].value);
  const [tokenCount, setTokenCount] = useState<number | null>(null);
  const [charCount, setCharCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedModel = MODELS.find((m) => m.value === model)!;

  const estimatedCost =
    tokenCount !== null
      ? ((tokenCount / 1_000_000) * selectedModel.pricePerMillion).toFixed(6)
      : null;

  const fetchTokens = async (text: string, modelValue: string) => {
    if (!text.trim()) {
      setTokenCount(null);
      setCharCount(0);
      setError(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ prompt: text, model: modelValue });
      const res = await fetch(`${API_URL}?${params}`);
      if (!res.ok) throw new Error("Failed to count tokens");
      const data = await res.json();
      setTokenCount(data.token_count);
      setCharCount(data.character_count);
    } catch {
      setError("Could not reach the tokenizer service.");
      setTokenCount(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchTokens(prompt, model);
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [prompt, model]);

  return (
    <div className="container">
      <header className="header">
        <div className="logo">
          <span className="logo-text">AI Tokenizer by SpacePrompts</span>
        </div>
      </header>

      <div className="body">
        <div className="field">
          <label className="label">Model</label>
          <select
            className="select"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            {MODELS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="label">Prompt</label>
          <textarea
            className="textarea"
            placeholder="Paste your prompt here..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={8}
          />
        </div>

        {error && <div className="error">{error}</div>}

        <div className="results">
          <div className="result-item">
            <span className="result-label">Tokens</span>
            <span className="result-value">
              {isLoading ? "—" : tokenCount !== null ? tokenCount.toLocaleString() : "—"}
            </span>
          </div>
          <div className="result-divider" />
          <div className="result-item">
            <span className="result-label">Characters</span>
            <span className="result-value">
              {isLoading ? "—" : charCount > 0 ? charCount.toLocaleString() : "—"}
            </span>
          </div>
          <div className="result-divider" />
          <div className="result-item">
            <span className="result-label">Est. Cost</span>
            <span className="result-value">
              {isLoading
                ? "—"
                : estimatedCost !== null
                  ? `$${estimatedCost}`
                  : "—"}
            </span>
          </div>
        </div>

        <div className="pricing-note">
          Input pricing · ${selectedModel.pricePerMillion.toFixed(2)} / 1M tokens
        </div>
      </div>
    </div>
  );
}
