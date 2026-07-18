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
  generated_at: string;
}

interface Props {
  node: ContentNode;
  onNavigate: (slug: string) => void;
  onBackToModule: () => void;
  onBackToDashboard: () => void;
  onRegenerate: (slug: string) => Promise<void>;
}

type Tab =
  | "content"
  | "visuals"
  | "quiz"
  | "flashcards"
  | "notes"
  | "related";

const TAB_LABELS: Record<Tab, string> = {
  content: "Konu Anlatımı",
  visuals: "Görseller",
  quiz: "Quiz",
  flashcards: "Flash Kart",
  notes: "Notlar",
  related: "İlgili Konular",
};

const SECTION_ORDER = [
  "ogrenme_hedefleri",
  "giris",
  "tanim_ve_kavramlar",
  "tarihsel_gelisim",
  "temel_ilkeler",
  "siniflandirma",
  "teknik_parametreler",
  "malzemeler",
  "makine_ve_ekipmanlar",
  "uretim_sureci",
  "kalite_kontrol",
  "uygulama_alanlari",
  "avantajlar",
  "dezavantajlar",
  "standartlar_ve_normlar",
  "sik_yapilan_hatalar",
  "vaka_calismasi",
  "ozet",
  "terimler_sozlugu",
  "ilgili_konular",
  "referanslar",
  "gorsel_sema",
];

export default function LessonView({
  node,
  onNavigate,
  onBackToModule,
  onBackToDashboard,
  onRegenerate,
}: Props) {
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
        setError(
          "Bu ders için içerik henüz üretilmemiş. Lütfen panele dönüp içerik üretimini başlatın."
        );
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

  useEffect(() => {
    loadLesson();
  }, [loadLesson]);

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

  if (loading) {
    return (
      <div className="lesson-loading">
        <div className="spinner" />
        <p>Ders yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lesson-error">
        <h3>İçerik Bulunamadı</h3>
        <p>{error}</p>
        <div className="error-actions">
          <button
            className="btn btn-primary"
            onClick={handleRegenerate}
            disabled={regenerating}
          >
            {regenerating ? "Üretiliyor..." : "İçeriği Üret"}
          </button>
          <button className="btn btn-secondary" onClick={onBackToDashboard}>
            Panele Dön
          </button>
        </div>
      </div>
    );
  }

  if (!content) return null;

  const currentIndex = siblings.findIndex((s) => s.id === node.id);
  const prevLesson =
    currentIndex > 0 ? siblings[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < siblings.length - 1
      ? siblings[currentIndex + 1]
      : null;

  return (
    <div className="lesson-view">
      <div className="lesson-header">
        <div className="lesson-header-info">
          <span className="lesson-module-badge">
            {content.module.replace(/-/g, " ")}
          </span>
          <h1 className="lesson-title">{content.node_title}</h1>
          <span className="lesson-difficulty">{content.difficulty}</span>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={handleRegenerate}
          disabled={regenerating}
          title="Yönetici: İçeriği yeniden üret"
        >
          {regenerating ? "Üretiliyor..." : "↻ Yeniden Üret"}
        </button>
      </div>

      <div className="lesson-tabs">
        {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
          <button
            key={t}
            className={`tab-btn ${tab === t ? "active" : ""}`}
            onClick={() => setTab(t)}
          >
            {TAB_LABELS[t]}
            {t === "quiz" && content.quiz.length > 0 && (
              <span className="tab-badge">{content.quiz.length}</span>
            )}
            {t === "flashcards" && content.flashcards.length > 0 && (
              <span className="tab-badge">{content.flashcards.length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="lesson-tab-content">
        {tab === "content" && <ContentTab sections={content.sections} />}
        {tab === "visuals" && <VisualsTab sections={content.sections} />}
        {tab === "quiz" && <QuizTab quiz={content.quiz} />}
        {tab === "flashcards" && (
          <FlashcardsTab cards={content.flashcards} />
        )}
        {tab === "notes" && (
          <NotesTab
            note={note}
            setNote={setNote}
            onSave={handleSaveNote}
            saved={noteSaved}
          />
        )}
        {tab === "related" && (
          <RelatedTab
            sections={content.sections}
            siblings={siblings}
            currentSlug={node.slug}
            onNavigate={onNavigate}
          />
        )}
      </div>

      <div className="lesson-nav-footer">
        <button className="btn btn-ghost" onClick={onBackToDashboard}>
          ← Panele Dön
        </button>
        <button className="btn btn-ghost" onClick={onBackToModule}>
          ↑ Modüle Dön
        </button>
        <div className="nav-spacer" />
        {prevLesson && (
          <button
            className="btn btn-ghost"
            onClick={() => onNavigate(prevLesson.slug)}
          >
            ← {prevLesson.title}
          </button>
        )}
        {nextLesson && (
          <button
            className="btn btn-ghost"
            onClick={() => onNavigate(nextLesson.slug)}
          >
            {nextLesson.title} →
          </button>
        )}
      </div>
    </div>
  );
}

function ContentTab({ sections }: { sections: Record<string, any> }) {
  return (
    <div className="content-tab">
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
    <div className="section-card">
      <h3 className="section-title">{section.title}</h3>
      <SectionBody section={section} />
    </div>
  );
}

function SectionBody({ section }: { section: any }) {
  if (section.type === "text") {
    return <p className="section-text">{section.content}</p>;
  }
  if (section.type === "list") {
    return (
      <ul className="section-list">
        {section.items.map((item: string, i: number) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    );
  }
  if (section.type === "table") {
    return (
      <div className="table-wrap">
        <table className="section-table">
          <thead>
            <tr>
              {section.headers.map((h: string, i: number) => (
                <th key={i}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {section.rows.map((row: string[], i: number) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (section.type === "glossary") {
    return (
      <dl className="section-glossary">
        {section.items.map((item: any, i: number) => (
          <div key={i} className="glossary-item">
            <dt>{item.term}</dt>
            <dd>{item.definition}</dd>
          </div>
        ))}
      </dl>
    );
  }
  if (section.type === "diagram") {
    return (
      <div className="section-diagram">
        <div className="diagram-placeholder">
          <span className="diagram-icon">📐</span>
          <p className="diagram-prompt">{section.prompt}</p>
        </div>
        <p className="diagram-caption">{section.caption}</p>
      </div>
    );
  }
  return null;
}

function VisualsTab({ sections }: { sections: Record<string, any> }) {
  const diagram = sections["gorsel_sema"];
  return (
    <div className="visuals-tab">
      {diagram && (
        <div className="visual-card">
          <h3>{diagram.title}</h3>
          <div className="diagram-placeholder large">
            <span className="diagram-icon">📐</span>
            <p>{diagram.prompt}</p>
          </div>
          <p className="diagram-caption">{diagram.caption}</p>
        </div>
      )}
      <div className="visual-info">
        <h3>Görsel İçerik Notu</h3>
        <p>
          Bu dersin görsel şeması yukarıda gösterilmiştir. Üretim akış diyagramı,
          teknik parametre tabloları ve süreç şemaları Konu Anlatımı sekmesinde
          de bulunabilir.
        </p>
      </div>
    </div>
  );
}

function QuizTab({ quiz }: { quiz: any[] }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = quiz.reduce(
    (acc, q, i) => acc + (answers[i] === q.correct_index ? 1 : 0),
    0
  );

  if (quiz.length === 0) {
    return <div className="quiz-empty">Bu ders için quiz bulunmamaktadır.</div>;
  }

  return (
    <div className="quiz-tab">
      {submitted && (
        <div className="quiz-score-banner">
          <h3>
            Sonuç: {score} / {quiz.length}
          </h3>
          <p>
            {score >= quiz.length * 0.7
              ? "Tebrikler! Bu konuya hakimsiniz."
              : score >= quiz.length * 0.5
              ? "İyi, ancak tekrar etmek faydalı olur."
              : "Bu konuyu tekrar gözden geçirmeniz önerilir."}
          </p>
          <button
            className="btn btn-primary"
            onClick={() => {
              setAnswers({});
              setSubmitted(false);
            }}
          >
            Tekrar Dene
          </button>
        </div>
      )}
      {quiz.map((q, qi) => (
        <div key={qi} className="quiz-question-card">
          <div className="quiz-question-header">
            <span className="quiz-type-badge">{q.type_label}</span>
            <span className="quiz-question-num">Soru {qi + 1}</span>
          </div>
          <p className="quiz-question-text">{q.question}</p>
          <div className="quiz-options">
            {q.options.map((opt: string, oi: number) => {
              const isSelected = answers[qi] === oi;
              const isCorrect = q.correct_index === oi;
              const showResult = submitted && isSelected;
              const showCorrect = submitted && isCorrect;
              return (
                <button
                  key={oi}
                  className={`quiz-option ${isSelected ? "selected" : ""} ${
                    showResult ? (isCorrect ? "correct" : "incorrect") : ""
                  } ${showCorrect ? "correct" : ""}`}
                  onClick={() =>
                    !submitted &&
                    setAnswers({ ...answers, [qi]: oi })
                  }
                  disabled={submitted}
                >
                  <span className="quiz-option-text">{opt}</span>
                  {showCorrect && <span className="quiz-mark">✓</span>}
                  {showResult && !isCorrect && (
                    <span className="quiz-mark">✗</span>
                  )}
                </button>
              );
            })}
          </div>
          {submitted && (
            <div className="quiz-explanations">
              <div className="quiz-main-explanation">
                <strong>Açıklama: </strong>
                {q.explanation}
              </div>
              <details className="quiz-detail-panel">
                <summary>Seçenek açıklamalarını göster</summary>
                <ul>
                  {q.options.map((opt: string, oi: number) => (
                    <li
                      key={oi}
                      className={
                        oi === q.correct_index
                          ? "exp-correct"
                          : "exp-incorrect"
                      }
                    >
                      <strong>{opt}: </strong>
                      {q.explanations[oi]}
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          )}
        </div>
      ))}
      {!submitted && (
        <button
          className="btn btn-primary btn-block"
          onClick={() => setSubmitted(true)}
        >
          Cevapları Gönder
        </button>
      )}
    </div>
  );
}

function FlashcardsTab({ cards }: { cards: any[] }) {
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  if (cards.length === 0)
    return <div className="flashcards-empty">Flash kart bulunmamaktadır.</div>;
  return (
    <div className="flashcards-tab">
      <p className="flashcards-hint">Kartlara tıklayarak çevirin.</p>
      <div className="flashcards-grid">
        {cards.map((card, i) => (
          <div
            key={i}
            className={`flashcard ${flipped.has(i) ? "flipped" : ""}`}
            onClick={() => {
              const next = new Set(flipped);
              if (next.has(i)) next.delete(i);
              else next.add(i);
              setFlipped(next);
            }}
          >
            <div className="flashcard-inner">
              <div className="flashcard-front">
                <span className="flashcard-label">Soru</span>
                <p>{card.front}</p>
              </div>
              <div className="flashcard-back">
                <span className="flashcard-label">Cevap</span>
                <p>{card.back}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotesTab({
  note,
  setNote,
  onSave,
  saved,
}: {
  note: string;
  setNote: (n: string) => void;
  onSave: () => void;
  saved: boolean;
}) {
  return (
    <div className="notes-tab">
      <h3>Ders Notlarım</h3>
      <p className="notes-hint">
        Bu derse ait kişisel notlarınızı buraya kaydedebilirsiniz. Notlar
        otomatik olarak veritabanında saklanır.
      </p>
      <textarea
        className="notes-textarea"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Notlarınızı buraya yazın..."
        rows={12}
      />
      <div className="notes-actions">
        <button className="btn btn-primary" onClick={onSave}>
          Kaydet
        </button>
        {saved && <span className="notes-saved">Kaydedildi ✓</span>}
      </div>
    </div>
  );
}

function RelatedTab({
  sections,
  siblings,
  currentSlug,
  onNavigate,
}: {
  sections: Record<string, any>;
  siblings: ContentNode[];
  currentSlug: string;
  onNavigate: (slug: string) => void;
}) {
  const relatedSection = sections["ilgili_konular"];
  const relatedTitles = relatedSection?.items || [];
  const sibLessons = siblings.filter((s) => s.slug !== currentSlug);
  const extraTitles = relatedTitles.filter(
    (t: string) => !siblings.some((s) => s.title === t)
  );

  return (
    <div className="related-tab">
      <h3>İlgili Konular</h3>
      {sibLessons.length === 0 && extraTitles.length === 0 ? (
        <p>Bu derste ilgili konu bulunmamaktadır.</p>
      ) : (
        <div className="related-list">
          {sibLessons.map((s) => (
            <button
              key={s.id}
              className="related-card"
              onClick={() => onNavigate(s.slug)}
            >
              <span className="related-title">{s.title}</span>
              <span className="related-arrow">→</span>
            </button>
          ))}
          {extraTitles.map((t: string, i: number) => (
            <div key={i} className="related-card static">
              <span className="related-title">{t}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
