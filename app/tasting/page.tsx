"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

type HistoryItem = { role: "user" | "assistant"; content: string };

type TastedWine = {
  name: string;
  rating: "loved" | "liked" | "not_for_me";
  notes: string;
};

// Quick reply suggestions that appear contextually
const QUICK_REPLIES: Record<number, string[]> = {
  0: ["Easy drinking", "A bit sharp", "Something else"],
  1: ["Soft and round", "Crisp and fresh", "Somewhere in between"],
  2: ["Pretty smooth", "A bit of a zesty edge", "Quite sharp"],
  3: ["Citrus", "Stone fruit", "Creamy", "Something else"],
  4: ["Yes", "Maybe", "No"],
};

export default function TastingPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [tastedWines, setTastedWines] = useState<TastedWine[]>([]);
  const [summary, setSummary] = useState("");
  const [questionStep, setQuestionStep] = useState(-1); // tracks which Q we're on
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, loading]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setPrompt("");
    setLoading(true);
    setError("");

    const nextHistory: HistoryItem[] = [
      ...history,
      { role: "user", content: trimmed },
    ];

    try {
      const res = await fetch("/api/tasting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmed,
          history: nextHistory,
          sessionEnding: false,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");

      if (data.loggedWine) {
        setTastedWines((prev) => [...prev, data.loggedWine]);
        setQuestionStep(-1); // reset for next wine
      } else {
        // Advance question step if we're in the flow
        setQuestionStep((prev) => (prev < 4 ? prev + 1 : prev));
      }

      setHistory([
        ...nextHistory,
        { role: "assistant", content: data.recommendation },
      ]);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function startSession() {
    setSessionStarted(true);
    setQuestionStep(0);
    setLoading(true);

    try {
      const res = await fetch("/api/tasting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "I'm wine tasting. Let's start.",
          history: [],
          sessionEnding: false,
        }),
      });

      const data = await res.json();
      setHistory([
        { role: "user", content: "I'm wine tasting. Let's start." },
        { role: "assistant", content: data.recommendation },
      ]);
    } catch {
      setError("Something went wrong starting the session.");
    } finally {
      setLoading(false);
    }
  }

  async function endSession() {
    setSessionEnded(true);
    setLoading(true);

    const endPrompt = "I'm done tasting for today. Please give me my summary.";
    const nextHistory: HistoryItem[] = [
      ...history,
      { role: "user", content: endPrompt },
    ];

    try {
      const res = await fetch("/api/tasting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: endPrompt,
          history: nextHistory,
          sessionEnding: true,
        }),
      });

      const data = await res.json();
      setSummary(data.recommendation);
      setHistory([
        ...nextHistory,
        { role: "assistant", content: data.recommendation },
      ]);
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const quickReplies = QUICK_REPLIES[questionStep] || [];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@300;400;500&display=swap');

        :root {
          --cream: #faf7f2;
          --parchment: #f2ece0;
          --warm-stone: #e8dfd0;
          --dusty-rose: #c9a9a0;
          --wine: #8b3a52;
          --wine-light: #a85070;
          --sage: #8a9e8c;
          --ink: #2c2420;
          --ink-soft: #4a3d37;
          --ink-muted: #7a6a62;
          --ink-faint: #a89990;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background-color: var(--cream); }

        .page {
          font-family: 'Jost', sans-serif;
          font-weight: 300;
          min-height: 100vh;
          background-color: var(--cream);
          background-image:
            radial-gradient(ellipse at 10% 0%, rgba(201,169,160,0.15) 0%, transparent 60%),
            radial-gradient(ellipse at 90% 100%, rgba(139,58,82,0.08) 0%, transparent 50%);
          padding: 48px 20px 200px;
          color: var(--ink);
        }

        .container { max-width: 640px; margin: 0 auto; }

        /* Header */
        .header { margin-bottom: 40px; }
        .header-inner { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
        .eyebrow { font-family: 'Jost', sans-serif; font-weight: 400; font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase; color: var(--dusty-rose); margin-bottom: 14px; }
        .title { font-family: 'Cormorant Garamond', serif; font-weight: 300; font-size: clamp(36px, 7vw, 52px); line-height: 1; letter-spacing: -0.01em; margin-bottom: 10px; color: var(--ink); }
        .title em { font-style: italic; color: var(--wine); }
        .subtitle { font-size: 14px; font-weight: 300; color: var(--ink-muted); line-height: 1.6; }
        .btn-back { font-family: 'Jost', sans-serif; font-size: 12px; font-weight: 400; letter-spacing: 0.08em; color: var(--ink-muted); background: transparent; border: 1px solid var(--warm-stone); border-radius: 100px; padding: 9px 18px; cursor: pointer; transition: all 0.2s ease; white-space: nowrap; text-decoration: none; display: inline-block; margin-top: 4px; }
        .btn-back:hover { border-color: var(--dusty-rose); color: var(--wine); }

        /* Start screen */
        .start-card { background: #ffffff; border: 1px solid var(--warm-stone); border-radius: 24px; padding: 48px 32px; box-shadow: 0 1px 3px rgba(44,36,32,0.04), 0 8px 32px rgba(44,36,32,0.06); text-align: center; }
        .start-icon { font-size: 52px; margin-bottom: 24px; }
        .start-title { font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 400; color: var(--ink); margin-bottom: 14px; }
        .start-description { font-size: 15px; font-weight: 300; color: var(--ink-muted); line-height: 1.75; max-width: 380px; margin: 0 auto 36px; }

        /* Wines tasted */
        .wines-logged { margin-bottom: 24px; }
        .wines-logged-label { font-size: 10px; font-weight: 400; letter-spacing: 0.25em; text-transform: uppercase; color: var(--ink-faint); margin-bottom: 10px; }
        .wines-chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .wine-chip { font-family: 'Jost', sans-serif; font-size: 12px; font-weight: 400; border-radius: 100px; padding: 6px 14px; border: 1px solid var(--warm-stone); display: flex; align-items: center; gap: 6px; }
        .wine-chip.loved { background: rgba(138,158,140,0.12); border-color: var(--sage); }
        .wine-chip.liked { background: rgba(201,169,160,0.12); border-color: var(--dusty-rose); }
        .wine-chip.not_for_me { background: var(--parchment); border-color: var(--warm-stone); color: var(--ink-faint); }
        .chip-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .chip-dot.loved { background: var(--sage); }
        .chip-dot.liked { background: var(--dusty-rose); }
        .chip-dot.not_for_me { background: var(--ink-faint); }
        .divider { height: 1px; background: var(--warm-stone); margin: 20px 0; }

        /* Conversation */
        .conversation { display: flex; flex-direction: column; gap: 14px; }
        .bubble { max-width: 85%; border-radius: 20px; padding: 14px 18px; line-height: 1.65; }
        .bubble.assistant { background: #ffffff; border: 1px solid var(--warm-stone); color: var(--ink); align-self: flex-start; font-family: 'Cormorant Garamond', serif; font-size: 17px; font-weight: 400; box-shadow: 0 2px 12px rgba(44,36,32,0.05); border-bottom-left-radius: 6px; }
        .bubble.user { background: var(--wine); color: #fff; align-self: flex-end; font-family: 'Jost', sans-serif; font-size: 14px; font-weight: 300; border-bottom-right-radius: 6px; }

        /* Loading bubble */
        .loading-dots { display: flex; gap: 5px; padding: 4px 0; }
        .loading-dots span { width: 5px; height: 5px; border-radius: 50%; background: var(--dusty-rose); animation: pulse 1.4s ease-in-out infinite; }
        .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
        .loading-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.9); }
          40% { opacity: 1; transform: scale(1); }
        }

        /* Fixed input area */
        .input-area { position: fixed; bottom: 0; left: 0; right: 0; background: rgba(250,247,242,0.96); backdrop-filter: blur(8px); border-top: 1px solid var(--warm-stone); padding: 12px 20px 28px; }
        .input-inner { max-width: 640px; margin: 0 auto; }

        /* Quick replies */
        .quick-replies { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
        .btn-quick {
          font-family: 'Jost', sans-serif;
          font-size: 13px;
          font-weight: 400;
          color: var(--ink-soft);
          background: #ffffff;
          border: 1px solid var(--warm-stone);
          border-radius: 100px;
          padding: 8px 18px;
          cursor: pointer;
          transition: all 0.18s ease;
        }
        .btn-quick:hover { background: var(--parchment); border-color: var(--dusty-rose); color: var(--wine); }

        /* Text input row */
        .input-row { display: flex; gap: 10px; align-items: flex-end; }
        .textarea { font-family: 'Jost', sans-serif; font-size: 14px; font-weight: 300; flex: 1; min-height: 48px; max-height: 100px; background: #ffffff; border: 1px solid var(--warm-stone); border-radius: 16px; padding: 13px 18px; color: var(--ink); outline: none; resize: none; transition: border-color 0.2s ease, box-shadow 0.2s ease; line-height: 1.5; }
        .textarea::placeholder { color: var(--ink-faint); font-style: italic; font-family: 'Cormorant Garamond', serif; font-size: 15px; }
        .textarea:focus { border-color: var(--dusty-rose); box-shadow: 0 0 0 3px rgba(201,169,160,0.15); }

        .btn-send { font-family: 'Jost', sans-serif; font-size: 13px; font-weight: 400; background: var(--wine); color: #fff; border: none; border-radius: 100px; padding: 0 22px; cursor: pointer; transition: all 0.2s ease; flex-shrink: 0; height: 48px; }
        .btn-send:hover:not(:disabled) { background: var(--wine-light); }
        .btn-send:disabled { opacity: 0.4; cursor: not-allowed; }

        /* Buttons */
        .btn-primary { font-family: 'Jost', sans-serif; font-size: 13px; font-weight: 400; letter-spacing: 0.08em; background: var(--wine); color: #fff; border: none; border-radius: 100px; padding: 14px 36px; cursor: pointer; transition: all 0.2s ease; }
        .btn-primary:hover { background: var(--wine-light); transform: translateY(-1px); box-shadow: 0 4px 16px rgba(139,58,82,0.25); }
        .btn-end { font-family: 'Jost', sans-serif; font-size: 12px; font-weight: 400; letter-spacing: 0.08em; color: var(--ink-muted); background: transparent; border: 1px solid var(--warm-stone); border-radius: 100px; padding: 9px 20px; cursor: pointer; transition: all 0.2s ease; }
        .btn-end:hover:not(:disabled) { border-color: var(--dusty-rose); color: var(--wine); }
        .btn-end:disabled { opacity: 0.4; cursor: not-allowed; }

        /* Error */
        .error { font-size: 13px; color: #b05050; background: #fdf0f0; border: 1px solid #e8c8c8; border-radius: 10px; padding: 12px 16px; margin-top: 12px; }

        /* Summary */
        .summary-note { margin-top: 32px; text-align: center; font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 13px; color: var(--ink-faint); }

        /* Animation */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.3s ease forwards; }
      `}</style>

      <main className="page">
        <div className="container">

          {/* Header */}
          <header className="header">
            <div className="header-inner">
              <div>
                <p className="eyebrow">Wine Sommelier</p>
                <h1 className="title">Tasting <em>Mode</em></h1>
                <p className="subtitle">Talk through each wine as you go. Your sommelier guides you.</p>
              </div>
              <Link href="/" className="btn-back">← Back</Link>
            </div>
          </header>

          {/* Start screen */}
          {!sessionStarted && (
            <div className="start-card fade-up">
              <div className="start-icon">🍷</div>
              <h2 className="start-title">Ready to taste?</h2>
              <p className="start-description">
                Tell your sommelier what you're trying as you go. Short answers are fine — it'll ask the right questions and quietly build your taste profile along the way.
              </p>
              <button className="btn-primary" onClick={startSession} disabled={loading}>
                {loading ? "Starting…" : "I'm wine tasting"}
              </button>
            </div>
          )}

          {/* Active session */}
          {sessionStarted && (
            <>
              {/* Wines logged */}
              {tastedWines.length > 0 && (
                <div className="wines-logged fade-up">
                  <p className="wines-logged-label">Tasted today</p>
                  <div className="wines-chips">
                    {tastedWines.map((wine, i) => (
                      <div key={i} className={`wine-chip ${wine.rating}`}>
                        <span className={`chip-dot ${wine.rating}`} />
                        {wine.name}
                      </div>
                    ))}
                  </div>
                  <div className="divider" />
                </div>
              )}

              {/* Conversation */}
              <div className="conversation">
                {history.map((msg, i) => (
                  // Hide the very first user message (the session start trigger)
                  i === 0 ? null : (
                    <div key={i} className={`bubble ${msg.role} fade-up`}>
                      {msg.content}
                    </div>
                  )
                ))}

                {loading && (
                  <div className="bubble assistant fade-up">
                    <div className="loading-dots"><span /><span /><span /></div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {error && <p className="error">{error}</p>}

              {/* Wrap up button */}
              {!sessionEnded && tastedWines.length > 0 && !loading && (
                <div style={{ textAlign: "center", marginTop: 24 }}>
                  <button className="btn-end" onClick={endSession} disabled={loading}>
                    Wrap up this session
                  </button>
                </div>
              )}

              {sessionEnded && (
                <p className="summary-note">
                  This session will feed into your taste profile when accounts are added.
                </p>
              )}
            </>
          )}

        </div>
      </main>

      {/* Fixed input — shown during active, non-ended session */}
      {sessionStarted && !sessionEnded && (
        <div className="input-area">
          <div className="input-inner">

            {/* Quick reply buttons */}
            {quickReplies.length > 0 && !loading && (
              <div className="quick-replies">
                {quickReplies.map((reply) => (
                  <button
                    key={reply}
                    className="btn-quick"
                    onClick={() => sendMessage(reply)}
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}

            {/* Text input */}
            <div className="input-row">
              <textarea
                className="textarea"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(prompt);
                  }
                }}
                placeholder="Or type your own answer…"
                rows={1}
                disabled={loading}
              />
              <button
                className="btn-send"
                onClick={() => sendMessage(prompt)}
                disabled={loading || !prompt.trim()}
              >
                Send
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}