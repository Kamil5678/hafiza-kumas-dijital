import { useState, useCallback, useEffect } from "react";
import { useNavigation, type Nav } from "./navigation";
import { NavButtons } from "./components/NavButtons";
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
type Toast = { kind: "success" | "error" | "warning"; text: string } | null;

const TOTAL_TOPICS =
  CATEGORY_COUNTS.Textile + CATEGORY_COUNTS.Fashion + CATEGORY_COUNTS.Innerwear;

export default function App() {
  const nav = useNavigation();

  return (
    <div className="app">
      {nav.current === "dashboard" && <Dashboard nav={nav} />}
      {nav.current === "skp" && <StarterKnowledgePack nav={nav} />}
      {nav.current === "generate" && <GenerateScreen nav={nav} />}
      {nav.current === "review" && <ReviewScreen nav={nav} />}
      {nav.current === "save-confirm" && <SaveConfirmScreen nav={nav} />}
      {nav.current === "saved" && <SavedScreen nav={nav} />}
      {nav.current === "plan" && <PlanScreen nav={nav} />}
    </div>
  );
}

function Dashboard({ nav }: { nav: Nav }) {
  const modules = [
    { id: "skp", icon: "✨", title: "Starter Knowledge Pack", desc: "Tekstil, moda ve iç giyim konularından rastgele paketler üretin" },
    { id: "skp", icon: "📊", title: "Trend Analytics", desc: "Sektör trendlerini analiz edin (yakında)" },
    { id: "skp", icon: "🏭", title: "Supply Chain Manager", desc: "Tedarik zincirinizi yönetin (yakında)" },
    { id: "skp", icon: "🧪", title: "Quality Lab", desc: "Kalite test süreçlerini takip edin (yakında)" },
    { id: "skp", icon: "📦", title: "Inventory", desc: "Stok yönetimi (yakında)" },
    { id: "skp", icon: "⚙️", title: "Settings", desc: "Sistem ayarları (yakında)" },
  ];

  return (
    <>
      <header className="header">
        <h1>Textile OS</h1>
        <p>Tekstil, moda ve iç giyim sektörü için tümleşik yönetim platformu</p>
      </header>

      <div className="menu-grid">
        {modules.map((m, i) => (
          <button
            key={i}
            type="button"
            className={`menu-card ${m.id === "skp" && i === 0 ? "primary" : ""}`}
            onClick={() => m.id === "skp" && i === 0 && nav.navigate("skp")}
          >
            <span className="menu-icon">{m.icon}</span>
            <span className="menu-title">{m.title}</span>
            <span className="menu-desc">{m.desc}</span>
          </button>
        ))}
      </div>
    </>
  );
}

function StarterKnowledgePack({ nav }: { nav: Nav }) {
  return (
    <>
      <NavButtons nav={nav} backLabel="Geri" />
      <header className="header">
        <h1>Starter Knowledge Pack</h1>
        <p>
          {TOTAL_TOPICS} hazır konudan rastgele paketler oluşturun, kaydedin ve
          günlük plana dağıtın.
        </p>
        <span className="badge">
          <span className="dot" />
          Built-in dataset · {TOTAL_TOPICS} topics · No API key required
        </span>
      </header>

      <div className="menu-grid">
        <button
          type="button"
          className="menu-card primary"
          onClick={() => nav.navigate("generate")}
        >
          <span className="menu-icon">✨</span>
          <span className="menu-title">Konu Üret</span>
          <span className="menu-desc">
            Kategori ve paket boyutu seçerek rastgele konular üretin
          </span>
        </button>

        <button
          type="button"
          className="menu-card"
          onClick={() => nav.navigate("saved")}
        >
          <span className="menu-icon">💾</span>
          <span className="menu-title">Kaydedilen Paketler</span>
          <span className="menu-desc">
            Daha önce kaydettiğiniz konu paketlerini görün
          </span>
        </button>

        <button
          type="button"
          className="menu-card"
          onClick={() => nav.navigate("plan")}
        >
          <span className="menu-icon">📅</span>
          <span className="menu-title">Günlük Plan</span>
          <span className="menu-desc">Konularınızı günlük çalışma planına dağıtın</span>
        </button>
      </div>
    </>
  );
}

const skpState = {
  size: 25 as PackageSize,
  category: "All" as CategoryFilter,
  topics: [] as Topic[],
  message: null as { kind: "error" | "warning"; text: string } | null,
  toast: null as Toast,
  busy: null as "save" | "distribute" | null,
  savedPackages: [] as SavedPackageRow[],
  savedError: null as string | null,
};

function GenerateScreen({ nav }: { nav: Nav }) {
  const [size, setSize] = useState<PackageSize>(skpState.size);
  const [category, setCategory] = useState<CategoryFilter>(skpState.category);

  const handleGenerate = useCallback(() => {
    skpState.size = size;
    skpState.category = category;
    skpState.toast = null;
    const result = generateTopics(size, category);
    if (!result.ok) {
      skpState.topics = [];
      skpState.message = {
        kind: result.message && result.message.includes("only") ? "warning" : "error",
        text: result.message ?? "Unable to generate topics.",
      };
    } else {
      skpState.topics = result.topics;
      skpState.message = null;
    }
    nav.navigate("review");
  }, [size, category, nav]);

  return (
    <>
      <NavButtons nav={nav} backLabel="Starter Knowledge Pack" />
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

        <button type="button" className="generate-btn" onClick={handleGenerate}>
          {size} Konu Üret
        </button>
      </section>
    </>
  );
}

function ReviewScreen({ nav }: { nav: Nav }) {
  const [toast, setToast] = useState<Toast>(skpState.toast);
  const [busy, setBusy] = useState<"save" | "distribute" | null>(skpState.busy);

  const topics = skpState.topics;
  const message = skpState.message;
  const hasTopics = topics.length > 0;

  const handleSave = async () => {
    if (topics.length === 0) return;
    setBusy("save");
    setToast(null);
    const res = await savePackage(topics, skpState.category);
    setToast({ kind: res.ok ? "success" : "error", text: res.message });
    skpState.toast = { kind: res.ok ? "success" : "error", text: res.message };
    setBusy(null);
    if (res.ok) {
      nav.navigate("save-confirm");
    }
  };

  const handleDistribute = async () => {
    if (topics.length === 0) return;
    setBusy("distribute");
    setToast(null);
    const res = await distributeToDailyPlan(topics, skpState.category);
    setToast({ kind: res.ok ? "success" : "error", text: res.message });
    skpState.toast = { kind: res.ok ? "success" : "error", text: res.message };
    setBusy(null);
  };

  const handleRegenerate = () => {
    setToast(null);
    skpState.toast = null;
    const result = generateTopics(skpState.size, skpState.category);
    if (!result.ok) {
      skpState.topics = [];
      skpState.message = {
        kind: result.message && result.message.includes("only") ? "warning" : "error",
        text: result.message ?? "Unable to generate topics.",
      };
    } else {
      skpState.topics = result.topics;
      skpState.message = null;
    }
    setToast(null);
  };

  return (
    <>
      <NavButtons nav={nav} backLabel="Konu Üret" />
      <section className="results-section">
        <div className="results-header">
          <h2>{hasTopics ? "Üretilen Konular" : "Sonuç"}</h2>
          {hasTopics && (
            <span className="count">
              {topics.length} konu · {skpState.category === "All" ? "Tümü" : skpState.category} ·{" "}
              {skpState.size} istendi
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
              <button
                type="button"
                className="action-btn primary"
                onClick={() => {
                  skpState.category = "All";
                  handleRegenerate();
                }}
              >
                Tüm kategorilere geç
              </button>
              <button
                type="button"
                className="action-btn ghost"
                onClick={() => {
                  skpState.size = 10;
                  handleRegenerate();
                }}
              >
                10 konu dene
              </button>
              <button
                type="button"
                className="action-btn ghost"
                onClick={handleRegenerate}
              >
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
                onClick={handleSave}
                disabled={busy !== null}
              >
                {busy === "save" ? "Kaydediliyor…" : "Konuları Kaydet"}
              </button>
              <button
                type="button"
                className="action-btn accent"
                onClick={handleDistribute}
                disabled={busy !== null}
              >
                {busy === "distribute" ? "Dağıtılıyor…" : "Günlük Planla"}
              </button>
              <button
                type="button"
                className="action-btn ghost"
                onClick={handleRegenerate}
                disabled={busy !== null}
              >
                Yeniden Üret
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
    </>
  );
}

function SaveConfirmScreen({ nav }: { nav: Nav }) {
  return (
    <>
      <NavButtons nav={nav} backLabel="Konular" />
      <section className="results-section">
        <div className="insufficient success-card">
          <div className="insufficient-icon success">✓</div>
          <h2>Paket Kaydedildi</h2>
          <p>
            Konularınız başarıyla kaydedildi. Kaydedilen paketlerinizi görüntülemek
            için aşağıdaki butonu kullanın veya ana panoya dönebilirsiniz.
          </p>
          <div className="insufficient-actions">
            <button
              type="button"
              className="action-btn primary"
              onClick={() => nav.navigate("saved")}
            >
              Kaydedilen Paketleri Gör
            </button>
            <button
              type="button"
              className="action-btn ghost"
              onClick={nav.home}
            >
              Ana Panoya Dön
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

function SavedScreen({ nav }: { nav: Nav }) {
  const [packages, setPackages] = useState<SavedPackageRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetchSavedPackages();
    if (res.ok) {
      setPackages(res.packages);
    } else {
      setError(res.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <NavButtons nav={nav} backLabel="Starter Knowledge Pack" />
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
              <button type="button" className="action-btn primary" onClick={load}>
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
    </>
  );
}

function PlanScreen({ nav }: { nav: Nav }) {
  return (
    <>
      <NavButtons nav={nav} backLabel="Starter Knowledge Pack" />
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
    </>
  );
}
