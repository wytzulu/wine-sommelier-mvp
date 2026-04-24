"use client";

import { useState } from "react";

type FeedbackState = "" | "loved" | "not_for_me";

type FollowUpOption = {
  label: string;
  buildPrompt: (lastPrompt: string, lastRecommendation: string) => string;
};

export default function HomePage() {
  // Wine chat state
  const [prompt, setPrompt] = useState("");
  const [activeMoment, setActiveMoment] = useState("");
  const [momentHistory, setMomentHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState("");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState>("");
  const [history, setHistory] = useState<string[]>([]);

  // Wine list photo state
  const [menuImage, setMenuImage] = useState<string | null>(null);

  const suggestions = [
    "Warm sunny afternoon",
    "Steak dinner",
    "Smooth and safe",
    "Rooftop drinks",
    "Like Pinot Noir",
  ];

  const followUpOptions: FollowUpOption[] = [
    {
      label: "Something lighter",
      buildPrompt: (lastPrompt, lastRecommendation) =>
        `Based on my wine moment "${lastPrompt}" and your current recommendation "${lastRecommendation}", give me a lighter and fresher option for the same situation.`,
    },
    {
      label: "Something richer",
      buildPrompt: (lastPrompt, lastRecommendation) =>
        `Based on my wine moment "${lastPrompt}" and your current recommendation "${lastRecommendation}", give me a richer and more full-bodied option for the same situation.`,
    },
    {
      label: "Better with food",
      buildPrompt: (lastPrompt, lastRecommendation) =>
        `Based on my wine moment "${lastPrompt}" and your current recommendation "${lastRecommendation}", refine this into a better food-pairing option.`,
    },
    {
      label: "Safer option",
      buildPrompt: (lastPrompt, lastRecommendation) =>
        `Based on my wine moment "${lastPrompt}" and your current recommendation "${lastRecommendation}", give me a safer and more crowd-pleasing option.`,
    },
    {
      label: "More adventurous",
      buildPrompt: (lastPrompt, lastRecommendation) =>
        `Based on my wine moment "${lastPrompt}" and your current recommendation "${lastRecommendation}", give me a slightly more adventurous option that still suits me.`,
    },
  ];

  // ── Wine chat ──
  async function sendPrompt(
    nextPrompt: string,
    options?: { visibleMoment?: string; addToMomentHistory?: boolean }
  ) {
    if (!nextPrompt.trim()) return;
    setLoading(true);
    setError("");
    setFeedback("");
    if (options?.visibleMoment) setActiveMoment(options.visibleMoment);
    if (options?.addToMomentHistory) setMomentHistory((prev) => [...prev, nextPrompt]);
    try {
      const nextHistory = [...history, nextPrompt];
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: nextPrompt,
          history: nextHistory,
          image: menuImage || null, // wine list photo passed alongside the mood/context
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setRecommendation(data.recommendation);
      setHistory(nextHistory);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function handleAsk() {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    if (!activeMoment) {
      await sendPrompt(trimmed, { visibleMoment: trimmed, addToMomentHistory: true });
    } else {
      await sendPrompt(trimmed, { addToMomentHistory: true });
    }
    setPrompt("");
  }

  async function handleFollowUp(option: FollowUpOption) {
    if (!activeMoment || !recommendation) return;
    await sendPrompt(option.buildPrompt(activeMoment, recommendation), { addToMomentHistory: false });
  }

  // ── Wine list photo ──
  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setMenuImage(reader.result as string);
    reader.readAsDataURL(file);
  }

  // ── Reset ──
  function handleNewSession() {
    setPrompt("");
    setActiveMoment("");
    setMomentHistory([]);
    setLoading(false);
    setRecommendation("");
    setError("");
    setFeedback("");
    setHistory([]);
    setMenuImage(null);
  }

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
          padding: 48px 20px 80px;
          color: var(--ink);
        }

        .container { max-width: 640px; margin: 0 auto; }

        /* ── Header ── */
        .header { margin-bottom: 48px; }
        .header-inner { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
        .eyebrow {
          font-family: 'Jost', sans-serif;
          font-weight: 400;
          font-size: 10px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: var(--dusty-rose);
          margin-bottom: 14px;
        }
        .title {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 300;
          font-size: clamp(44px, 8vw, 64px);
          line-height: 1;
          letter-spacing: -0.01em;
          margin-bottom: 12px;
          color: var(--ink);
        }
        .title em { font-style: italic; color: var(--wine); }
        .subtitle { font-size: 15px; font-weight: 300; color: var(--ink-muted); line-height: 1.6; }

        /* ── Buttons ── */
        .btn-new-session {
          font-family: 'Jost', sans-serif;
          font-size: 12px;
          font-weight: 400;
          letter-spacing: 0.08em;
          color: var(--ink-muted);
          background: transparent;
          border: 1px solid var(--warm-stone);
          border-radius: 100px;
          padding: 9px 18px;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
          margin-top: 4px;
          flex-shrink: 0;
        }
        .btn-new-session:hover { border-color: var(--dusty-rose); color: var(--wine); background: rgba(201,169,160,0.08); }

        .btn-ask {
          font-family: 'Jost', sans-serif;
          font-size: 13px;
          font-weight: 400;
          letter-spacing: 0.08em;
          background: var(--wine);
          color: #fff;
          border: none;
          border-radius: 100px;
          padding: 12px 28px;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        .btn-ask:hover:not(:disabled) { background: var(--wine-light); transform: translateY(-1px); box-shadow: 0 4px 16px rgba(139,58,82,0.25); }
        .btn-ask:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

        .btn-suggestion {
          font-family: 'Jost', sans-serif;
          font-size: 13px;
          font-weight: 300;
          color: var(--ink-soft);
          background: var(--cream);
          border: 1px solid var(--warm-stone);
          border-radius: 100px;
          padding: 7px 16px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-suggestion:hover { background: var(--parchment); border-color: var(--dusty-rose); color: var(--wine); }

        .btn-refine {
          font-family: 'Jost', sans-serif;
          font-size: 12px;
          font-weight: 400;
          color: var(--ink-soft);
          background: var(--cream);
          border: 1px solid var(--warm-stone);
          border-radius: 100px;
          padding: 8px 18px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-refine:hover:not(:disabled) { background: var(--parchment); border-color: var(--dusty-rose); color: var(--wine); }
        .btn-refine:disabled { opacity: 0.4; cursor: not-allowed; }

        .btn-feedback {
          font-family: 'Jost', sans-serif;
          font-size: 13px;
          font-weight: 400;
          border-radius: 100px;
          padding: 9px 22px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid var(--warm-stone);
          background: var(--cream);
          color: var(--ink-soft);
        }
        .btn-feedback:hover { border-color: var(--dusty-rose); }
        .btn-feedback.active-loved { background: var(--sage); border-color: var(--sage); color: #fff; }
        .btn-feedback.active-no { background: var(--warm-stone); border-color: var(--warm-stone); color: var(--ink-soft); }

        /* ── Card ── */
        .card {
          background: #ffffff;
          border: 1px solid var(--warm-stone);
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 1px 3px rgba(44,36,32,0.04), 0 8px 32px rgba(44,36,32,0.06), 0 32px 64px rgba(44,36,32,0.04);
          margin-bottom: 20px;
        }

        /* ── Suggestions ── */
        .suggestions-label { font-size: 11px; font-weight: 400; letter-spacing: 0.15em; text-transform: uppercase; color: var(--ink-faint); margin-bottom: 12px; }
        .suggestions { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }

        /* ── Hint box ── */
        .hint-box { background: var(--parchment); border: 1px solid var(--warm-stone); border-radius: 16px; padding: 16px 20px; margin-bottom: 24px; }
        .hint-box p { font-size: 13px; font-weight: 300; line-height: 1.65; color: var(--ink-muted); }
        .hint-box p + p { margin-top: 6px; color: var(--ink-faint); font-style: italic; font-family: 'Cormorant Garamond', serif; font-size: 14px; }

        /* ── Textarea ── */
        .textarea {
          font-family: 'Jost', sans-serif;
          font-size: 15px;
          font-weight: 300;
          width: 100%;
          min-height: 120px;
          background: var(--cream);
          border: 1px solid var(--warm-stone);
          border-radius: 16px;
          padding: 18px 20px;
          color: var(--ink);
          outline: none;
          resize: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          line-height: 1.6;
        }
        .textarea::placeholder { color: var(--ink-faint); font-style: italic; font-family: 'Cormorant Garamond', serif; font-size: 16px; }
        .textarea:focus { border-color: var(--dusty-rose); box-shadow: 0 0 0 3px rgba(201,169,160,0.15); }

        /* ── Photo upload strip ── */
        .upload-strip {
          margin-top: 12px;
          margin-bottom: 4px;
        }
        .btn-upload-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: 'Jost', sans-serif;
          font-size: 12px;
          font-weight: 400;
          color: var(--ink-faint);
          cursor: pointer;
          border: 1px dashed var(--warm-stone);
          border-radius: 100px;
          padding: 7px 16px;
          transition: all 0.2s ease;
          background: transparent;
        }
        .btn-upload-label:hover { border-color: var(--dusty-rose); color: var(--wine); }

        .photo-attached {
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--parchment);
          border: 1px solid var(--warm-stone);
          border-radius: 12px;
          padding: 10px 14px;
        }
        .photo-thumb {
          height: 44px;
          width: 64px;
          object-fit: cover;
          border-radius: 8px;
          flex-shrink: 0;
        }
        .photo-info { flex: 1; }
        .photo-info p { font-size: 12px; color: var(--ink-soft); margin-bottom: 3px; }
        .photo-info label {
          font-size: 11px;
          color: var(--ink-faint);
          cursor: pointer;
          text-decoration: underline;
          font-family: 'Jost', sans-serif;
        }
        .btn-remove-photo {
          font-size: 11px;
          color: var(--ink-faint);
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          flex-shrink: 0;
          transition: color 0.2s;
        }
        .btn-remove-photo:hover { color: var(--wine); }

        /* ── Ask row ── */
        .ask-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 16px; }
        .ask-hint { font-style: italic; font-family: 'Cormorant Garamond', serif; font-size: 14px; color: var(--ink-faint); }

        /* ── Loading ── */
        .loading-row { display: flex; align-items: center; gap: 10px; margin-top: 24px; padding: 8px 0; }
        .loading-dots { display: flex; gap: 5px; }
        .loading-dots span { width: 5px; height: 5px; border-radius: 50%; background: var(--dusty-rose); animation: pulse 1.4s ease-in-out infinite; }
        .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
        .loading-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.9); }
          40% { opacity: 1; transform: scale(1); }
        }
        .loading-text { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 14px; color: var(--ink-faint); }

        /* ── Error ── */
        .error { margin-top: 16px; font-size: 13px; color: #b05050; background: #fdf0f0; border: 1px solid #e8c8c8; border-radius: 10px; padding: 12px 16px; }

        /* ── Divider ── */
        .divider { height: 1px; background: var(--warm-stone); margin: 28px 0; }

        /* ── Section labels ── */
        .section-label { font-size: 10px; font-weight: 400; letter-spacing: 0.25em; text-transform: uppercase; color: var(--ink-faint); margin-bottom: 16px; }
        .refine-label { font-size: 11px; font-weight: 400; letter-spacing: 0.18em; text-transform: uppercase; color: var(--ink-faint); margin-bottom: 12px; }
        .refine-buttons { display: flex; flex-wrap: wrap; gap: 8px; }
        .feedback-label { font-size: 13px; font-weight: 300; color: var(--ink-muted); margin-bottom: 12px; }
        .feedback-buttons { display: flex; gap: 10px; }
        .feedback-note { margin-top: 12px; font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 14px; color: var(--ink-faint); }

        /* ── Moment history ── */
        .moment-list { display: flex; flex-direction: column; gap: 10px; }
        .moment-item { display: flex; gap: 12px; align-items: baseline; }
        .moment-tag { font-size: 10px; font-weight: 400; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-faint); flex-shrink: 0; padding-top: 3px; min-width: 36px; }
        .moment-text { font-family: 'Cormorant Garamond', serif; font-size: 17px; font-weight: 400; color: var(--ink-soft); line-height: 1.5; }

        /* ── Recommendation ── */
        .recommendation-text { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 400; line-height: 1.75; color: var(--ink); white-space: pre-wrap; }

        /* ── Footer ── */
        .footer { text-align: center; margin-top: 40px; }
        .footer p { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 13px; color: var(--ink-faint); }

        /* ── Animation ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.4s ease forwards; }
      `}</style>

      <main className="page">
        <div className="container">

          {/* ── Header ── */}
          <header className="header">
            <div className="header-inner">
              <div>
                <p className="eyebrow">Personal wine guide</p>
                <h1 className="title">Wine <em>Sommelier</em></h1>
                <p className="subtitle">A guided recommendation for the moment you are in.</p>
              </div>
              {(activeMoment || recommendation) && (
                <button className="btn-new-session" onClick={handleNewSession}>
                  New moment
                </button>
              )}
            </div>
          </header>

          {/* ── Main card ── */}
          <div className="card">

            {/* Suggestions — fresh state only */}
            {!activeMoment && !recommendation && (
              <>
                <p className="suggestions-label">Try a prompt</p>
                <div className="suggestions">
                  {suggestions.map((idea) => (
                    <button key={idea} className="btn-suggestion" onClick={() => setPrompt(idea)}>
                      {idea}
                    </button>
                  ))}
                </div>
                <div className="hint-box">
                  <p>Start with the mood, the setting, or a wine you've loved before.</p>
                  <p>"I liked Château de Pommard. Tonight I want something softer for dinner with friends."</p>
                </div>
              </>
            )}

            {/* Moment history */}
            {momentHistory.length > 0 && (
              <div className="fade-up" style={{ marginBottom: 24 }}>
                <p className="section-label">Your moment</p>
                <div className="moment-list">
                  {momentHistory.map((item, index) => (
                    <div key={`${item}-${index}`} className="moment-item">
                      <span className="moment-tag">{index === 0 ? "Start" : "Refine"}</span>
                      <p className="moment-text">{item}</p>
                    </div>
                  ))}
                </div>
                <div className="divider" />
              </div>
            )}

            {/* Textarea */}
            <textarea
              className="textarea"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAsk(); }
              }}
              placeholder="What are you in the mood for?"
              rows={4}
            />

            {/* ── Wine list photo upload — lives inside the card, below textarea ── */}
            <div className="upload-strip">
              {/* Hidden file input */}
              <input
                id="wine-list-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
                style={{ display: "none" }}
              />

              {/* No photo yet — show dashed upload button */}
              {!menuImage && (
                <label htmlFor="wine-list-upload" className="btn-upload-label">
                  📷 Add wine list photo
                </label>
              )}

              {/* Photo attached — show thumbnail + controls */}
              {menuImage && (
                <div className="photo-attached">
                  <img src={menuImage} alt="Wine list" className="photo-thumb" />
                  <div className="photo-info">
                    <p>Wine list attached</p>
                    <label htmlFor="wine-list-upload">Change photo</label>
                  </div>
                  <button className="btn-remove-photo" onClick={() => setMenuImage(null)}>
                    ✕ Remove
                  </button>
                </div>
              )}
            </div>

            {/* Ask row */}
            <div className="ask-row">
              <span className="ask-hint">
                {menuImage
                  ? "Describe your mood and I'll pick from the list"
                  : "Mood, setting, food, or a wine you loved before"}
              </span>
              <button
                className="btn-ask"
                onClick={handleAsk}
                disabled={loading || !prompt.trim()}
              >
                {loading ? "..." : "Ask"}
              </button>
            </div>

            {/* Loading */}
            {loading && (
              <div className="loading-row">
                <div className="loading-dots"><span /><span /><span /></div>
                <span className="loading-text">
                  {menuImage
                    ? "Reading the wine list for you…"
                    : "Finding the right wine for this moment…"}
                </span>
              </div>
            )}

            {/* Error */}
            {error && <p className="error">{error}</p>}

            {/* Recommendation */}
            {recommendation && !loading && (
              <div className="fade-up">
                <div className="divider" />
                <p className="section-label">My pick</p>
                <p className="recommendation-text">{recommendation}</p>

                <div className="divider" />

                <p className="refine-label">Refine this</p>
                <div className="refine-buttons">
                  {followUpOptions.map((option) => (
                    <button
                      key={option.label}
                      className="btn-refine"
                      onClick={() => handleFollowUp(option)}
                      disabled={loading}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <div className="divider" />

                <p className="feedback-label">Was this a good recommendation?</p>
                <div className="feedback-buttons">
                  <button
                    className={`btn-feedback ${feedback === "loved" ? "active-loved" : ""}`}
                    onClick={() => setFeedback("loved")}
                  >
                    Loved it
                  </button>
                  <button
                    className={`btn-feedback ${feedback === "not_for_me" ? "active-no" : ""}`}
                    onClick={() => setFeedback("not_for_me")}
                  >
                    Not for me
                  </button>
                </div>
                {feedback === "loved" && (
                  <p className="feedback-note">Noted — we'll use this to shape your taste profile.</p>
                )}
                {feedback === "not_for_me" && (
                  <p className="feedback-note">Good to know. That helps us refine what suits you.</p>
                )}
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <footer className="footer">
            <p>Your personal sommelier, learning with every sip.</p>
          </footer>

        </div>
      </main>
    </>
  );
}