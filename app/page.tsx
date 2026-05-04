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
    { label: "Sunny afternoon, something crisp", emoji: "☀️" },
    { label: "Steak dinner tonight", emoji: "🥩" },
    { label: "Something soft and easy", emoji: "🌿" },
    { label: "Rooftop drinks with friends", emoji: "🌆" },
    { label: "I usually like Pinot Noir", emoji: "🍷" },
    { label: "Impressing someone special", emoji: "✨" },
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
        body { background-color: var(--cream); }

        .page {
          font-family: 'Jost', sans-serif;
          font-weight: 300;
          min-height: 100vh;
          background-color: var(--cream);
          background-image:
            radial-gradient(ellipse at 15% 0%, rgba(201,169,160,0.18) 0%, transparent 55%),
            radial-gradient(ellipse at 85% 100%, rgba(139,58,82,0.09) 0%, transparent 50%);
          color: var(--ink);
        }

        .container { max-width: 620px; margin: 0 auto; padding: 0 20px; }

        /* ── Nav ── */
        .nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 20px;
          max-width: 620px;
          margin: 0 auto;
        }
        .nav-logo {
          font-family: 'Cormorant Garamond', serif;
          font-size: 18px;
          font-weight: 400;
          color: var(--ink);
          letter-spacing: 0.01em;
        }
        .nav-logo em { font-style: italic; color: var(--wine); }
        .nav-actions { display: flex; align-items: center; gap: 10px; }
        .btn-nav {
          font-family: 'Jost', sans-serif;
          font-size: 12px;
          font-weight: 400;
          letter-spacing: 0.07em;
          color: var(--ink-muted);
          background: transparent;
          border: 1px solid var(--warm-stone);
          border-radius: 100px;
          padding: 8px 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          display: inline-block;
          white-space: nowrap;
        }
        .btn-nav:hover { border-color: var(--dusty-rose); color: var(--wine); }
        .btn-nav-wine {
          font-family: 'Jost', sans-serif;
          font-size: 12px;
          font-weight: 400;
          letter-spacing: 0.07em;
          color: var(--wine);
          background: var(--wine-faint);
          border: 1px solid var(--dusty-rose);
          border-radius: 100px;
          padding: 8px 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          display: inline-block;
          white-space: nowrap;
        }
        .btn-nav-wine:hover { background: rgba(139,58,82,0.12); }

        /* ── Hero ── */
        .hero {
          padding: 52px 20px 48px;
          max-width: 620px;
          margin: 0 auto;
        }
        .hero-eyebrow {
          font-family: 'Jost', sans-serif;
          font-weight: 400;
          font-size: 10px;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          color: var(--dusty-rose);
          margin-bottom: 20px;
        }
        .hero-headline {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 300;
          font-size: clamp(42px, 9vw, 68px);
          line-height: 1.0;
          letter-spacing: -0.015em;
          color: var(--ink);
          margin-bottom: 24px;
        }
        .hero-headline em { font-style: italic; color: var(--wine); }
        .hero-sub {
          font-size: 15px;
          font-weight: 300;
          color: var(--ink-muted);
          line-height: 1.7;
          max-width: 420px;
        }
        .hero-sub strong {
          font-weight: 400;
          color: var(--ink-soft);
        }

        /* ── Main input card ── */
        .input-card {
          background: #ffffff;
          border: 1px solid var(--warm-stone);
          border-radius: 24px;
          padding: 28px;
          box-shadow: 0 1px 3px rgba(44,36,32,0.04), 0 8px 40px rgba(44,36,32,0.07);
          margin-bottom: 16px;
        }

        .input-label {
          font-size: 11px;
          font-weight: 400;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--ink-faint);
          margin-bottom: 12px;
        }

        .starters {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-bottom: 20px;
        }
        .btn-starter {
          font-family: 'Jost', sans-serif;
          font-size: 13px;
          font-weight: 300;
          color: var(--ink-soft);
          background: var(--cream);
          border: 1px solid var(--warm-stone);
          border-radius: 100px;
          padding: 7px 14px;
          cursor: pointer;
          transition: all 0.18s ease;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .btn-starter:hover {
          background: var(--parchment);
          border-color: var(--dusty-rose);
          color: var(--wine);
        }
        .starter-emoji { font-size: 13px; }

        .textarea {
          font-family: 'Jost', sans-serif;
          font-size: 15px;
          font-weight: 300;
          width: 100%;
          min-height: 110px;
          background: var(--cream);
          border: 1px solid var(--warm-stone);
          border-radius: 16px;
          padding: 16px 18px;
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

        /* Upload */
        .upload-strip { margin: 10px 0 4px; }
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
          padding: 6px 14px;
          transition: all 0.2s ease;
        }
        .btn-upload-label:hover { border-color: var(--dusty-rose); color: var(--wine); }
        .photo-attached { display: flex; align-items: center; gap: 12px; background: var(--parchment); border: 1px solid var(--warm-stone); border-radius: 12px; padding: 10px 14px; }
        .photo-thumb { height: 40px; width: 58px; object-fit: cover; border-radius: 6px; flex-shrink: 0; }
        .photo-info { flex: 1; }
        .photo-info p { font-size: 12px; color: var(--ink-soft); margin-bottom: 2px; }
        .photo-info label { font-size: 11px; color: var(--ink-faint); cursor: pointer; text-decoration: underline; font-family: 'Jost', sans-serif; }
        .btn-remove-photo { font-size: 11px; color: var(--ink-faint); background: none; border: none; cursor: pointer; padding: 4px; transition: color 0.2s; }
        .btn-remove-photo:hover { color: var(--wine); }

        /* Ask row */
        .ask-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 14px;
        }
        .ask-hint {
          font-style: italic;
          font-family: 'Cormorant Garamond', serif;
          font-size: 14px;
          color: var(--ink-faint);
          line-height: 1.4;
        }
        .btn-ask {
          font-family: 'Jost', sans-serif;
          font-size: 13px;
          font-weight: 400;
          letter-spacing: 0.08em;
          background: var(--wine);
          color: #fff;
          border: none;
          border-radius: 100px;
          padding: 13px 30px;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        .btn-ask:hover:not(:disabled) {
          background: var(--wine-light);
          transform: translateY(-1px);
          box-shadow: 0 4px 18px rgba(139,58,82,0.28);
        }
        .btn-ask:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

        /* Loading */
        .loading-row { display: flex; align-items: center; gap: 10px; margin-top: 22px; }
        .loading-dots { display: flex; gap: 5px; }
        .loading-dots span { width: 5px; height: 5px; border-radius: 50%; background: var(--dusty-rose); animation: pulse 1.4s ease-in-out infinite; }
        .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
        .loading-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.9); }
          40% { opacity: 1; transform: scale(1); }
        }
        .loading-text { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 14px; color: var(--ink-faint); }

        .error { margin-top: 16px; font-size: 13px; color: #b05050; background: #fdf0f0; border: 1px solid #e8c8c8; border-radius: 10px; padding: 12px 16px; }

        /* ── Moment trail ── */
        .moment-trail {
          margin-bottom: 20px;
          padding: 16px 20px;
          background: var(--parchment);
          border: 1px solid var(--warm-stone);
          border-radius: 16px;
        }
        .moment-trail-label {
          font-size: 10px;
          font-weight: 400;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--ink-faint);
          margin-bottom: 10px;
        }
        .moment-list { display: flex; flex-direction: column; gap: 8px; }
        .moment-item { display: flex; gap: 10px; align-items: baseline; }
        .moment-tag { font-size: 9px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-faint); flex-shrink: 0; min-width: 38px; padding-top: 2px; }
        .moment-text { font-family: 'Cormorant Garamond', serif; font-size: 16px; font-weight: 400; color: var(--ink-soft); line-height: 1.4; }

        /* ── Recommendation card ── */
        .rec-card {
          background: #fff;
          border: 1px solid var(--warm-stone);
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 1px 3px rgba(44,36,32,0.04), 0 8px 40px rgba(44,36,32,0.07);
          margin-bottom: 16px;
          animation: fadeUp 0.45s ease forwards;
        }
        .rec-eyebrow {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 18px;
        }
        .rec-eyebrow-line {
          height: 1px;
          flex: 1;
          background: var(--warm-stone);
        }
        .rec-eyebrow-label {
          font-size: 10px;
          font-weight: 400;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--dusty-rose);
        }
        .rec-text {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px;
          font-weight: 400;
          line-height: 1.75;
          color: var(--ink);
          white-space: pre-wrap;
          margin-bottom: 28px;
        }

        /* Refine section */
        .refine-section { border-top: 1px solid var(--warm-stone); padding-top: 22px; margin-bottom: 22px; }
        .refine-label {
          font-size: 10px;
          font-weight: 400;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--ink-faint);
          margin-bottom: 12px;
        }
        .refine-buttons { display: flex; flex-wrap: wrap; gap: 7px; }
        .btn-refine {
          font-family: 'Jost', sans-serif;
          font-size: 12px;
          font-weight: 400;
          color: var(--ink-soft);
          background: var(--cream);
          border: 1px solid var(--warm-stone);
          border-radius: 100px;
          padding: 8px 16px;
          cursor: pointer;
          transition: all 0.18s ease;
        }
        .btn-refine:hover:not(:disabled) {
          background: var(--parchment);
          border-color: var(--dusty-rose);
          color: var(--wine);
        }
        .btn-refine:disabled { opacity: 0.4; cursor: not-allowed; }

        /* Feedback section */
        .feedback-section { border-top: 1px solid var(--warm-stone); padding-top: 22px; }
        .feedback-question {
          font-size: 13px;
          font-weight: 300;
          color: var(--ink-muted);
          margin-bottom: 12px;
        }
        .feedback-buttons { display: flex; gap: 8px; }
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
        .btn-feedback.active-loved { background: var(--wine); border-color: var(--wine); color: #fff; }
        .btn-feedback.active-no { background: var(--warm-stone); border-color: var(--warm-stone); color: var(--ink-soft); }
        .feedback-note {
          margin-top: 12px;
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 15px;
          color: var(--ink-muted);
          line-height: 1.55;
        }

        /* ── Tasting mode section ── */
        .tasting-section {
          background: #fff;
          border: 1px solid var(--warm-stone);
          border-radius: 24px;
          padding: 28px 32px;
          box-shadow: 0 1px 3px rgba(44,36,32,0.03), 0 4px 20px rgba(44,36,32,0.05);
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }
        .tasting-copy { flex: 1; }
        .tasting-eyebrow {
          font-size: 10px;
          font-weight: 400;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--dusty-rose);
          margin-bottom: 8px;
        }
        .tasting-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 24px;
          font-weight: 400;
          color: var(--ink);
          margin-bottom: 8px;
          line-height: 1.2;
        }
        .tasting-title em { font-style: italic; color: var(--wine); }
        .tasting-desc {
          font-size: 13px;
          font-weight: 300;
          color: var(--ink-muted);
          line-height: 1.6;
        }
        .btn-tasting {
          font-family: 'Jost', sans-serif;
          font-size: 12px;
          font-weight: 400;
          letter-spacing: 0.07em;
          color: var(--wine);
          background: var(--wine-faint);
          border: 1px solid var(--dusty-rose);
          border-radius: 100px;
          padding: 11px 22px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          white-space: nowrap;
          flex-shrink: 0;
          display: inline-block;
        }
        .btn-tasting:hover { background: rgba(139,58,82,0.12); transform: translateY(-1px); }

        /* ── How it works ── */
        .how-section {
          padding: 12px 0 48px;
        }
        .how-label {
          font-size: 10px;
          font-weight: 400;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--ink-faint);
          text-align: center;
          margin-bottom: 28px;
        }
        .how-steps {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
        }
        .how-step {
          text-align: center;
          padding: 20px 12px;
        }
        .how-step-num {
          font-family: 'Cormorant Garamond', serif;
          font-size: 32px;
          font-weight: 300;
          font-style: italic;
          color: var(--dusty-rose);
          line-height: 1;
          margin-bottom: 10px;
        }
        .how-step-text {
          font-size: 13px;
          font-weight: 300;
          color: var(--ink-muted);
          line-height: 1.6;
        }
        .how-step-text strong {
          display: block;
          font-weight: 400;
          color: var(--ink-soft);
          margin-bottom: 4px;
          font-size: 14px;
        }

        /* Footer */
        .footer {
          border-top: 1px solid var(--warm-stone);
          padding: 24px 20px;
          text-align: center;
        }
        .footer p {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 13px;
          color: var(--ink-faint);
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.4s ease forwards; }

        @media (max-width: 480px) {
          .hero { padding: 36px 20px 36px; }
          .how-steps { grid-template-columns: 1fr; gap: 4px; }
          .tasting-section { flex-direction: column; align-items: flex-start; }
          .input-card { padding: 20px; }
          .rec-card { padding: 24px 20px; }
        }
      `}</style>

      {/* ── Nav ── */}
      <nav className="nav">
        <span className="nav-logo">Wine <em>Sommelier</em></span>
        <div className="nav-actions">
          {(activeMoment || recommendation) && (
            <button className="btn-nav" onClick={handleNewSession}>New moment</button>
          )}
          <Link href="/tasting" className="btn-nav-wine">Tasting mode</Link>
        </div>
      </nav>

      <main className="page">

        {/* ── Hero — only shown before first recommendation ── */}
        {!recommendation && !loading && (
          <div className="hero fade-up">
            <p className="hero-eyebrow">Your personal sommelier</p>
            <h1 className="hero-headline">
              Stop guessing.<br />
              Start drinking <em>well.</em>
            </h1>
            <p className="hero-sub">
              Tell us the moment you're in — the mood, the food, the setting.
              We'll give you <strong>one confident pick</strong>, not a lecture.
            </p>
          </div>
        )}

        <div className="container">

          {/* ── Moment trail (shown once a session has started) ── */}
          {momentHistory.length > 0 && (
            <div className="moment-trail fade-up" style={{ marginBottom: 16 }}>
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
          <div className="input-card">

            {/* Starters — only before first ask */}
            {!activeMoment && !recommendation && (
              <>
                <p className="input-label">Start here</p>
                <div className="starters">
                  {starters.map((s) => (
                    <button
                      key={s.label}
                      className="btn-starter"
                      onClick={() => setPrompt(s.label)}
                    >
                      <span className="starter-emoji">{s.emoji}</span>
                      {s.label}
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
                  ? "Refine further — or tell me something new…"
                  : "Describe the moment. Mood, food, a wine you've loved…"
              }
              rows={activeMoment ? 3 : 4}
            />

            {/* Wine list upload */}
            <div className="upload-strip">
              <input
                id="wine-list-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
                style={{ display: "none" }}
              />
              {!menuImage && (
                <label htmlFor="wine-list-upload" className="btn-upload-label">
                  📷 Attach a wine list
                </label>
              )}
              {menuImage && (
                <div className="photo-attached">
                  <img src={menuImage} alt="Wine list" className="photo-thumb" />
                  <div className="photo-info">
                    <p>Wine list attached</p>
                    <label htmlFor="wine-list-upload">Change photo</label>
                  </div>
                  <button className="btn-remove-photo" onClick={() => setMenuImage(null)}>✕</button>
                </div>
              )}
            </div>

            <div className="ask-row">
              <span className="ask-hint">
                {menuImage
                  ? "Describe your mood and I'll pick from the list"
                  : activeMoment
                  ? "Ask anything else about this pick"
                  : "The more real you are, the better the pick"}
              </span>
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
                <span className="rec-eyebrow-line" />
                <span className="rec-eyebrow-label">My pick</span>
                <span className="rec-eyebrow-line" />
              </div>

              <p className="rec-text">{recommendation}</p>

              <div className="refine-section">
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
              </div>

              <div className="feedback-section">
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
                  <p className="feedback-note">Noted — this helps us learn your palate over time.</p>
                )}
                {feedback === "not_for_me" && (
                  <p className="feedback-note">Good to know. We'll avoid this direction next time.</p>
                )}
              </div>
            </div>
          )}

          {/* ── Tasting mode entry ── */}
          {!recommendation && (
            <div className="tasting-section">
              <div className="tasting-copy">
                <p className="tasting-eyebrow">Going to a winery or tasting?</p>
                <h2 className="tasting-title">Tasting <em>Mode</em></h2>
                <p className="tasting-desc">
                  Work through each wine as you try it. We'll map your palate and tell you exactly what to buy more of.
                </p>
              </div>
              <Link href="/tasting" className="btn-tasting">Start tasting</Link>
            </div>
          )}

          {/* ── How it works ── */}
          {!recommendation && (
            <div className="how-section">
              <p className="how-label">How it works</p>
              <div className="how-steps">
                <div className="how-step">
                  <div className="how-step-num">1</div>
                  <p className="how-step-text">
                    <strong>Describe your moment</strong>
                    The mood, the food, a wine you've loved — anything real.
                  </p>
                </div>
                <div className="how-step">
                  <div className="how-step-num">2</div>
                  <p className="how-step-text">
                    <strong>Get one confident pick</strong>
                    Not a list. A single recommendation made for your exact situation.
                  </p>
                </div>
                <div className="how-step">
                  <div className="how-step-num">3</div>
                  <p className="how-step-text">
                    <strong>Buy it, love it</strong>
                    Stop wasting money on wine that doesn't suit you.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ── Footer ── */}
        <footer className="footer">
          <p>Your sommelier, learning with every pour.</p>
        </footer>

      </main>
    </>
  );
}