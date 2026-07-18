import { useState, useEffect, useCallback } from "react";
import {
  fetchCachedLesson,
  fetchSiblings,
  type ContentNode,
} from "../lib/supabase";
import { fetchNotes, saveNote } from "../lib/lesson";

interface LessonContent {
  node_slug: string;
  node_title: string;
  difficulty: string;
  module: string;
  sections: Record<string, any>;
  quiz: any[];
  flashcards: any[];
  images: string[];
  generated_at: string;
}

interface Props {
  node: ContentNode;
  onNavigate: (slug: string) => void;
  onBackToModule: () => void;
  onBackToDashboard: () => void;
  onRegenerate: (slug: string) => Promise<void>;
}

type Tab = "content" | "visuals" | "quiz" | "flashcards" | "notes";

const TAB_LABELS: Record<Tab, string> = {
  content: "İçerik",
  visuals: "Görsel",
  quiz: "Quiz",
  flashcards: "Kartlar",
  notes: "Notlar",
};

const SECTION_ORDER = [
  "ogrenme_hedefleri", "giris", "tanim_ve_kavramlar", "tarihsel_gelisim",
  "temel_ilkeler", "siniflandirma", "teknik_parametreler", "malzemeler",
  "makine_ve_ekipmanlar", "uretim_sureci", "kalite_kontrol", "uygulama_alanlari",
  "avantajlar", "dezavantajlar", "standartlar_ve_normlar", "sik_yapilan_hatalar",
  "vaka_calismasi", "ozet", "terimler_sozlugu", "referanslar", "gorsel_sema",
];

function renderText(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="sc-highlight">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export default function LessonView({ node, onNavigate, onBackToModule, onBackToDashboard, onRegenerate }: Props) {
  const [content, setContent] = useState<LessonContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("content");
  const [siblings, setSiblings] = useState<ContentNode[]>([]);
  const [note, setNote] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const loadLesson = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cached = await fetchCachedLesson(node.slug);
      if (!cached) {
        setError("Bu ders için içerik henüz üretilmemiş. Panele dönüp içerik üretimini başlatın.");
        setLoading(false);
        return;
      }
      setContent(cached);
      const sibs = await fetchSiblings(node);
      setSiblings(sibs);
      const n = await fetchNotes(node.slug);
      setNote(n);
    } catch (e: any) {
      setError(e.message || "Ders yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [node.slug]);

  useEffect(() => { loadLesson(); }, [loadLesson]);

  const handleRegenerate = async () => {
    setRegenerating(true);
    setError(null);
    try {
      await onRegenerate(node.slug);
      await loadLesson();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRegenerating(false);
    }
  };

  const handleSaveNote = async () => {
    await saveNote(node.slug, note);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  };

  if (loading) return <div className="lv-loading"><div className="lv-spinner" /></div>;

  if (error) {
    return (
      <div className="lv-error">
        <p className="lv-error-text">{error}</p>
        <div className="lv-error-actions">
          <button className="lv-btn primary" onClick={handleRegenerate} disabled={regenerating}>
            {regenerating ? "Üretiliyor..." : "İçeriği Üret"}
          </button>
          <button className="lv-btn ghost" onClick={onBackToDashboard}>Panele Dön</button>
        </div>
      </div>
    );
  }

  if (!content) return null;

  const currentIndex = siblings.findIndex((s) => s.id === node.id);
  const prevLesson = currentIndex > 0 ? siblings[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : null;

  return (
    <div className="lv">
      <div className="lv-head">
        <div className="lv-head-meta">
          <span className="lv-module">{content.module.replace(/-/g, " ")}</span>
          <h1 className="lv-title">{content.node_title}</h1>
        </div>
        <button className="lv-regen" onClick={handleRegenerate} disabled={regenerating} title="Yönetici: İçeriği yeniden üret">
          {regenerating ? "···" : "↻"}
        </button>
      </div>

      <div className="lv-tabs">
        {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
          <button key={t} className={`lv-tab ${tab === t ? "on" : ""}`} onClick={() => setTab(t)}>
            {TAB_LABELS[t]}
            {t === "quiz" && content.quiz.length > 0 && <span className="lv-tab-ct">{content.quiz.length}</span>}
            {t === "flashcards" && content.flashcards.length > 0 && <span className="lv-tab-ct">{content.flashcards.length}</span>}
          </button>
        ))}
      </div>

      <div className="lv-body">
        {tab === "content" && <ContentTab sections={content.sections} />}
        {tab === "visuals" && <VisualsTab sections={content.sections} images={content.images || []} title={content.node_title} />}
        {tab === "quiz" && <QuizTab quiz={content.quiz} />}
        {tab === "flashcards" && <FlashcardsTab cards={content.flashcards} />}
        {tab === "notes" && <NotesTab note={note} setNote={setNote} onSave={handleSaveNote} saved={noteSaved} />}
      </div>

      <div className="lv-foot">
        <button className="lv-foot-btn" onClick={onBackToDashboard}>← Panel</button>
        <button className="lv-foot-btn" onClick={onBackToModule}>↑ Modül</button>
        <div className="lv-foot-spacer" />
        {prevLesson && <button className="lv-foot-btn" onClick={() => onNavigate(prevLesson.slug)}>← {prevLesson.title}</button>}
        {nextLesson && <button className="lv-foot-btn" onClick={() => onNavigate(nextLesson.slug)}>{nextLesson.title} →</button>}
      </div>
    </div>
  );
}

function ContentTab({ sections }: { sections: Record<string, any> }) {
  return (
    <div className="ct">
      {SECTION_ORDER.map((key) => {
        const s = sections[key];
        if (!s) return null;
        return <SectionCard key={key} section={s} />;
      })}
    </div>
  );
}

function SectionCard({ section }: { section: any }) {
  return (
    <div className="sc">
      <h3 className="sc-title">{section.title}</h3>
      <SectionBody section={section} />
    </div>
  );
}

function SectionBody({ section }: { section: any }) {
  if (section.type === "text") return <p className="sc-text">{renderText(section.content)}</p>;
  if (section.type === "list") {
    return (
      <ul className="sc-list">
        {section.items.map((item: string, i: number) => <li key={i}>{renderText(item)}</li>)}
      </ul>
    );
  }
  if (section.type === "table") {
    return (
      <div className="sc-table-wrap">
        <table className="sc-table">
          <thead>
            <tr>{section.headers.map((h: string, i: number) => <th key={i}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {section.rows.map((row: string[], i: number) => (
              <tr key={i}>{row.map((cell, j) => <td key={j}>{renderText(cell)}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (section.type === "glossary") {
    return (
      <dl className="sc-glossary">
        {section.items.map((item: any, i: number) => (
          <div key={i} className="sc-glossary-item">
            <dt>{item.term}</dt>
            <dd>{item.definition}</dd>
          </div>
        ))}
      </dl>
    );
  }
  if (section.type === "diagram") {
    return (
      <div className="sc-diagram">
        <div className="sc-diagram-box">
          <span className="sc-diagram-icon">▦</span>
          <p className="sc-diagram-prompt">{section.prompt}</p>
        </div>
        <p className="sc-diagram-caption">{section.caption}</p>
      </div>
    );
  }
  return null;
}

function VisualsTab({ sections, images, title }: { sections: Record<string, any>; images: string[]; title: string; }) {
  const diagram = sections["gorsel_sema"];
  return (
    <div className="vt">
      {images.length > 0 && (
        <div className="vt-gallery">
          {images.map((url, i) => (
            <div key={i} className="vt-image-card">
              <img src={url} alt={`${title} - görsel ${i + 1}`} loading="lazy" className="vt-image" />
            </div>
          ))}
        </div>
      )}
      {images.length === 0 && <div className="vt-empty"><p>Bu ders için görsel bulunmamaktadır.</p></div>}
      {diagram && (
        <div className="vt-card">
          <h3>{diagram.title}</h3>
          <div className="vt-diagram-box">
            <span className="sc-diagram-icon">▦</span>
            <p>{diagram.prompt}</p>
          </div>
          <p className="sc-diagram-caption">{diagram.caption}</p>
        </div>
      )}
    </div>
  );
}

function QuizTab({ quiz }: { quiz: any[] }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const score = quiz.reduce((acc, q, i) => acc + (answers[i] === q.correct_index ? 1 : 0), 0);

  if (quiz.length === 0) return <div className="qt-empty">Bu ders için quiz bulunmamaktadır.</div>;

  return (
    <div className="qt">
      {submitted && (
        <div className="qt-result">
          <span className="qt-result-score">{score} / {quiz.length}</span>
          <span className="qt-result-msg">
            {score >= quiz.length * 0.7 ? "Tebrikler!" : score >= quiz.length * 0.5 ? "İyi, tekrar etmek faydalı olur." : "Tekrar gözden geçirin."}
          </span>
          <button className="lv-btn primary sm" onClick={() => { setAnswers({}); setSubmitted(false); }}>Tekrar Dene</button>
        </div>
      )}
      {quiz.map((q, qi) => (
        <div key={qi} className="qt-card">
          <div className="qt-card-head">
            <span className="qt-type">{q.type_label}</span>
            <span className="qt-num">{qi + 1}</span>
          </div>
          <p className="qt-q">{q.question}</p>
          <div className="qt-opts">
            {q.options.map((opt: string, oi: number) => {
              const sel = answers[qi] === oi;
              const correct = q.correct_index === oi;
              const showRes = submitted && sel;
              const showCor = submitted && correct;
              return (
                <button key={oi}
                  className={`qt-opt ${sel ? "sel" : ""} ${showRes ? (correct ? "cor" : "inc") : ""} ${showCor ? "cor" : ""}`}
                  onClick={() => !submitted && setAnswers({ ...answers, [qi]: oi })}
                  disabled={submitted}
                >
                  <span>{opt}</span>
                  {showCor && <span className="qt-mark">✓</span>}
                  {showRes && !correct && <span className="qt-mark">✗</span>}
                </button>
              );
            })}
          </div>
          {submitted && (
            <div className="qt-exp">
              <p className="qt-exp-main">{q.explanation}</p>
              <details className="qt-exp-detail">
                <summary>Seçenek açıklamaları</summary>
                <ul>
                  {q.options.map((opt: string, oi: number) => (
                    <li key={oi} className={oi === q.correct_index ? "ok" : "no"}>
                      <strong>{opt}: </strong>{q.explanations[oi]}
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          )}
        </div>
      ))}
      {!submitted && <button className="lv-btn primary block" onClick={() => setSubmitted(true)}>Cevapları Gönder</button>}
    </div>
  );
}

function FlashcardsTab({ cards }: { cards: any[] }) {
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  if (cards.length === 0) return <div className="qt-empty">Flash kart bulunmamaktadır.</div>;
  return (
    <div className="ft">
      <p className="ft-hint">Kartlara tıklayarak çevirin</p>
      <div className="ft-grid">
        {cards.map((card, i) => (
          <div key={i} className={`ft-card ${flipped.has(i) ? "flipped" : ""}`}
            onClick={() => { const next = new Set(flipped); if (next.has(i)) next.delete(i); else next.add(i); setFlipped(next); }}>
            <div className="ft-card-inner">
              <div className="ft-card-front"><span className="ft-card-label">S</span><p>{card.front}</p></div>
              <div className="ft-card-back"><span className="ft-card-label">C</span><p>{card.back}</p></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotesTab({ note, setNote, onSave, saved }: { note: string; setNote: (n: string) => void; onSave: () => void; saved: boolean; }) {
  return (
    <div className="nt">
      <h3 className="nt-title">Ders Notlarım</h3>
      <textarea className="nt-area" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Notlarınızı buraya yazın..." rows={10} />
      <div className="nt-actions">
        <button className="lv-btn primary sm" onClick={onSave}>Kaydet</button>
        {saved && <span className="nt-saved">Kaydedildi ✓</span>}
      </div>
    </div>
  );
}
