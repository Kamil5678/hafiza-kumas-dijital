import { useState, useCallback } from "react";
import {
  generateTopics,
  PACKAGE_SIZES,
  type PackageSize,
} from "./lib/generateTopics";
import {
  savePackage,
  distributeToDailyPlan,
  fetchSavedPackages,
  type SavedPackageRow,
} from "./lib/persistence";
import {
  CATEGORIES,
  CATEGORY_COUNTS,
  type Category,
  type Topic,
} from "./data/topics";

type CategoryFilter = Category | "All";
type View = "menu" | "generate" | "results" | "saved" | "plan";

type Toast = { kind: "success" | "error" | "warning"; text: string } | null;

const TOTAL_TOPICS =
  CATEGORY_COUNTS.Textile + CATEGORY_COUNTS.Fashion + CATEGORY_COUNTS.Innerwear;

export default function App() {
  const [view, setView] = useState<View>("menu");
  const [size, setSize] = useState<PackageSize>(25);
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [message, setMessage] = useState<{
    kind: "error" | "warning";
    text: string;
  } | null>(null);
  const [toast, setToast] = useState<Toast>(null);
  const [busy, setBusy] = useState<"save" | "distribute" | null>(null);
  const [savedPackages, setSavedPackages] = useState<SavedPackageRow[]>([]);
  const [savedError, setSavedError] = useState<string | null>(null);

  const goMenu = useCallback(() => {
    setView("menu");
    setToast(null);
    setMessage(null);
  }, []);

  const handleGenerate = useCallback(() => {
    setToast(null);
    const result = generateTopics(size, category);
    if (!result.ok) {
      setTopics([]);
      setMessage({
        kind: result.message && result.message.includes("only") ? "warning" : "error",
        text: result.message ?? "Unable to generate topics.",
      });
      setView("results");
      return;
    }
    setTopics(result.topics);
    setMessage(null);
    setView("results");
  }, [size, category]);

  const handleSave = async () => {
    if (topics.length === 0) return;
    setBusy("save");
    setToast(null);
    const res = await savePackage(topics, category);
    setToast({ kind: res.ok ? "success" : "error", text: res.message });
    setBusy(null);
  };

  const handleDistribute = async () => {
    if (topics.length === 0) return;
    setBusy("distribute");
    setToast(null);
    const res = await distributeToDailyPlan(topics, category);
    setToast({ kind: res.ok ? "success" : "error", text: res.message });
    setBusy(null);
  };

  const loadSaved = useCallback(async () => {
    setView("saved");
    setSavedError(null);
    const res = await fetchSavedPackages();
    if (res.ok) {
      setSavedPackages(res.packages);
    } else {
      setSavedPackages([]);
      setSavedError(res.message);
    }
  }, []);

  const loadPlan = useCallback(() => {
    setView("plan");
    setToast(null);
  }, []);

  return (
    <div className="app">
      {view !== "menu" && (
        <button type="button" className="back-btn" onClick={goMenu}>
          ← Ana Menüye Dön
        </button>
      )}

      {view === "menu" && (
        <MenuView
          onGenerate={() => setView("generate")}
          onSaved={loadSaved}
          onPlan={loadPlan}
        />
      )}

      {view === "generate" && (
        <GenerateView
          size={size}
          setSize={setSize}
          category={category}
          setCategory={setCategory}
          onGenerate={handleGenerate}
        />
      )}

      {view === "results" && (
        <ResultsView
          topics={topics}
          size={size}
          category={category}
          message={message}
          toast={toast}
          busy={busy}
          onSave={handleSave}
          onDistribute={handleDistribute}
          onRegenerate={handleGenerate}
          onMenu={goMenu}
          onSwitchAll={() => setCategory("All")}
          onTrySmaller={() => setSize(10)}
        />
      )}

      {view === "saved" && (
        <SavedView
          packages={savedPackages}
          error={savedError}
          loading={false}
          onRetry={loadSaved}
        />
      )}

      {view === "plan" && <PlanView />}

      <p className="footer-note">
        Starter Knowledge Pack uses a built-in dataset of {TOTAL_TOPICS} topics.
        An AI-powered generator will replace this in a later release.
      </p>
    </div>
  );
}

function MenuView({
  onGenerate,
  onSaved,
  onPlan,
}: {
  onGenerate: () => void;
  onSaved: () => void;
  onPlan: () => void;
}) {
  return (
    <>
      <header className="header">
        <h1>Starter Knowledge Pack</h1>
        <p>
          Tekstil, moda ve iç giyim dünyasında {TOTAL_TOPICS} hazır konudan rastgele
          paketler oluşturun.
        </p>
        <span className="badge">
          <span className="dot" />
          Built-in dataset · {TOTAL_TOPICS} topics · No API key required
        </span>
      </header>

      <div className="menu-grid">
        <button type="button" className="menu-card primary" onClick={onGenerate}>
          <span className="menu-icon">✨</span>
          <span className="menu-title">Konu Üret</span>
          <span className="menu-desc">
            Kategori ve paket boyutu seçerek rastgele konular üretin
          </span>
        </button>

        <button type="button" className="menu-card" onClick={onSaved}>
          <span className="menu-icon">💾</span>
          <span className="menu-title">Kaydedilen Paketler</span>
          <span className="menu-desc">Daha önce kaydettiğiniz konu paketlerini görün</span>
        </button>

        <button type="button" className="menu-card" onClick={onPlan}>
          <span className="menu-icon">📅</span>
          <span className="menu-title">Günlük Plan</span>
          <span className="menu-desc">Konularınızı günlük çalışma planına dağıtın</span>
        </button>
      </div>
    </>
  );
}

function GenerateView({
  size,
  setSize,
  category,
  setCategory,
  onGenerate,
}: {
  size: PackageSize;
  setSize: (s: PackageSize) => void;
  category: CategoryFilter;
  setCategory: (c: CategoryFilter) => void;
  onGenerate: () => void;
}) {
  return (
    <section className="card">
      <h2 className="section-title">Konu Paketi Oluştur</h2>
      <p className="section-desc">
        Bir paket boyutu ve kategori seçin, ardından "Üret" butonuna basın.
      </p>

      <div className="field">
        <span className="label">Paket boyutu</span>
        <div className="options">
          {PACKAGE_SIZES.map((s) => (
            <button
              key={s}
              type="button"
              className={`option ${size === s ? "selected" : ""}`}
              onClick={() => setSize(s)}
            >
              {s}
              <span className="sub">konu</span>
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="label">Kategori</span>
        <div className="options options-category">
          <button
            type="button"
            className={`option ${category === "All" ? "selected" : ""}`}
            onClick={() => setCategory("All")}
          >
            Tümü
            <span className="sub">{TOTAL_TOPICS} konu</span>
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className={`option ${category === c ? "selected" : ""}`}
              onClick={() => setCategory(c)}
            >
              {c}
              <span className="sub">{CATEGORY_COUNTS[c]} konu</span>
            </button>
          ))}
        </div>
      </div>

      <button type="button" className="generate-btn" onClick={onGenerate}>
        {size} Konu Üret
      </button>
    </section>
  );
}

function ResultsView({
  topics,
  size,
  category,
  message,
  toast,
  busy,
  onSave,
  onDistribute,
  onRegenerate,
  onMenu,
  onSwitchAll,
  onTrySmaller,
}: {
  topics: Topic[];
  size: PackageSize;
  category: CategoryFilter;
  message: { kind: "error" | "warning"; text: string } | null;
  toast: Toast;
  busy: "save" | "distribute" | null;
  onSave: () => void;
  onDistribute: () => void;
  onRegenerate: () => void;
  onMenu: () => void;
  onSwitchAll: () => void;
  onTrySmaller: () => void;
}) {
  const hasTopics = topics.length > 0;

  return (
    <section className="results-section">
      <div className="results-header">
        <h2>{hasTopics ? "Üretilen Konular" : "Sonuç"}</h2>
        {hasTopics && (
          <span className="count">
            {topics.length} konu · {category === "All" ? "Tümü" : category} · {size}{" "}
            istendi
          </span>
        )}
      </div>

      {hasTopics && (
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
      )}

      {!hasTopics && message && (
        <div className="insufficient">
          <div className="insufficient-icon">⚠</div>
          <h2>Bu seçim için yeterli konu yok</h2>
          <p>{message.text}</p>
          <div className="insufficient-actions">
            <button type="button" className="action-btn primary" onClick={onSwitchAll}>
              Tüm kategorilere geç
            </button>
            <button
              type="button"
              className="action-btn ghost"
              onClick={onTrySmaller}
            >
              10 konu dene
            </button>
            <button type="button" className="action-btn ghost" onClick={onRegenerate}>
              Yeniden üret
            </button>
          </div>
        </div>
      )}

      {hasTopics && (
        <>
          <div className="actions">
            <button
              type="button"
              className="action-btn primary"
              onClick={onSave}
              disabled={busy !== null}
            >
              {busy === "save" ? "Kaydediliyor…" : "Konuları Kaydet"}
            </button>
            <button
              type="button"
              className="action-btn accent"
              onClick={onDistribute}
              disabled={busy !== null}
            >
              {busy === "distribute" ? "Dağıtılıyor…" : "Günlük Planla"}
            </button>
            <button
              type="button"
              className="action-btn ghost"
              onClick={onRegenerate}
              disabled={busy !== null}
            >
              Yeniden Üret
            </button>
          </div>

          <div className="actions-secondary">
            <button type="button" className="action-btn ghost" onClick={onMenu}>
              ← Ana Menüye Dön
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
        </>
      )}
    </section>
  );
}

function SavedView({
  packages,
  error,
  loading,
  onRetry,
}: {
  packages: SavedPackageRow[];
  error: string | null;
  loading: boolean;
  onRetry: () => void;
}) {
  return (
    <section className="results-section">
      <div className="results-header">
        <h2>Kaydedilen Paketler</h2>
      </div>

      {loading && <p className="muted">Yükleniyor…</p>}

      {error && !loading && (
        <div className="insufficient">
          <div className="insufficient-icon">✕</div>
          <h2>Paketler yüklenemedi</h2>
          <p>{error}</p>
          <div className="insufficient-actions">
            <button type="button" className="action-btn primary" onClick={onRetry}>
              Tekrar dene
            </button>
          </div>
        </div>
      )}

      {!loading && !error && packages.length === 0 && (
        <div className="insufficient">
          <div className="insufficient-icon">∅</div>
          <h2>Henüz kayıtlı paket yok</h2>
          <p>
            Konu ürettikten sonra "Konuları Kaydet" butonu ile paketlerinizi burada
            saklayabilirsiniz.
          </p>
        </div>
      )}

      {!loading && !error && packages.length > 0 && (
        <div className="topic-list">
          {packages.map((p) => (
            <article key={p.id} className="topic">
              <span className="num">{p.size}</span>
              <div className="body">
                <p className="title">{p.name}</p>
                <div className="meta">
                  <span className={`cat-pill ${p.category}`}>{p.category}</span>
                  <span className="tag">
                    {new Date(p.created_at).toLocaleDateString("en-GB")}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function PlanView() {
  return (
    <section className="results-section">
      <div className="results-header">
        <h2>Günlük Plan</h2>
      </div>
      <div className="insufficient">
        <div className="insufficient-icon">📅</div>
        <h2>Günlük plan nasıl oluşturulur?</h2>
        <p>
          1. <strong>"Konu Üret"</strong> ile bir paket oluşturun.
          <br />
          2. Sonuç ekranında <strong>"Günlük Planla"</strong> butonuna basın.
          <br />
          3. Sistem konularınızı bugünden başlayarak günlük çalışma planına
          dağıtır.
        </p>
      </div>
    </section>
  );
}
