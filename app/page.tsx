"use client";

import { useState } from "react";

export default function HomePage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState("");
  const [error, setError] = useState("");

  async function handleRecommend() {
    setLoading(true);
    setRecommendation("");
    setError("");

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setRecommendation(data.recommendation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-4xl font-semibold mb-3">Wine Sommelier</h1>
        <p className="text-neutral-300 mb-8">
          Tell me what you’re in the mood for and I’ll recommend the perfect wine.
        </p>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Example: Warm day, low acidity white, rooftop drinks"
            className="w-full min-h-32 rounded-xl bg-neutral-950 border border-neutral-700 p-4 outline-none"
          />

          <button
            onClick={handleRecommend}
            disabled={loading || !prompt.trim()}
            className="mt-4 rounded-xl bg-white text-black px-5 py-3 font-medium disabled:opacity-50"
          >
            {loading ? "Thinking..." : "Get recommendation"}
          </button>

          {error && <p className="mt-4 text-red-400">{error}</p>}
        </div>

        {recommendation && (
          <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
            <p className="text-sm text-neutral-400 mb-2">Recommendation</p>
            <p className="text-neutral-100 whitespace-pre-wrap">{recommendation}</p>
          </div>
        )}
      </div>
    </main>
  );
}