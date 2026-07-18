import { useState } from "react";
import {
  generateTopics,
  PACKAGE_SIZES,
  type PackageSize,
} from "./lib/generateTopics";
import { CATEGORIES, CATEGORY_COUNTS, type Category, type Topic } from "./data/topics";

type CategoryFilter = Category | "All";

export default function App() {
  const [size, setSize] = useState<PackageSize>(25);
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [message, setMessage] = useState<{ kind: "error" | "warning"; text: string } | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  const handleGenerate = () => {
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

  return (
    <div className="app">
      <header className="header">
        <h1>Starter Knowledge Pack</h1>
        <p>Generate a curated set of textile, fashion, and innerwear topics.</p>
        <span className="badge">
          <span className="dot" />
          Built-in dataset · {CATEGORY_COUNTS.Textile + CATEGORY_COUNTS.Fashion + CATEGORY_COUNTS.Innerwear} topics · No API key required
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
                {CATEGORY_COUNTS.Textile + CATEGORY_COUNTS.Fashion + CATEGORY_COUNTS.Innerwear} topics
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

        <button type="button" className="generate-btn" onClick={handleGenerate}>
          Generate {size} topics
        </button>

        {message && (
          <div className={`message ${message.kind}`}>
            <span className="icon">{message.kind === "warning" ? "⚠" : "✕"}</span>
            <span>{message.text}</span>
          </div>
        )}
      </section>

      {hasGenerated && topics.length > 0 && (
        <>
          <div className="results-header">
            <h2>Generated topics</h2>
            <span className="count">
              {topics.length} of {category === "All" ? "all" : category} · {size} requested
            </span>
          </div>
          <div className="topic-list">
            {topics.map((t, i) => (
              <article key={t.id} className="topic">
                <span className="num">{i + 1}</span>
                <div className="body">
                  <p className="title">{t.title}</p>
                  <div className="meta">
                    <span className={`cat-pill ${t.category}`}>{t.category}</span>
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
        </>
      )}

      {hasGenerated && topics.length === 0 && !message && (
        <div className="empty-state">
          <div className="big">∅</div>
          <p>No topics to display.</p>
        </div>
      )}

      <p className="footer-note">
        Starter Knowledge Pack uses a built-in dataset. An AI-powered generator will replace this in a later release.
      </p>
    </div>
  );
}
