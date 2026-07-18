import { useState } from "react";
import {
  generateTopics,
  PACKAGE_SIZES,
  type PackageSize,
} from "./lib/generateTopics";
import {
  savePackage,
  distributeToDailyPlan,
} from "./lib/persistence";
import {
  CATEGORIES,
  CATEGORY_COUNTS,
  type Category,
  type Topic,
} from "./data/topics";

type CategoryFilter = Category | "All";

type Toast =
  | { kind: "success" | "error" | "warning"; text: string }
  | null;

export default function App() {
  const [size, setSize] = useState<PackageSize>(25);
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [message, setMessage] = useState<{
    kind: "error" | "warning";
    text: string;
  } | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const [busy, setBusy] = useState<"save" | "distribute" | null>(null);

  const handleGenerate = () => {
    setToast(null);
    const result = generateTopics(size, category);
    if (!result.ok) {
      setTopics([]);
      setMessage({
        kind: result.message && result.message.includes("only") ? "warning" : "error",
        text: result.message ?? "Unable to generate topics.",
      });
      setHasGenerated(true);
      return;
    }
    setTopics(result.topics);
    setMessage(null);
    setHasGenerated(true);
  };

  const handleSave = async () => {
    if (topics.length === 0) return;
    setBusy("save");
    setToast(null);
    const res = await savePackage(topics, category);
    setToast({
      kind: res.ok ? "success" : "error",
      text: res.message,
    });
    setBusy(null);
  };

  const handleDistribute = async () => {
    if (topics.length === 0) return;
    setBusy("distribute");
    setToast(null);
    const res = await distributeToDailyPlan(topics, category);
    setToast({
      kind: res.ok ? "success" : "error",
      text: res.message,
    });
    setBusy(null);
  };

  const showResults = hasGenerated && topics.length > 0;
  const showInsufficient = hasGenerated && topics.length === 0 && message;

  return (
    <div className="app">
      <header className="header">
        <h1>Starter Knowledge Pack</h1>
        <p>Generate a curated set of textile, fashion, and innerwear topics.</p>
        <span className="badge">
          <span className="dot" />
          Built-in dataset ·{" "}
          {CATEGORY_COUNTS.Textile +
            CATEGORY_COUNTS.Fashion +
            CATEGORY_COUNTS.Innerwear}{" "}
          topics · No API key required
        </span>
      </header>

      <section className="card">
        <div className="field">
          <span className="label">Package size</span>
          <div className="options">
            {PACKAGE_SIZES.map((s) => (
              <button
                key={s}
                type="button"
                className={`option ${size === s ? "selected" : ""}`}
                onClick={() => setSize(s)}
              >
                {s}
                <span className="sub">topics</span>
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="label">Category</span>
          <div className="options options-category">
            <button
              type="button"
              className={`option ${category === "All" ? "selected" : ""}`}
              onClick={() => setCategory("All")}
            >
              All
              <span className="sub">
                {CATEGORY_COUNTS.Textile +
                  CATEGORY_COUNTS.Fashion +
                  CATEGORY_COUNTS.Innerwear}{" "}
                topics
              </span>
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                className={`option ${category === c ? "selected" : ""}`}
                onClick={() => setCategory(c)}
              >
                {c}
                <span className="sub">{CATEGORY_COUNTS[c]} topics</span>
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="generate-btn"
          onClick={handleGenerate}
        >
          Generate {size} topics
        </button>

        {message && (
          <div className={`message ${message.kind}`}>
            <span className="icon">
              {message.kind === "warning" ? "⚠" : "✕"}
            </span>
            <span>{message.text}</span>
          </div>
        )}
      </section>

      {showResults && (
        <section className="results-section">
          <div className="results-header">
            <h2>Generated topics</h2>
            <span className="count">
              {topics.length} of {category === "All" ? "all" : category} · {size}{" "}
              requested
            </span>
          </div>

          <div className="topic-list">
            {topics.map((t, i) => (
              <article key={t.id} className="topic">
                <span className="num">{i + 1}</span>
                <div className="body">
                  <p className="title">{t.title}</p>
                  <div className="meta">
                    <span className={`cat-pill ${t.category}`}>
                      {t.category}
                    </span>
                    {t.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="actions">
            <button
              type="button"
              className="action-btn primary"
              onClick={handleSave}
              disabled={busy !== null}
            >
              {busy === "save" ? "Saving…" : "Save topics"}
            </button>
            <button
              type="button"
              className="action-btn accent"
              onClick={handleDistribute}
              disabled={busy !== null}
            >
              {busy === "distribute"
                ? "Distributing…"
                : "Distribute to daily plan"}
            </button>
            <button
              type="button"
              className="action-btn ghost"
              onClick={handleGenerate}
              disabled={busy !== null}
            >
              Regenerate
            </button>
          </div>

          {toast && (
            <div className={`toast ${toast.kind}`}>
              <span className="icon">
                {toast.kind === "success"
                  ? "✓"
                  : toast.kind === "warning"
                  ? "⚠"
                  : "✕"}
              </span>
              <span>{toast.text}</span>
            </div>
          )}
        </section>
      )}

      {showInsufficient && (
        <section className="results-section">
          <div className="insufficient">
            <div className="insufficient-icon">⚠</div>
            <h2>Not enough topics for this selection</h2>
            <p>{message!.text}</p>
            <div className="insufficient-actions">
              <button
                type="button"
                className="action-btn primary"
                onClick={() => setCategory("All")}
              >
                Switch to All categories
              </button>
              <button
                type="button"
                className="action-btn ghost"
                onClick={() => setSize(10)}
              >
                Try 10 topics
              </button>
            </div>
          </div>
        </section>
      )}

      <p className="footer-note">
        Starter Knowledge Pack uses a built-in dataset. An AI-powered generator
        will replace this in a later release.
      </p>
    </div>
  );
}
