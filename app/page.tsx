"use client";

import { useState } from "react";

export default function HomePage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState("");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState<"" | "loved" | "not_for_me">("");
  const [history, setHistory] = useState<string[]>([]);

  async function handleRecommend() {
    setLoading(true);
    setRecommendation("");
    setError("");
    setFeedback("");

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt, history }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setRecommendation(data.recommendation);
      setHistory((prev) => [...prev, prompt]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  const suggestions = [
    "Warm sunny afternoon",
    "Steak dinner",
    "Smooth and safe",
    "Rooftop drinks",
    "Like Pinot Noir",
  ];

  return (
    <main className="min-h-screen bg-black text-white px-5 py-10 md:px-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
                  <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-3">
            Personal Wine Sommelier
          </h1>

          <p className="text-neutral-300 text-lg leading-relaxed">
            What are you in the mood for? I’ll help you choose a wine
            that fits the moment.
          </p>
        </div>

        <div className="rounded-[28px] border border-neutral-800 bg-neutral-950 p-5 md:p-6 shadow-2xl">
          <div className="mb-4">
            <p className="text-sm text-neutral-400 mb-3">Try a prompt</p>

            <div className="flex flex-wrap gap-2">
              {suggestions.map((idea) => (
                <button
                  key={idea}
                  type="button"
                  onClick={() => setPrompt(idea)}
                  className="rounded-full border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-800 hover:border-neutral-500 transition"
                >
                  {idea}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Example: Warm day, low acidity white, rooftop drinks"
            className="w-full min-h-36 rounded-[22px] bg-black border border-neutral-800 p-5 text-white outline-none resize-none placeholder:text-neutral-500"
          />

          <div className="mt-5">
            <button
              onClick={handleRecommend}
              disabled={loading || !prompt.trim()}
              className="rounded-full bg-white text-black px-6 py-3 font-medium disabled:opacity-50 hover:opacity-90 transition"
            >
              {loading ? "Thinking..." : "Ask"}
            </button>
          </div>

          {error && <p className="mt-4 text-red-400">{error}</p>}
        </div>

        {recommendation && (
          <div className="mt-6 rounded-[28px] border border-neutral-800 bg-neutral-950 p-5 md:p-6 shadow-2xl">
            <p className="text-sm uppercase tracking-[0.2em] text-neutral-500 mb-3">
              Recommendation
            </p>

            <p className="text-neutral-100 whitespace-pre-wrap leading-8">
              {recommendation}
            </p>

            <div className="mt-6">
              <p className="text-sm text-neutral-400 mb-3">
                Was this a good recommendation?
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setFeedback("loved")}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    feedback === "loved"
                      ? "bg-white text-black"
                      : "border border-neutral-700 bg-neutral-900 text-white hover:bg-neutral-800"
                  }`}
                >
                  Loved it
                </button>

                <button
                  type="button"
                  onClick={() => setFeedback("not_for_me")}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    feedback === "not_for_me"
                      ? "bg-white text-black"
                      : "border border-neutral-700 bg-neutral-900 text-white hover:bg-neutral-800"
                  }`}
                >
                  Not for me
                </button>
              </div>

              {feedback === "loved" && (
                <p className="mt-3 text-sm text-neutral-400">
                  Great. We’ll use this to improve your taste profile.
                </p>
              )}

              {feedback === "not_for_me" && (
                <p className="mt-3 text-sm text-neutral-400">
                  Noted. This helps refine future recommendations.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}