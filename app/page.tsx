"use client";

import { useState } from "react";
import Link from "next/link";

type FeedbackState = "" | "loved" | "not_for_me";
type HistoryItem = { role: "user" | "assistant"; content: string };
type FollowUpOption = {
  label: string;
  buildPrompt: (lastPrompt: string, lastRecommendation: string) => string;
};

export default function HomePage() {
  const [prompt, setPrompt] = useState("");
  const [activeMoment, setActiveMoment] = useState("");
  const [momentHistory, setMomentHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState("");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState>("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [menuImage, setMenuImage] = useState<string | null>(null);

  const starters = [
    "Sunny afternoon, something crisp",
    "Steak dinner tonight",
    "Something soft and easy",
    "Rooftop drinks with friends",
    "I usually like Pinot Noir",
    "Impressing someone special",
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
      label: "Safer choice",
      buildPrompt: (lastPrompt, lastRecommendation) =>
        `Based on my wine moment "${lastPrompt}" and your current recommendation "${lastRecommendation}", give me a safer and more crowd-pleasing option.`,
    },
    {
      label: "More adventurous",
      buildPrompt: (lastPrompt, lastRecommendation) =>
        `Based on my wine moment "${lastPrompt}" and your current recommendation "${lastRecommendation}", give me a slightly more adventurous option that still suits me.`,
    },
  ];

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
      const nextHistory: HistoryItem[] = [
        ...history,
        { role: "user", content: nextPrompt },
      ];
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: nextPrompt, history: nextHistory, image: menuImage || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setRecommendation(data.recommendation);
      setHistory([...nextHistory, { role: "assistant", content: data.recommendation }]);
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

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setMenuImage(reader.result as string);
    reader.readAsDataURL(file);
  }

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

  const hasResult = recommendation && !loading;

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
          --wine-faint: rgba(139,58,82,0.07);
          --sage: #8a9e8c;
          --ink: #2c2420;
          --ink-soft: #4a3d37;
          --ink-muted: #7a6a62;
          --ink-faint: #a89990;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background-color: var(--cream); }

        .page {
          font-family: 'Jost', sans-serif;
          font-weight: 300;
          min-height: 100vh;
          background-color: var(--cream);
          background-image:
            radial-gradient(ellipse at 20% 0%, rgba(201,169,160,0.2) 0%, transparent 55%),
            radial-gradient(ellipse at 80% 90%, rgba(139,58,82,0.08) 0%, transparent 50%);
          color: var(--ink);
        }

        .wrap { max-width: 600px; margin: 0 auto; padding: 0 20px; }

        /* ── Nav ── */
        .nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 22px 20px;
          max-width: 600px;
          margin: 0 auto;
        }
        .nav-logo {
          font-family: 'Cormorant Garamond', serif;
          font-size: 18px;
          font-weight: 400;
          color: var(--ink);
        }
        .nav-logo em { font-style: italic; color: var(--wine); }
        .nav-right { display: flex; align-items: center; gap: 14px; }
        .btn-ghost {
          font-family: 'Jost', sans-serif;
          font-size: 11px;
          font-weight: 400;
          letter-spacing: 0.07em;
          color: var(--ink-faint);
          background: transparent;
          border: none;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          transition: color 0.2s ease;
          padding: 4px 0;
        }
        .btn-ghost:hover { color: var(--wine); }

        /* ── Hero ── */
        .hero {
          padding: 36px 20px 28px;
          max-width: 600px;
          margin: 0 auto;
        }
        .hero-eyebrow {
          font-size: 10px;
          font-weight: 400;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          color: var(--dusty-rose);
          margin-bottom: 16px;
        }
        .hero-headline {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 300;
          font-size: clamp(38px, 10vw, 58px);
          line-height: 1.05;
          letter-spacing: -0.01em;
          color: var(--ink);
          margin-bottom: 16px;
        }
        .hero-headline em { font-style: italic; color: var(--wine); }
        .hero-sub {
          font-size: 14px;
          font-weight: 300;
          color: var(--ink-muted);
          line-height: 1.7;
          max-width: 360px;
        }

        /* ── Main card ── */
        .main-card {
          background: #ffffff;
          border: 1px solid var(--warm-stone);
          border-radius: 22px;
          padding: 22px 22px 18px;
          box-shadow:
            0 1px 2px rgba(44,36,32,0.04),
            0 8px 32px rgba(44,36,32,0.07),
            0 24px 48px rgba(44,36,32,0.03);
          margin-bottom: 12px;
        }

        .starters-label {
          font-size: 10px;
          font-weight: 400;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--ink-faint);
          margin-bottom: 9px;
        }
        .starters {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 14px;
        }
        .btn-starter {
          font-family: 'Jost', sans-serif;
          font-size: 12px;
          font-weight: 300;
          color: var(--ink-soft);
          background: var(--cream);
          border: 1px solid var(--warm-stone);
          border-radius: 100px;
          padding: 5px 13px;
          cursor: pointer;
          transition: all 0.18s ease;
          letter-spacing: 0.01em;
        }
        .btn-starter:hover {
          background: var(--parchment);
          border-color: var(--dusty-rose);
          color: var(--wine);
        }

        .textarea {
          font-family: 'Jost', sans-serif;
          font-size: 15px;
          font-weight: 300;
          width: 100%;
          min-height: 88px;
          background: var(--cream);
          border: 1px solid var(--warm-stone);
          border-radius: 14px;
          padding: 13px 15px;
          color: var(--ink);
          outline: none;
          resize: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          line-height: 1.65;
        }
        .textarea::placeholder {
          color: var(--ink-faint);
          font-style: italic;
          font-family: 'Cormorant Garamond', serif;
          font-size: 16px;
        }
        .textarea:focus {
          border-color: var(--dusty-rose);
          box-shadow: 0 0 0 3px rgba(201,169,160,0.15);
        }

        .card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 11px;
        }
        .card-footer-left { display: flex; align-items: center; flex: 1; min-width: 0; }

        .btn-upload {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-family: 'Jost', sans-serif;
          font-size: 11px;
          font-weight: 400;
          color: var(--ink-faint);
          cursor: pointer;
          border: 1px dashed var(--warm-stone);
          border-radius: 100px;
          padding: 5px 12px;
          transition: all 0.2s ease;
          white-space: nowrap;
          background: transparent;
        }
        .btn-upload:hover { border-color: var(--dusty-rose); color: var(--wine); }

        .photo-attached {
          display: flex;
          align-items: center;
          gap: 7px;
          background: var(--parchment);
          border: 1px solid var(--warm-stone);
          border-radius: 100px;
          padding: 4px 10px 4px 5px;
          min-width: 0;
          max-width: 200px;
        }
        .photo-thumb { height: 26px; width: 36px; object-fit: cover; border-radius: 5px; flex-shrink: 0; }
        .photo-name { font-size: 11px; color: var(--ink-soft); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .btn-remove { font-size: 10px; color: var(--ink-faint); background: none; border: none; cursor: pointer; padding: 0 0 0 3px; transition: color 0.2s; flex-shrink: 0; }
        .btn-remove:hover { color: var(--wine); }

        .btn-ask {
          font-family: 'Jost', sans-serif;
          font-size: 13px;
          font-weight: 400;
          letter-spacing: 0.06em;
          background: var(--wine);
          color: #fff;
          border: none;
          border-radius: 100px;
          padding: 12px 26px;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
          white-space: nowrap;
        }
        .btn-ask:hover:not(:disabled) {
          background: var(--wine-light);
          transform: translateY(-1px);
          box-shadow: 0 4px 18px rgba(139,58,82,0.3);
        }
        .btn-ask:disabled { opacity: 0.38; cursor: not-allowed; transform: none; }

        .loading-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 16px;
        }
        .loading-dots { display: flex; gap: 5px; }
        .loading-dots span {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: var(--dusty-rose);
          animation: pulse 1.4s ease-in-out infinite;
        }
        .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
        .loading-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.9); }
          40% { opacity: 1; transform: scale(1); }
        }
        .loading-text {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 14px;
          color: var(--ink-faint);
        }

        .error {
          margin-top: 12px;
          font-size: 13px;
          color: #b05050;
          background: #fdf0f0;
          border: 1px solid #e8c8c8;
          border-radius: 10px;
          padding: 11px 15px;
        }

        /* ── Moment trail ── */
        .moment-trail {
          padding: 13px 18px;
          background: var(--parchment);
          border: 1px solid var(--warm-stone);
          border-radius: 16px;
          margin-bottom: 12px;
        }
        .moment-trail-label {
          font-size: 10px;
          font-weight: 400;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--ink-faint);
          margin-bottom: 7px;
        }
        .moment-list { display: flex; flex-direction: column; gap: 5px; }
        .moment-item { display: flex; gap: 10px; align-items: baseline; }
        .moment-tag {
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--ink-faint);
          flex-shrink: 0;
          min-width: 36px;
        }
        .moment-text {
          font-family: 'Cormorant Garamond', serif;
          font-size: 16px;
          font-weight: 400;
          color: var(--ink-soft);
          line-height: 1.4;
        }

        /* ── Recommendation card ── */
        .rec-card {
          background: #fff;
          border: 1px solid var(--warm-stone);
          border-radius: 22px;
          padding: 26px 22px;
          box-shadow: 0 1px 2px rgba(44,36,32,0.04), 0 8px 32px rgba(44,36,32,0.07);
          margin-bottom: 12px;
          animation: fadeUp 0.4s ease forwards;
        }
        .rec-eyebrow {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
        }
        .rec-line { height: 1px; flex: 1; background: var(--warm-stone); }
        .rec-eyebrow-label {
          font-size: 10px;
          font-weight: 400;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--dusty-rose);
        }
        .rec-text {
          font-family: 'Cormorant Garamond', serif;
          font-size: 19px;
          font-weight: 400;
          line-height: 1.75;
          color: var(--ink);
          white-space: pre-wrap;
          margin-bottom: 22px;
        }
        .divider { height: 1px; background: var(--warm-stone); margin: 18px 0; }

        .refine-label {
          font-size: 10px;
          font-weight: 400;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--ink-faint);
          margin-bottom: 9px;
        }
        .refine-buttons { display: flex; flex-wrap: wrap; gap: 6px; }
        .btn-refine {
          font-family: 'Jost', sans-serif;
          font-size: 12px;
          font-weight: 400;
          color: var(--ink-soft);
          background: var(--cream);
          border: 1px solid var(--warm-stone);
          border-radius: 100px;
          padding: 6px 14px;
          cursor: pointer;
          transition: all 0.18s ease;
        }
        .btn-refine:hover:not(:disabled) {
          background: var(--parchment);
          border-color: var(--dusty-rose);
          color: var(--wine);
        }
        .btn-refine:disabled { opacity: 0.4; cursor: not-allowed; }

        .feedback-question {
          font-size: 13px;
          font-weight: 300;
          color: var(--ink-muted);
          margin-bottom: 10px;
        }
        .feedback-buttons { display: flex; gap: 8px; }
        .btn-feedback {
          font-family: 'Jost', sans-serif;
          font-size: 13px;
          font-weight: 400;
          border-radius: 100px;
          padding: 8px 20px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid var(--warm-stone);
          background: var(--cream);
          color: var(--ink-soft);
        }
        .btn-feedback:hover { border-color: var(--dusty-rose); }
        .btn-feedback.active-loved { background: var(--wine); border-color: var(--wine); color: #fff; }
        .btn-feedback.active-no { background: var(--warm-stone); border-color: var(--warm-stone); color: var(--ink-soft); }
        .feedback-note {
          margin-top: 10px;
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 15px;
          color: var(--ink-muted);
          line-height: 1.5;
        }

        /* ── Tasting entry ── */
        .tasting-entry {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 18px 22px;
          background: #fff;
          border: 1px solid var(--warm-stone);
          border-radius: 20px;
          box-shadow: 0 1px 2px rgba(44,36,32,0.03), 0 4px 14px rgba(44,36,32,0.05);
          margin-bottom: 12px;
        }
        .tasting-copy { flex: 1; }
        .tasting-eyebrow {
          font-size: 10px;
          font-weight: 400;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--dusty-rose);
          margin-bottom: 4px;
        }
        .tasting-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 19px;
          font-weight: 400;
          color: var(--ink);
          margin-bottom: 3px;
        }
        .tasting-title em { font-style: italic; color: var(--wine); }
        .tasting-desc {
          font-size: 12px;
          font-weight: 300;
          color: var(--ink-muted);
          line-height: 1.55;
        }
        .btn-start-tasting {
          font-family: 'Jost', sans-serif;
          font-size: 11px;
          font-weight: 400;
          letter-spacing: 0.07em;
          color: var(--wine);
          background: var(--wine-faint);
          border: 1px solid var(--dusty-rose);
          border-radius: 100px;
          padding: 9px 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          white-space: nowrap;
          flex-shrink: 0;
          display: inline-block;
        }
        .btn-start-tasting:hover { background: rgba(139,58,82,0.12); }

        /* ── Footer ── */
        .footer {
          padding: 24px 20px 36px;
          text-align: center;
        }
        .footer p {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 13px;
          color: var(--ink-faint);
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.38s ease forwards; }

        @media (max-width: 480px) {
          .hero { padding: 24px 20px 20px; }
          .tasting-entry { flex-direction: column; align-items: flex-start; }
          .card-footer { flex-direction: column; align-items: stretch; }
          .btn-ask { text-align: center; }
        }
      `}</style>

      {/* ── Nav ── */}
      <nav className="nav">
        <span className="nav-logo">Wine <em>Sommelier</em></span>
        <div className="nav-right">
          {(activeMoment || recommendation) && (
            <button className="btn-ghost" onClick={handleNewSession}>New moment</button>
          )}
          <Link href="/tasting" className="btn-ghost">Tasting mode</Link>
        </div>
      </nav>

      <main className="page">

        {/* ── Hero ── */}
        {!hasResult && (
          <div className="hero fade-up">
            <p className="hero-eyebrow">Your personal sommelier</p>
            <h1 className="hero-headline">
              Your next wine,<br />chosen <em>well.</em>
            </h1>
            <p className="hero-sub">
              Describe the moment — the mood, the food, the setting.
              One confident pick, every time.
            </p>
          </div>
        )}

        <div className="wrap">

          {/* ── Moment trail ── */}
          {momentHistory.length > 0 && (
            <div className="moment-trail fade-up">
              <p className="moment-trail-label">Your moment</p>
              <div className="moment-list">
                {momentHistory.map((item, index) => (
                  <div key={`${item}-${index}`} className="moment-item">
                    <span className="moment-tag">{index === 0 ? "Start" : "Refine"}</span>
                    <p className="moment-text">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Input card ── */}
          <div className="main-card">

            {!activeMoment && !recommendation && (
              <>
                <p className="starters-label">Try a moment</p>
                <div className="starters">
                  {starters.map((s) => (
                    <button key={s} className="btn-starter" onClick={() => setPrompt(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </>
            )}

            <textarea
              className="textarea"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAsk(); }
              }}
              placeholder={
                activeMoment
                  ? "Refine further, or describe something new…"
                  : "Describe the moment. Mood, food, a wine you've loved…"
              }
              rows={activeMoment ? 3 : 4}
            />

            <div className="card-footer">
              <div className="card-footer-left">
                <input
                  id="wine-list-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageUpload}
                  style={{ display: "none" }}
                />
                {!menuImage ? (
                  <label htmlFor="wine-list-upload" className="btn-upload">
                    📷 Add wine list
                  </label>
                ) : (
                  <div className="photo-attached">
                    <img src={menuImage} alt="Wine list" className="photo-thumb" />
                    <span className="photo-name">Wine list attached</span>
                    <button className="btn-remove" onClick={() => setMenuImage(null)}>✕</button>
                  </div>
                )}
              </div>
              <button
                className="btn-ask"
                onClick={handleAsk}
                disabled={loading || !prompt.trim()}
              >
                {loading ? "…" : activeMoment ? "Refine" : "Find my wine"}
              </button>
            </div>

            {loading && (
              <div className="loading-row">
                <div className="loading-dots"><span /><span /><span /></div>
                <span className="loading-text">
                  {menuImage ? "Reading the wine list…" : "Finding the right wine for this moment…"}
                </span>
              </div>
            )}

            {error && <p className="error">{error}</p>}
          </div>

          {/* ── Recommendation card ── */}
          {hasResult && (
            <div className="rec-card">
              <div className="rec-eyebrow">
                <span className="rec-line" />
                <span className="rec-eyebrow-label">My pick</span>
                <span className="rec-line" />
              </div>
              <p className="rec-text">{recommendation}</p>
              <div className="divider" />
              <p className="refine-label">Refine this</p>
              <div className="refine-buttons" style={{ marginBottom: 18 }}>
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
              <p className="feedback-question">Was this a good pick?</p>
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
                <p className="feedback-note">Noted — this shapes your taste profile over time.</p>
              )}
              {feedback === "not_for_me" && (
                <p className="feedback-note">Good to know. We'll steer away from this next time.</p>
              )}
            </div>
          )}

          {/* ── Tasting mode entry ── */}
          {!recommendation && !loading && (
            <div className="tasting-entry">
              <div className="tasting-copy">
                <p className="tasting-eyebrow">At a winery or tasting?</p>
                <p className="tasting-title">Tasting <em>Mode</em></p>
                <p className="tasting-desc">
                  Try wines one by one. We'll map your palate and tell you exactly what to buy.
                </p>
              </div>
              <Link href="/tasting" className="btn-start-tasting">Start tasting</Link>
            </div>
          )}

        </div>

        <footer className="footer">
          <p>Your sommelier, learning with every pour.</p>
        </footer>

      </main>
    </>
  );
}