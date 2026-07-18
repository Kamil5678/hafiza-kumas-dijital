import { useState, useEffect, useRef } from "react";
import {
  fetchRoots, fetchChildren, fetchNode, fetchPath,
  fetchAllLessons, fetchCachedSlugs, type ContentNode,
} from "./lib/supabase";
import { generateLesson } from "./lib/lesson";
import LessonView from "./components/LessonView";

type View = { name: "dashboard" } | { name: "module"; slug: string } | { name: "lesson"; slug: string };

interface GenStatus {
  total: number; cached: number; remaining: number; generating: boolean;
  currentTitle: string | null; progress: number; errors: string[];
}

/* ── Elisé cherry-bra SVG logo (high-contrast cream lines on dark cherry) ── */
function EliseLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Elisé"
    >
      {/* stems — cream, thick, rounded */}
      <path d="M50 30 C50 18, 62 10, 70 6" stroke="#EDE8E4" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M50 30 C50 18, 38 10, 30 6" stroke="#EDE8E4" strokeWidth="5" strokeLinecap="round" fill="none" />
      {/* leaf — cream */}
      <ellipse cx="70" cy="6" rx="8" ry="4.5" fill="#EDE8E4" transform="rotate(-18 70 6)" />
      {/* left cherry body — dark cherry */}
      <path d="M50 32 C40 32, 14 34, 14 56 C14 74, 28 84, 42 82 C50 80, 50 68, 50 62 Z" fill="#6B1020" />
      {/* right cherry body — dark cherry */}
      <path d="M50 32 C60 32, 86 34, 86 56 C86 74, 72 84, 58 82 C50 80, 50 68, 50 62 Z" fill="#6B1020" />
      {/* cream outlines on cherry bodies for contrast */}
      <path d="M50 32 C40 32, 14 34, 14 56 C14 74, 28 84, 42 82 C50 80, 50 68, 50 62" stroke="#EDE8E4" strokeWidth="3" fill="none" strokeLinejoin="round" />
      <path d="M50 32 C60 32, 86 34, 86 56 C86 74, 72 84, 58 82 C50 80, 50 68, 50 62" stroke="#EDE8E4" strokeWidth="3" fill="none" strokeLinejoin="round" />
      {/* center seam between cherries — cream */}
      <path d="M50 32 C50 32, 50 48, 50 62" stroke="#EDE8E4" strokeWidth="3.5" strokeLinecap="round" />
      {/* small highlight dots for depth */}
      <circle cx="28" cy="50" r="3" fill="#EDE8E4" opacity="0.35" />
      <circle cx="72" cy="50" r="3" fill="#EDE8E4" opacity="0.35" />
    </svg>
  );
}

export default function App() {
  const [view, setView] = useState<View>({ name: "dashboard" });
  const [roots, setRoots] = useState<ContentNode[]>([]);
  const [moduleChildren, setModuleChildren] = useState<ContentNode[]>([]);
  const [lessonNode, setLessonNode] = useState<ContentNode | null>(null);
  const [path, setPath] = useState<ContentNode[]>([]);
  const [genStatus, setGenStatus] = useState<GenStatus>({
    total: 0, cached: 0, remaining: 0, generating: false, currentTitle: null, progress: 0, errors: [],
  });
  const [allLessons, setAllLessons] = useState<ContentNode[]>([]);
  const [genExpanded, setGenExpanded] = useState(false);
  const genAbortRef = useRef(false);

  useEffect(() => {
    (async () => { setRoots(await fetchRoots()); await refreshGenStatus(); })();
  }, []);

  const refreshGenStatus = async () => {
    const [lessons, cachedSlugs] = await Promise.all([fetchAllLessons(), fetchCachedSlugs()]);
    setAllLessons(lessons);
    const cachedCount = lessons.filter((l) => cachedSlugs.has(l.slug)).length;
    setGenStatus((prev) => ({
      ...prev, total: lessons.length, cached: cachedCount,
      remaining: lessons.length - cachedCount,
      progress: lessons.length > 0 ? Math.round((cachedCount / lessons.length) * 100) : 0,
    }));
  };

  const handleGenerateAll = async () => {
    if (genStatus.generating) return;
    genAbortRef.current = false;
    setGenStatus((prev) => ({ ...prev, generating: true, errors: [] }));
    const cachedSlugs = await fetchCachedSlugs();
    const toGenerate = allLessons.filter((l) => !cachedSlugs.has(l.slug));
    let completed = genStatus.cached;
    const errors: string[] = [];
    for (const lesson of toGenerate) {
      if (genAbortRef.current) break;
      setGenStatus((prev) => ({ ...prev, currentTitle: lesson.title }));
      try { await generateLesson(lesson.slug, "intermediate", false); completed++; }
      catch (e: any) { errors.push(`${lesson.title}: ${e.message}`); }
      setGenStatus((prev) => ({
        ...prev, cached: completed, remaining: prev.total - completed,
        progress: Math.round((completed / prev.total) * 100), errors,
      }));
    }
    setGenStatus((prev) => ({ ...prev, generating: false, currentTitle: null }));
    await refreshGenStatus();
  };

  const handleStopGeneration = () => { genAbortRef.current = true; };
  const handleRegenerate = async (slug: string) => { await generateLesson(slug, "intermediate", true); };

  const openModule = async (slug: string) => {
    const node = await fetchNode(slug);
    if (!node) return;
    setModuleChildren(await fetchChildren(node.id));
    setPath(await fetchPath(slug));
    setView({ name: "module", slug });
  };

  const openLesson = async (slug: string) => {
    const node = await fetchNode(slug);
    if (!node) return;
    setLessonNode(node);
    setPath(await fetchPath(slug));
    setView({ name: "lesson", slug });
  };

  const backToModule = () => path.length >= 2 ? openModule(path[0].slug) : setView({ name: "dashboard" });
  const backToDashboard = () => setView({ name: "dashboard" });
  const allGenerated = genStatus.remaining === 0 && genStatus.total > 0;

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <button className="brand" onClick={backToDashboard}>
            <EliseLogo size={30} />
            <span className="brand-text">Elisé</span>
            <span className="brand-sub">Fashion OS</span>
          </button>
          {view.name !== "dashboard" && path.length > 0 && (
            <nav className="crumbs">
              {path.map((n, i) => (
                <span key={n.id} className="crumb">
                  {i > 0 && <span className="crumb-sep">·</span>}
                  <button className="crumb-link"
                    onClick={() => { if (i === 0) openModule(n.slug); else if (n.type === "lesson") openLesson(n.slug); else openModule(path[0].slug); }}>
                    {n.title}
                  </button>
                </span>
              ))}
            </nav>
          )}
        </div>
      </header>

      <main className="content">
        {view.name === "dashboard" && (
          <div className="dashboard">
            <div className="hero">
              <div className="hero-logo"><EliseLogo size={64} /></div>
              <h1 className="hero-title">Elisé Fashion OS</h1>
              <p className="hero-sub">Tekstil ve moda sektörü için merkezi içerik platformu</p>
            </div>
            <section className="modules">
              <h2 className="modules-label">Modüller</h2>
              <div className="module-list">
                {roots.map((m) => (
                  <button key={m.id} className="module-item" onClick={() => openModule(m.slug)}>
                    <span className="module-num">{moduleIcon(m.slug)}</span>
                    <div className="module-meta">
                      <span className="module-name">{m.title}</span>
                      {m.description && <span className="module-desc">{m.description}</span>}
                    </div>
                    <span className="module-arrow">→</span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {view.name === "module" && (
          <div className="module-page">
            <div className="page-head">
              <h1 className="page-title">{path[0]?.title}</h1>
              {path[0]?.description && <p className="page-desc">{path[0].description}</p>}
            </div>
            <NodeTree nodes={moduleChildren} level={0} onOpenLesson={openLesson} />
          </div>
        )}

        {view.name === "lesson" && lessonNode && (
          <LessonView node={lessonNode} onNavigate={openLesson} onBackToModule={backToModule} onBackToDashboard={backToDashboard} onRegenerate={handleRegenerate} />
        )}
      </main>

      <div className={`gen-bar ${genExpanded ? "expanded" : ""} ${genStatus.generating ? "active" : ""} ${allGenerated ? "done" : ""}`}>
        <button className="gen-bar-toggle" onClick={() => setGenExpanded(!genExpanded)}>
          <div className="gen-bar-info">
            {genStatus.generating ? (
              <><span className="gen-dot pulse" /><span className="gen-bar-text">Üretiliyor: <strong>{genStatus.currentTitle}</strong></span><span className="gen-bar-count">{genStatus.remaining} kaldı</span></>
            ) : allGenerated ? (
              <><span className="gen-dot done" /><span className="gen-bar-text">Tüm içerik hazır</span></>
            ) : (
              <><span className="gen-dot" /><span className="gen-bar-text">{genStatus.cached} / {genStatus.total} ders hazır</span></>
            )}
          </div>
          <span className="gen-bar-pct">{genStatus.progress}%</span>
        </button>
        <div className="gen-bar-track"><div className="gen-bar-fill" style={{ width: `${genStatus.progress}%` }} /></div>
        {genExpanded && (
          <div className="gen-bar-detail">
            {genStatus.errors.length > 0 && (
              <div className="gen-bar-errors">
                <span className="gen-bar-errors-label">Hatalar ({genStatus.errors.length}):</span>
                <ul>{genStatus.errors.slice(-3).map((e, i) => <li key={i}>{e}</li>)}</ul>
              </div>
            )}
            <div className="gen-bar-actions">
              {!genStatus.generating && genStatus.remaining > 0 && (
                <button className="gen-btn primary" onClick={handleGenerateAll}>
                  {genStatus.cached > 0 ? `Üretmeye Devam Et (${genStatus.remaining})` : `Tüm İçeriği Üret (${genStatus.total})`}
                </button>
              )}
              {genStatus.generating && <button className="gen-btn stop" onClick={handleStopGeneration}>Durdur</button>}
              {allGenerated && !genStatus.generating && <span className="gen-bar-done-msg">Dersler açıldığında anında yüklenecektir.</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NodeTree({ nodes, level, onOpenLesson }: { nodes: ContentNode[]; level: number; onOpenLesson: (slug: string) => void }) {
  return (
    <div className={`tree level-${level}`}>
      {nodes.map((node) => <NodeTreeItem key={node.id} node={node} level={level} onOpenLesson={onOpenLesson} />)}
    </div>
  );
}

function NodeTreeItem({ node, level, onOpenLesson }: { node: ContentNode; level: number; onOpenLesson: (slug: string) => void }) {
  const [children, setChildren] = useState<ContentNode[]>([]);
  const [expanded, setExpanded] = useState(false);

  const toggle = async () => {
    if (!expanded && children.length === 0 && node.type !== "lesson") setChildren(await fetchChildren(node.id));
    setExpanded(!expanded);
  };

  if (node.type === "lesson") {
    return (
      <button className="tree-item lesson" onClick={() => onOpenLesson(node.slug)}>
        <span className="tree-leaf" />
        <span className="tree-text">{node.title}</span>
      </button>
    );
  }

  return (
    <div className="tree-branch">
      <button className="tree-item branch" onClick={toggle}>
        <span className="tree-toggle">{expanded ? "−" : "+"}</span>
        <span className="tree-tag">{node.type}</span>
        <span className="tree-text">{node.title}</span>
      </button>
      {expanded && children.length > 0 && <NodeTree nodes={children} level={level + 1} onOpenLesson={onOpenLesson} />}
    </div>
  );
}

function moduleIcon(slug: string): string {
  const icons: Record<string, string> = {
    "tekstil-bilgileri": "01", "moda-bilgileri": "02", "ic-giyim": "03",
    surdurulebilirlik: "04", strateji: "05", istatistik: "06",
    "elise-studio": "07", "bilgi-bankasi": "08",
  };
  return icons[slug] || "·";
}
