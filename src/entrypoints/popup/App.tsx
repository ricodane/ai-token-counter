import { useState, useEffect, useRef } from "react";

const API_URL = import.meta.env.WXT_API_URL
const EXTENSION_KEY = import.meta.env.WXT_EXTENSION_KEY

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
  // https://ai.google.dev/pricing - $2.00/M (≤200k tokens), $4.00/M (>200k tokens)
  { value: "gemini", label: "Gemini 3.1 Pro Preview", pricePerMillion: 2.00 },
  // https://api-docs.deepseek.com/quick_start/pricing
  { value: "deepseek", label: "DeepSeek V3.2", pricePerMillion: 0.28 },
  // https://help.aliyun.com/zh/model-studio/getting-started/models
  { value: "qwen", label: "Qwen 3.5", pricePerMillion: 0.40 },
  // https://ai.meta.com/blog/llama-4-multimodal-intelligence - $0.19–$0.49 blended, using lower bound
  { value: "llama", label: "Llama 4 Maverick", pricePerMillion: 0.19 },
];

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState(MODELS[0].value);
  const [tokenCount, setTokenCount] = useState<number | null>(null);
  const [charCount, setCharCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      const res = await fetch(`${API_URL}?${params}`, {
        headers: { "X-Extension-Key": EXTENSION_KEY },
      });
      if (!res.ok) throw new Error("Failed to count tokens");
      const data = await res.json();
      setTokenCount(data.token_count);
      setCharCount(data.character_count);
    } catch {
      setError("Sorry, we couldn't connect to server. Please try again in a moment.");
      setTokenCount(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (prompt.trim()) setIsLoading(true);
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
          <span className="logo-text">AI Token Counter & Cost Calculator</span>
        </div>
      </header>
      <div className="body">
        <div className="field">
          <label className="label">Model</label>
          <div className="dropdown" ref={dropdownRef}>
            <button
              className="dropdown-trigger"
              onClick={() => setIsDropdownOpen((o) => !o)}
              type="button"
            >
              <span>{selectedModel.label}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {isDropdownOpen && (
              <div className="dropdown-menu">
                {MODELS.map((m) => (
                  <button
                    key={m.value}
                    className={`dropdown-option${m.value === model ? " selected" : ""}`}
                    onClick={() => { setModel(m.value); setIsDropdownOpen(false); }}
                    type="button"
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="field">
          <label className="label">Prompt</label>
          <textarea
            className="textarea"
            placeholder="Paste your prompt here..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={8}
            maxLength={10000}
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
