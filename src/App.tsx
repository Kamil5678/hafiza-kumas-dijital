import { useState, useEffect, useRef } from "react";
import {
  fetchRoots,
  fetchChildren,
  fetchNode,
  fetchPath,
  fetchAllLessons,
  fetchCachedSlugs,
  type ContentNode,
} from "./lib/supabase";
import { generateLesson } from "./lib/lesson";
import LessonView from "./components/LessonView";

type View =
  | { name: "dashboard" }
  | { name: "module"; slug: string }
  | { name: "lesson"; slug: string };

interface GenStatus {
  total: number;
  cached: number;
  remaining: number;
  generating: boolean;
  current: string | null;
  currentTitle: string | null;
  progress: number;
  errors: string[];
}

export default function App() {
  const [view, setView] = useState<View>({ name: "dashboard" });
  const [roots, setRoots] = useState<ContentNode[]>([]);
  const [moduleChildren, setModuleChildren] = useState<ContentNode[]>([]);
  const [lessonNode, setLessonNode] = useState<ContentNode | null>(null);
  const [path, setPath] = useState<ContentNode[]>([]);
  const [genStatus, setGenStatus] = useState<GenStatus>({
    total: 0,
    cached: 0,
    remaining: 0,
    generating: false,
    current: null,
    currentTitle: null,
    progress: 0,
    errors: [],
  });
  const [allLessons, setAllLessons] = useState<ContentNode[]>([]);
  const genAbortRef = useRef(false);

  // Load roots + generation status on mount
  useEffect(() => {
    (async () => {
      const r = await fetchRoots();
      setRoots(r);
      await refreshGenStatus();
    })();
  }, []);

  const refreshGenStatus = async () => {
    const [lessons, cachedSlugs] = await Promise.all([fetchAllLessons(), fetchCachedSlugs()]);
    setAllLessons(lessons);
    const cachedCount = lessons.filter((l) => cachedSlugs.has(l.slug)).length;
    setGenStatus((prev) => ({
      ...prev,
      total: lessons.length,
      cached: cachedCount,
      remaining: lessons.length - cachedCount,
      progress: lessons.length > 0 ? Math.round((cachedCount / lessons.length) * 100) : 0,
    }));
  };

  // Generate all lessons sequentially
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
      setGenStatus((prev) => ({
        ...prev,
        current: lesson.slug,
        currentTitle: lesson.title,
      }));
      try {
        await generateLesson(lesson.slug, "intermediate", false);
        completed++;
      } catch (e: any) {
        errors.push(`${lesson.title}: ${e.message}`);
      }
      setGenStatus((prev) => ({
        ...prev,
        cached: completed,
        remaining: prev.total - completed,
        progress: Math.round((completed / prev.total) * 100),
        errors,
      }));
    }

    setGenStatus((prev) => ({
      ...prev,
      generating: false,
      current: null,
      currentTitle: null,
    }));
    await refreshGenStatus();
  };

  const handleStopGeneration = () => {
    genAbortRef.current = true;
  };

  // Regenerate single lesson (admin)
  const handleRegenerate = async (slug: string) => {
    await generateLesson(slug, "intermediate", true);
  };

  // Navigation
  const openModule = async (slug: string) => {
    const node = await fetchNode(slug);
    if (!node) return;
    const children = await fetchChildren(node.id);
    setModuleChildren(children);
    const p = await fetchPath(slug);
    setPath(p);
    setView({ name: "module", slug });
  };

  const openLesson = async (slug: string) => {
    const node = await fetchNode(slug);
    if (!node) return;
    setLessonNode(node);
    const p = await fetchPath(slug);
    setPath(p);
    setView({ name: "lesson", slug });
  };

  const handleNavigate = (slug: string) => {
    openLesson(slug);
  };

  const backToModule = () => {
    if (path.length >= 2) {
      const moduleNode = path[0];
      openModule(moduleNode.slug);
    } else {
      setView({ name: "dashboard" });
    }
  };

  const backToDashboard = () => {
    setView({ name: "dashboard" });
  };

  // ─── Dashboard View ─────────────────────────────────────────
  if (view.name === "dashboard") {
    const allGenerated = genStatus.remaining === 0 && genStatus.total > 0;
    return (
      <div className="app">
        <header className="app-header">
          <div className="header-content">
            <h1 className="app-title">Tekstil Bilgi İşletim Sistemi</h1>
            <p className="app-subtitle">Merkezi AI İçerik Motoru</p>
          </div>
        </header>

        <main className="main-content">
          {/* Generation Status Panel */}
          <div className={`gen-panel ${allGenerated ? "complete" : ""} ${genStatus.generating ? "active" : ""}`}>
            <div className="gen-panel-header">
              <h2>İçerik Üretim Durumu</h2>
              <div className="gen-stats">
                <span className="gen-stat">
                  <strong>{genStatus.cached}</strong> / {genStatus.total} ders hazır
                </span>
              </div>
            </div>

            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${genStatus.progress}%` }} />
              <span className="progress-label">{genStatus.progress}%</span>
            </div>

            {genStatus.generating && (
              <div className="gen-active-info">
                <div className="spinner small" />
                <p>
                  Üretiliyor: <strong>{genStatus.currentTitle}</strong>
                </p>
                <span className="gen-remaining">Kalan: {genStatus.remaining} ders</span>
              </div>
            )}

            {genStatus.errors.length > 0 && (
              <div className="gen-errors">
                <p>Hatalar ({genStatus.errors.length}):</p>
                <ul>
                  {genStatus.errors.slice(-5).map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="gen-actions">
              {!genStatus.generating && genStatus.remaining > 0 && (
                <button className="btn btn-primary btn-large" onClick={handleGenerateAll}>
                  {genStatus.cached > 0 ? `Üretmeye Devam Et (${genStatus.remaining} ders)` : `Tüm İçeriği Üret (${genStatus.total} ders)`}
                </button>
              )}
              {genStatus.generating && (
                <button className="btn btn-danger" onClick={handleStopGeneration}>
                  Üretimi Durdur
                </button>
              )}
              {allGenerated && !genStatus.generating && (
                <div className="gen-complete-msg">
                  <span className="check-icon">✓</span>
                  <p>Tüm ders içerikleri hazır. Dersleri açtığınızda anında yüklenecektir.</p>
                </div>
              )}
            </div>
          </div>

          {/* Modules Grid */}
          <div className="modules-section">
            <h2 className="section-heading">Modüller</h2>
            <div className="modules-grid">
              {roots.map((m) => (
                <button key={m.id} className="module-card" onClick={() => openModule(m.slug)}>
                  <div className="module-card-icon">
                    {moduleIcon(m.slug)}
                  </div>
                  <h3 className="module-card-title">{m.title}</h3>
                  {m.description && <p className="module-card-desc">{m.description}</p>}
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ─── Module View ─────────────────────────────────────────────
  if (view.name === "module") {
    return (
      <div className="app">
        <header className="app-header">
          <div className="header-content">
            <button className="btn btn-ghost back-btn" onClick={backToDashboard}>
              ← Panele Dön
            </button>
            <nav className="breadcrumbs">
              {path.map((n, i) => (
                <span key={n.id} className="breadcrumb-item">
                  {i > 0 && <span className="breadcrumb-sep">/</span>}
                  {n.title}
                </span>
              ))}
            </nav>
          </div>
        </header>

        <main className="main-content">
          <div className="module-header">
            <h1 className="page-title">{path[0]?.title}</h1>
            {path[0]?.description && <p className="page-desc">{path[0].description}</p>}
          </div>

          <NodeTree
            nodes={moduleChildren}
            level={0}
            onOpenLesson={openLesson}
            onOpenSubmodule={() => {}}
          />
        </main>
      </div>
    );
  }

  // ─── Lesson View ─────────────────────────────────────────────
  if (view.name === "lesson" && lessonNode) {
    return (
      <div className="app">
        <header className="app-header">
          <div className="header-content">
            <button className="btn btn-ghost back-btn" onClick={backToDashboard}>
              ← Panele Dön
            </button>
            <nav className="breadcrumbs">
              {path.map((n, i) => (
                <span key={n.id} className="breadcrumb-item">
                  {i > 0 && <span className="breadcrumb-sep">/</span>}
                  {n.title}
                </span>
              ))}
            </nav>
          </div>
        </header>

        <main className="main-content">
          <LessonView
            node={lessonNode}
            onNavigate={handleNavigate}
            onBackToModule={backToModule}
            onBackToDashboard={backToDashboard}
            onRegenerate={handleRegenerate}
          />
        </main>
      </div>
    );
  }

  return null;
}

// ─── Node Tree (recursive) ─────────────────────────────────────
function NodeTree({
  nodes,
  level,
  onOpenLesson,
  onOpenSubmodule,
}: {
  nodes: ContentNode[];
  level: number;
  onOpenLesson: (slug: string) => void;
  onOpenSubmodule: (slug: string) => void;
}) {
  return (
    <div className={`node-tree level-${level}`}>
      {nodes.map((node) => (
        <NodeTreeItem key={node.id} node={node} level={level} onOpenLesson={onOpenLesson} onOpenSubmodule={onOpenSubmodule} />
      ))}
    </div>
  );
}

function NodeTreeItem({
  node,
  level,
  onOpenLesson,
  onOpenSubmodule,
}: {
  node: ContentNode;
  level: number;
  onOpenLesson: (slug: string) => void;
  onOpenSubmodule: (slug: string) => void;
}) {
  const [children, setChildren] = useState<ContentNode[]>([]);
  const [expanded, setExpanded] = useState(false);

  const toggle = async () => {
    if (!expanded && children.length === 0 && node.type !== "lesson") {
      const c = await fetchChildren(node.id);
      setChildren(c);
    }
    setExpanded(!expanded);
  };

  if (node.type === "lesson") {
    return (
      <button className="node-item lesson-item" onClick={() => onOpenLesson(node.slug)}>
        <span className="node-icon">📄</span>
        <span className="node-title">{node.title}</span>
      </button>
    );
  }

  return (
    <div className="node-branch">
      <button className="node-item branch-item" onClick={toggle}>
        <span className="node-icon">{expanded ? "▼" : "▶"}</span>
        <span className="node-type-badge">{node.type}</span>
        <span className="node-title">{node.title}</span>
      </button>
      {expanded && children.length > 0 && (
        <NodeTree nodes={children} level={level + 1} onOpenLesson={onOpenLesson} onOpenSubmodule={onOpenSubmodule} />
      )}
    </div>
  );
}

function moduleIcon(slug: string): string {
  const icons: Record<string, string> = {
    "tekstil-bilgileri": "🧵",
    "moda-bilgileri": "👗",
    "ic-giyim": "👕",
    "surdurulebilirlik": "♻️",
    "strateji": "📊",
    "istatistik": "📈",
    "elise-studio": "🎨",
    "bilgi-bankasi": "📚",
  };
  return icons[slug] || "📦";
}
