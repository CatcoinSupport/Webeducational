import React, { useState, useEffect } from 'react';
import { Subject, Lesson, LessonSection, ForumComment, StudentProfile } from '../types';
import { 
  Play, FileText, CheckCircle, Circle, ArrowLeft, Send, Sparkles, 
  AlertCircle, Bookmark, Star, Trash2, MoreVertical, X, Award, RotateCcw, Eye, HelpCircle 
} from 'lucide-react';

interface LessonViewerProps {
  subject: Subject;
  lesson: Lesson;
  profile: StudentProfile;
  completedSections: string[];
  forumComments: ForumComment[];
  onToggleSectionDone: (sectionId: string) => void;
  onBackToDashboard: () => void;
  onAddComment: (comment: { lessonId: string; sectionId?: string; content: string }) => void;
  onDeleteComment: (commentId: string) => void;
  onAskAiTutor: (contextText: string) => void;
}

export default function LessonViewer({
  subject,
  lesson,
  profile,
  completedSections,
  forumComments,
  onToggleSectionDone,
  onBackToDashboard,
  onAddComment,
  onDeleteComment,
  onAskAiTutor
}: LessonViewerProps) {
  const [activeSectionId, setActiveSectionId] = useState<string>(
    lesson.sections.length > 0 ? lesson.sections[0].id : ''
  );
  const [selectedExerciseOption, setSelectedExerciseOption] = useState<number | null>(null);
  const [exerciseChecked, setExerciseChecked] = useState<boolean>(false);
  const [newCommentText, setNewCommentText] = useState<string>('');

  // Right-side category navigation sidebar state for mobile pop-over rendering
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Exercise Textual Correction toggler (Afficher le corrigé)
  const [showCorrection, setShowCorrection] = useState(false);

  // Quiz active states
  const [quizCurrentQuestionIndex, setQuizCurrentQuestionIndex] = useState(0);
  const [quizSelectedAnswers, setQuizSelectedAnswers] = useState<number[]>([]);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizShuffledOptions, setQuizShuffledOptions] = useState<{ text: string; isCorrect: boolean }[][]>([]);
  const [currentSelectedOption, setCurrentSelectedOption] = useState<number | null>(null);

  const activeSection = lesson.sections.find(s => s.id === activeSectionId);

  // Converts standard watch youtube links to embed format to display correctly
  const getYoutubeEmbedUrl = (url: string | undefined): string | undefined => {
    if (!url) return undefined;
    if (url.includes('youtube.com/embed/')) return url;
    try {
      // Regex search for video code
      const watchRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/watch\?.+&v=)([^#&?]+)/;
      const match = url.match(watchRegex);
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}?autoplay=0&rel=0`;
      }
    } catch (e) {
      console.error("Error parsing YouTube URL", e);
    }
    return url;
  };

  // Reset states when moving between sections
  useEffect(() => {
    setSelectedExerciseOption(null);
    setExerciseChecked(false);
    setShowCorrection(false);
    setSidebarOpen(false); // Auto-close sidebar on item selection

    // If quiz is active, shuffle options
    if (activeSection && activeSection.type === 'quiz' && activeSection.quizQuestions) {
      const shuffled = activeSection.quizQuestions.map(q => {
        const originalOptions = [...q.options].filter(o => o.trim() !== '');
        
        // Stored: options[0] is always correct. Let's map before shuffling.
        const mapped = originalOptions.map((opt, idx) => ({
          text: opt,
          isCorrect: idx === 0
        }));

        // Fisher-Yates shuffle
        for (let i = mapped.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [mapped[i], mapped[j]] = [mapped[j], mapped[i]];
        }
        return mapped;
      });
      setQuizShuffledOptions(shuffled);
      setQuizCurrentQuestionIndex(0);
      setQuizSelectedAnswers([]);
      setQuizFinished(false);
      setCurrentSelectedOption(null);
    }
  }, [activeSectionId, activeSection]);

  const handleSelectOption = (idx: number) => {
    if (exerciseChecked) return;
    setSelectedExerciseOption(idx);
  };

  const verifyExercise = () => {
    if (selectedExerciseOption === null) return;
    setExerciseChecked(true);

    // If correct option, automatically tag section completed and award XP
    if (activeSection && selectedExerciseOption === activeSection.exerciseAnswerIndex) {
      if (!completedSections.includes(activeSection.id)) {
        onToggleSectionDone(activeSection.id);
      }
    }
  };

  // Reveal practice exercise solution
  const handleRevealCorrection = () => {
    setShowCorrection(true);
    // Mark completed when looking at the correction to encourage studying
    if (activeSection && !completedSections.includes(activeSection.id)) {
      onToggleSectionDone(activeSection.id);
    }
  };

  // Handle quiz question submission
  const handleQuizNextQuestion = () => {
    if (currentSelectedOption === null) return;
    
    const nextAnswers = [...quizSelectedAnswers, currentSelectedOption];
    setQuizSelectedAnswers(nextAnswers);
    setCurrentSelectedOption(null);

    const questions = activeSection?.quizQuestions || [];
    if (quizCurrentQuestionIndex + 1 < questions.length) {
      setQuizCurrentQuestionIndex(quizCurrentQuestionIndex + 1);
    } else {
      // Finished! Toggle completed done
      setQuizFinished(true);
      if (activeSection && !completedSections.includes(activeSection.id)) {
        onToggleSectionDone(activeSection.id);
      }
    }
  };

  // Reset quiz to retry
  const handleRetryQuiz = () => {
    setQuizCurrentQuestionIndex(0);
    setQuizSelectedAnswers([]);
    setQuizFinished(false);
    setCurrentSelectedOption(null);
    
    // re-shuffle options
    if (activeSection && activeSection.quizQuestions) {
      const shuffled = activeSection.quizQuestions.map(q => {
        const originalOptions = [...q.options].filter(o => o.trim() !== '');
        const mapped = originalOptions.map((opt, idx) => ({
          text: opt,
          isCorrect: idx === 0
        }));
        for (let i = mapped.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [mapped[i], mapped[j]] = [mapped[j], mapped[i]];
        }
        return mapped;
      });
      setQuizShuffledOptions(shuffled);
    }
  };

  const handleDoneClick = () => {
    if (activeSection) {
      onToggleSectionDone(activeSection.id);
    }
  };

  const handlePostCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    onAddComment({
      lessonId: lesson.id,
      sectionId: activeSectionId,
      content: newCommentText.trim()
    });
    setNewCommentText('');
  };

  // Filter comments for this lesson
  const filteredComments = forumComments.filter(c => c.lessonId === lesson.id);

  // Math rendering helper for LaTeX block parsing
  const renderMathSymbols = (formula: string) => {
    let text = formula;
    const replacements: [RegExp, string][] = [
      [/\\forall/g, "∀"],
      [/\\exists/g, "∃"],
      [/\\notin/g, "∉"],
      [/\\in/g, "∈"],
      [/\\le/g, "≤"],
      [/\\ge/g, "≥"],
      [/\\neq/g, "≠"],
      [/\\approx/g, "≈"],
      [/\\infty/g, "∞"],
      [/\\times/g, "×"],
      [/\\to/g, "→"],
      [/\\right/g, ""],
      [/\\left/g, ""],
      [/\\rightarrow/g, "→"],
      [/\\cup/g, "∪"],
      [/\\cap/g, "∩"],
      [/\\emptyset/g, "∅"],
      [/\\subset/g, "⊂"],
      [/\\supset/g, "⊃"],
      [/\\sum/g, "∑"],
      [/\\mathbb\{N\}/g, "ℕ"],
      [/\\mathbb N/g, "ℕ"],
      [/\\mathbb\{R\}/g, "ℝ"],
      [/\\mathbb R/g, "ℝ"],
      [/\\mathbb\{C\}/g, "ℂ"],
      [/\\mathbb C/g, "ℂ"],
      [/\\mathbb\{Z\}/g, "ℤ"],
      [/\\mathbb Z/g, "ℤ"],
      [/\\mathbb\{Q\}/g, "ℚ"],
      [/\\mathbb Q/g, "ℚ"],
      [/\\theta/g, "θ"],
      [/\\pi/g, "π"],
      [/\\alpha/g, "α"],
      [/\\beta/g, "β"],
      [/\\gamma/g, "γ"],
      [/\\delta/g, "δ"],
      [/\\Delta/g, "Δ"],
      [/\\lambda/g, "λ"],
      [/\\sigma/g, "σ"],
      [/\\omega/g, "ω"],
      [/\\Omega/g, "Ω"],
      [/\\sqrt\{([^}]+)\}/g, "√($1)"],
      [/\\sqrt/g, "√"],
      [/\\bar\{([^}]+)\}/g, "$1̄"],
      [/\\lim_\{([^}]+)\}/g, "lim($1)"],
      [/u_\{n\+1\}/g, "uₙ₊₁"],
      [/u_n/g, "uₙ"],
      [/u_\{n\}/g, "uₙ"],
      [/x_0/g, "x₀"],
      [/x_\{0\}/g, "x₀"],
      [/x\^3/g, "x³"],
      [/x\^2/g, "x²"],
      [/x\^([0-9]+)/g, "x^$1"]
    ];

    replacements.forEach(([regex, value]) => {
      text = text.replace(regex, value);
    });
    return text;
  };

  const formatExplicationText = (text: string) => {
    if (!text) return '';
    const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);
    return parts.map((part, i) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const formula = part.slice(2, -2);
        return (
          <div key={i} className="my-4 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 text-center font-mono font-bold text-sm text-emerald-900 overflow-x-auto">
            {renderMathSymbols(formula)}
          </div>
        );
      } else if (part.startsWith('$') && part.endsWith('$')) {
        const inlineFormula = part.slice(1, -1);
        return (
          <code key={i} className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 font-mono text-xs font-bold rounded">
            {renderMathSymbols(inlineFormula)}
          </code>
        );
      }
      return part;
    });
  };

  const activeIsCompleted = activeSection ? completedSections.includes(activeSection.id) : false;

  // Compute active quiz scores
  const getQuizScore = () => {
    let correct = 0;
    quizSelectedAnswers.forEach((ansIdx, qIdx) => {
      if (quizShuffledOptions[qIdx]?.[ansIdx]?.isCorrect) {
        correct++;
      }
    });
    return correct;
  };

  const quizScore = getQuizScore();
  const quizPercent = activeSection?.quizQuestions && activeSection.quizQuestions.length > 0 
    ? Math.round((quizScore / activeSection.quizQuestions.length) * 100) 
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Upper header section toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            id="back-to-dashboard-btn"
            onClick={onBackToDashboard}
            className="p-2 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 active:scale-95 transition-all cursor-pointer"
            title="Retour au Tableau"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end sm:justify-start">
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase">
                {subject.name}
              </span>
              <span className="text-xs font-bold text-emerald-700 font-mono">
                Semestre {lesson.term}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 mt-1">{lesson.title}</h1>
          </div>
        </div>

        {/* Buttons right align */}
        <div className="flex items-center gap-3 justify-end sm:justify-start">
          
          {/* Collapsible right sidebar toggle trigger for mobile to prevent loading on screen top */}
          <button
            id="toggle-sections-sidebar-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs active:scale-95 transition-all cursor-pointer"
            title="فهرس فقرات الدرس"
          >
            <MoreVertical className="w-4 h-4 text-slate-605 text-slate-600" />
            <span>فهرس فقرات الدرس ({lesson.sections.length})</span>
          </button>

          {activeSection && (
            <button
              id="ai-explain-btn"
              onClick={() => onAskAiTutor(`Peux-tu m'expliquer et me résumer l'étape suivante de la leçon "${lesson.title}" : "${activeSection.title}" ? Surtout les formules clés !`)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-700/10 active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 fill-white animate-pulse" />
              <span>مساعد الذكاء الاصطناعي</span>
            </button>
          )}

        </div>
      </div>

      {/* Main core grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 relative">

        {/* Right Sidebar Table of Contents (Desktop - order-last placed on the right side) */}
        <div className={`lg:col-span-1 lg:order-last space-y-4 ${sidebarOpen ? 'block fixed inset-y-0 right-0 z-50 w-72 bg-white p-5 shadow-2xl border-l border-slate-200 overflow-y-auto lg:relative lg:block lg:inset-auto lg:z-0 lg:w-auto lg:shadow-none lg:border-none lg:p-0' : 'hidden lg:block'}`}>
          <div className="flex items-center justify-between lg:hidden pb-3 border-b border-slate-150 mb-3">
            <h3 className="text-sm font-bold text-slate-800">فقرات الدرس</h3>
            <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-full bg-slate-100 hover:bg-slate-200">
              <X className="w-4 h-4 text-slate-650" />
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-md border border-slate-200/80 p-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3 text-right">فهرس فقرات الدرس</h3>
            
            <nav className="space-y-1.5 text-right">
              {lesson.sections.map((section) => {
                const sectIsCompleted = completedSections.includes(section.id);
                const sectIsActive = section.id === activeSectionId;

                return (
                  <button
                    key={section.id}
                    id={`section-link-${section.id}`}
                    onClick={() => {
                      setActiveSectionId(section.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full text-right flex items-start justify-between gap-2.5 p-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                      sectIsActive
                        ? "bg-emerald-50 text-emerald-900 border border-emerald-110 border-emerald-200 font-bold"
                        : "text-slate-600 hover:bg-slate-50 border border-transparent"
                    }`}
                  >
                    <div className="flex-1 order-1">
                      <div className="line-clamp-2 leading-snug">{section.title}</div>
                      <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-1">
                        {section.type === 'video' ? <Play className="w-2.5 h-2.5 text-emerald-500 fill-emerald-500" /> : 
                         section.type === 'quiz' ? <HelpCircle className="w-2.5 h-2.5 text-indigo-500" /> : <FileText className="w-2.5 h-2.5 text-emerald-500" />}
                        {section.duration}
                      </span>
                    </div>

                    <span className="mt-0.5 flex-shrink-0 order-2">
                      {sectIsCompleted ? (
                        <CheckCircle className="w-4.5 h-4.5 text-emerald-600 fill-emerald-100" />
                      ) : (
                        <Circle className={`w-4.5 h-4.5 ${sectIsActive ? "text-emerald-400" : "text-slate-300"}`} />
                      )}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Checklist progress tracker summary */}
          <div className="bg-slate-900 text-white rounded-2xl shadow-sm p-4 relative overflow-hidden text-right border border-slate-800">
            <div className="absolute inset-0 opacity-5 bg-moroccan-pattern bg-repeat bg-center"></div>
            <div className="relative">
              <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-2">تقدّمك بالدرس</h4>
              <div className="text-xl font-mono font-extrabold text-left">
                {lesson.sections.filter(s => completedSections.includes(s.id)).length} / {lesson.sections.length}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-normal">أنجز جميع فقرات واختبارات الدرس للحصول على علامة كاملة وتحفيز XP ممتاز!</p>
            </div>
          </div>
        </div>

        {/* Gray backdrop for mobile sidebar */}
        {sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"></div>
        )}

        {/* Left/Central Main Side: Active content layout */}
        <div className="lg:col-span-3 space-y-6">

          {activeSection ? (
            <div className="bg-white rounded-2xl shadow-md border border-slate-200/80 p-6 space-y-6">
              
              <div className="text-right">
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-lg uppercase tracking-wider">
                  {activeSection.type === 'video' ? 'الفقرة العادية الشارحة' : 
                   activeSection.type === 'quiz' ? 'الاختبار التفاعلي الشامل' : 
                   activeSection.type === 'practice_exercise' ? 'مسائل وتمارين تطبيقية' : 'إيضاحات وصيغ كسب XP'}
                </span>
                <h2 className="text-xl sm:text-2xl font-display font-extrabold text-slate-905 text-slate-900 mt-2">{activeSection.title}</h2>
              </div>

              {/* SECTION: VIDEO TYPE */}
              {activeSection.type === 'video' && (
                <div id="video-embed-frame" className="space-y-4">
                  {/* Grid layout for video box and circle progress side by side */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-stretch">
                    
                    {/* Video Player */}
                    <div className="md:col-span-3 relative aspect-video rounded-xl overflow-hidden shadow bg-slate-900 border border-slate-205">
                      {activeSection.videoUrl ? (
                        <iframe
                          id="youtube-player"
                          src={getYoutubeEmbedUrl(activeSection.videoUrl)}
                          title={activeSection.title}
                          className="absolute inset-0 w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 text-xs">
                          <Play className="w-12 h-12 text-slate-600 mb-2 opacity-40" />
                          <span>لم يتم تحميل المقطع لهذا الدرس بعد.</span>
                        </div>
                      )}
                    </div>

                    {/* Completion Circular percentage */}
                    <div className="md:col-span-1 bg-gradient-to-br from-slate-900 via-emerald-950 to-emerald-950 text-white rounded-2xl p-5 border border-emerald-900/40 shadow-sm flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden">
                      <div className="absolute inset-0 opacity-[0.03] bg-moroccan-pattern bg-repeat bg-center pointer-events-none"></div>
                      
                      <span className="text-[9px] font-black text-emerald-300 uppercase tracking-widest leading-none">
                        تقدّمك العام
                      </span>

                      <div className="relative flex items-center justify-center">
                        <svg className="transform -rotate-90" width="84" height="84">
                          <circle
                            cx="42"
                            cy="42"
                            r="32"
                            className="text-slate-800"
                            strokeWidth="8"
                            stroke="currentColor"
                            fill="transparent"
                          />
                          <circle
                            cx="42"
                            cy="42"
                            r="32"
                            className="text-emerald-400 transition-all duration-500"
                            strokeWidth="8"
                            strokeDasharray={2 * Math.PI * 32}
                            strokeDashoffset={2 * Math.PI * 32 - ((lesson.sections.length > 0 ? Math.round((lesson.sections.filter(s => completedSections.includes(s.id)).length / lesson.sections.length) * 100) : 0) / 100) * (2 * Math.PI * 32)}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-mono font-black text-emerald-100">
                            {lesson.sections.length > 0 ? Math.round((lesson.sections.filter(s => completedSections.includes(s.id)).length / lesson.sections.length) * 100) : 0}%
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="block font-sans text-xs font-extrabold text-emerald-100">
                          {lesson.sections.filter(s => completedSections.includes(s.id)).length} من {lesson.sections.length} منجز
                        </span>
                        <p className="text-[9px] text-slate-400 leading-tight">
                          اضغط على زر الإتمام لمكافأة الـ XP!
                        </p>
                      </div>
                    </div>

                  </div>

                  {/* Empty space placeholder above description as requested */}
                  <div className="h-6"></div>

                  {activeSection.explanationContent && (
                    <div className="mt-8 text-slate-650 text-xs sm:text-sm leading-relaxed bg-slate-50 p-6 rounded-xl border border-slate-100 shadow-sm relative text-right">
                      <div className="absolute -top-3 right-4 px-2.5 py-1 bg-slate-200 text-slate-700 text-[9px] uppercase font-black tracking-wider rounded">
                        الملخص والملاحظات الهامّة للدرس
                      </div>
                      <div className="mt-2 text-slate-750 font-sans leading-relaxed">
                        {formatExplicationText(activeSection.explanationContent)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION: PRACTICE EXERCISE TYPE (With reveal solution button) */}
              {activeSection.type === 'practice_exercise' && (
                <div id="practice-exercise-frame" className="space-y-6 text-right">
                  <div className="p-5 bg-emerald-50/20 rounded-2xl border border-emerald-100 text-right">
                    <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1.5 justify-end">
                      <span>مسألة وتمرين تطبيقي للتدريب</span>
                      <Star className="w-4 h-4 fill-emerald-200 text-emerald-500" />
                    </h3>
                    <div className="text-slate-800 text-xs sm:text-sm font-semibold leading-relaxed">
                      {activeSection.explanationContent ? formatExplicationText(activeSection.explanationContent) : 'لا توجد تفاصيل نصية للمسألة.'}
                    </div>
                  </div>

                  {/* Solution Reveal Button */}
                  <div className="space-y-4 pt-2">
                    {!showCorrection ? (
                      <button
                        id="reveal-solution-btn"
                        onClick={handleRevealCorrection}
                        className="py-2.5 px-6 rounded-xl bg-indigo-65 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs sm:text-sm shadow active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 justify-center mr-auto"
                      >
                        <Eye className="w-4 h-4" />
                        <span>إظهار تصحيح التمرين النموذجي</span>
                      </button>
                    ) : (
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 animate-fade-in text-right">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">✓ اكتملت وعرضت (+20 XP)</span>
                          <h4 className="font-bold text-slate-800 flex items-center gap-1.5 justify-end">
                            <span>الحل المفصل والنموذجي للتمرين</span>
                            <CheckCircle className="w-4 h-4 text-emerald-600 fill-emerald-50" />
                          </h4>
                        </div>
                        <div className="text-slate-700 text-xs sm:text-sm leading-relaxed">
                          {activeSection.exerciseCorrection ? formatExplicationText(activeSection.exerciseCorrection) : 'تم الكشف عن التمرين. لم يسجل الأستاذ أي تعليق نصي للحل بعد.'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SECTION: INTERACTIVE QUIZ (10+ Questions) */}
              {activeSection.type === 'quiz' && activeSection.quizQuestions && (
                <div id="interactive-quiz-frame" className="space-y-6 text-right">
                  
                  {!quizFinished ? (
                    <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 space-y-5 animate-fade-in">
                      {/* Progress state */}
                      <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                        <div className="font-mono">
                          {quizCurrentQuestionIndex + 1} / {activeSection.quizQuestions.length}
                        </div>
                        <div>اختبار قياس الاستيعاب</div>
                      </div>

                      {/* Bar indicator */}
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-555 bg-emerald-500 transition-all duration-300"
                          style={{ width: `${((quizCurrentQuestionIndex + 1) / activeSection.quizQuestions.length) * 100}%` }}
                        ></div>
                      </div>

                      {/* Question Text */}
                      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm text-right">
                        <h3 className="text-sm font-bold text-slate-900 leading-normal">
                          {activeSection.quizQuestions[quizCurrentQuestionIndex]?.question}
                        </h3>
                      </div>

                      {/* Interactive Choices (Shuffled options) */}
                      <div className="grid grid-cols-1 gap-2.5">
                        {quizShuffledOptions[quizCurrentQuestionIndex]?.map((choice, oIdx) => {
                          const isSelected = currentSelectedOption === oIdx;
                          return (
                            <button
                              key={oIdx}
                              onClick={() => setCurrentSelectedOption(oIdx)}
                              className={`w-full text-right p-3.5 rounded-xl border text-xs sm:text-sm font-bold transition-all flex items-center justify-between cursor-pointer ${
                                isSelected 
                                  ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/10 text-indigo-950' 
                                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <span>{choice.text}</span>
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 bg-slate-100'}`}>
                                {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Action buttons */}
                      <div className="flex justify-start">
                        <button
                          onClick={handleQuizNextQuestion}
                          disabled={currentSelectedOption === null}
                          className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm cursor-pointer shadow disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          {quizCurrentQuestionIndex + 1 === activeSection.quizQuestions.length ? 'إنهاء وإظهار النتيجة' : 'السؤال التالي'}
                        </button>
                      </div>

                    </div>
                  ) : (
                    /* QUIZ EVALUATION AND SCORE SCREEN */
                    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow space-y-6 text-center animate-fade-in relative overflow-hidden">
                      <div className="absolute inset-0 opacity-[0.02] bg-moroccan-pattern bg-repeat bg-center pointer-events-none"></div>

                      <div className="max-w-md mx-auto space-y-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mb-2">
                          <Award className="w-8 h-8" />
                        </div>

                        <h3 className="text-xl sm:text-2xl font-display font-extrabold text-slate-850">نتيجة الاختبار التفاعلي</h3>
                        
                        {/* Display percentage */}
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block px-8">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">معدل الإجابات الصحيحة</span>
                          <span className="text-3xl font-mono font-black text-slate-900 mt-1 block">
                            {quizPercent}%
                          </span>
                          <span className="text-xs text-slate-500 block font-bold font-sans mt-0.5">
                            أجبت على {quizScore} من {activeSection.quizQuestions.length} أسئلة بنجاح
                          </span>
                        </div>

                        {/* Motivational message + animations depending on performance */}
                        {quizPercent >= 70 ? (
                          <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-2 animate-bounce">
                            <h4 className="font-extrabold text-emerald-800 text-sm">🎉 هنيئاً لك يا بطل! مستوى مشرف جداً</h4>
                            <p className="text-xs text-emerald-705 leading-relaxed font-medium">
                              لقد حصلت على تقييم رائع وممتاز! أنت تتقدم بثبات وذكاء نحو حصد ميزة مستحقة في الامتحان الوطني للباكالوريا. مستواك فاق التوقعات، استمر في كسب المزيد من الـ XP!
                            </p>
                          </div>
                        ) : (
                          <div className="p-5 bg-amber-50/65 rounded-2xl border border-amber-200/60 space-y-2">
                            <h4 className="font-extrabold text-amber-800 text-sm">💪 تفاءل خيراً! الخطأ هو طريق البداية والتمكن</h4>
                            <p className="text-xs text-amber-900 leading-relaxed font-medium">
                              لا داعي للقلق مطلقا، فالتجربة هي أساس التفوق! نقترح عليك إعادة قراءة ملخص الفقرات الهامة بتمعن، وسوف تكسب بالتأكيد العلامة الكاملة في المرة القادمة. تفوقك قادم لا محالة!
                            </p>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex gap-3 justify-center pt-2">
                          <button
                            onClick={handleRetryQuiz}
                            className="flex items-center gap-1.5 py-2 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          >
                            <RotateCcw className="w-4 h-4" />
                            <span>إعادة المحاولة مجدداً</span>
                          </button>
                        </div>

                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* SECTION: EXPLANATION / TEXT SECTION TYPE */}
              {activeSection.type === 'explanation' && activeSection.explanationContent && (
                <div id="explanation-frame" className="space-y-4 text-right">
                  <div className="text-slate-700 text-xs sm:text-sm leading-relaxed bg-slate-50/50 p-6 rounded-2xl border border-slate-100 font-sans">
                    {formatExplicationText(activeSection.explanationContent)}
                  </div>
                  
                  {activeSection.reviewCheatSheet && (
                    <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200/60 shadow-sm text-right">
                      <h4 className="flex items-center gap-1.5 text-sm font-bold text-amber-800 mb-2 justify-end">
                        <span>Fiche Mémo (Cadre Référence)</span>
                        <Bookmark className="w-4 h-4 text-amber-600 fill-amber-600" />
                      </h4>
                      <div className="text-xs sm:text-sm text-amber-900 leading-relaxed font-sans">
                        {formatExplicationText(activeSection.reviewCheatSheet)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION: GENERIC INTERACTIVE EXERCISE (legacy fallback) */}
              {activeSection.type === 'exercise' && activeSection.exerciseQuestion && (
                <div id="exercise-frame" className="space-y-6 text-right">
                  <div className="p-5 bg-emerald-50/30 rounded-xl border border-emerald-100/50">
                    <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-widest mb-2 flex items-center gap-1.5 justify-end">
                      <span>سؤال تطبيق تفاعلي مع الخيارات</span>
                      <Star className="w-4 h-4 fill-emerald-200 text-emerald-500" />
                    </h3>
                    <p className="text-sm font-bold font-display text-slate-800 leading-relaxed">
                      {activeSection.exerciseQuestion}
                    </p>
                  </div>

                  {activeSection.exerciseOptions && (
                    <div className="grid grid-cols-1 gap-3">
                      {activeSection.exerciseOptions.map((opt, idx) => {
                        const isSelected = selectedExerciseOption === idx;
                        const isCorrect = idx === activeSection.exerciseAnswerIndex;
                        
                        let optionStyle = "border-slate-200 hover:border-emerald-400 bg-white hover:bg-slate-50/30";
                        if (isSelected) {
                          optionStyle = "border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/20";
                        }
                        if (exerciseChecked) {
                          if (isCorrect) {
                            optionStyle = "border-emerald-500 bg-emerald-50/60 text-emerald-900 font-bold ring-2 ring-emerald-500/20";
                          } else if (isSelected) {
                            optionStyle = "border-rose-300 bg-rose-50 text-rose-900 ring-2 ring-rose-500/20";
                          } else {
                            optionStyle = "border-slate-100 bg-slate-50 opacity-60 pointer-events-none";
                          }
                        }

                        return (
                          <button
                            key={idx}
                            id={`option-btn-${idx}`}
                            onClick={() => handleSelectOption(idx)}
                            disabled={exerciseChecked}
                            className={`w-full text-right p-4 rounded-xl border font-sans text-xs sm:text-sm font-semibold transition-all flex items-center justify-between cursor-pointer ${optionStyle}`}
                          >
                            <span>{opt}</span>
                            <span>
                              {exerciseChecked && isCorrect && <CheckCircle className="w-5 h-5 text-emerald-600" />}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Exercise verified feedback outputs */}
                  <div className="flex gap-3">
                    {!exerciseChecked ? (
                      <button
                        id="verify-exercise-btn"
                        onClick={verifyExercise}
                        disabled={selectedExerciseOption === null}
                        className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer mr-auto"
                      >
                        تحقق من إجابتي على السؤال
                      </button>
                    ) : (
                      <div className="flex-1 p-5 rounded-xl bg-slate-50 border border-slate-100 text-xs sm:text-sm leading-relaxed space-y-2 text-right">
                        <div className="font-bold flex items-center gap-1.5 text-slate-800 justify-end animate-fade-in">
                          {selectedExerciseOption === activeSection.exerciseAnswerIndex ? (
                            <span className="text-emerald-700">🎉 رائع جداً! إجابة صحيحة وكسبت +20 XP</span>
                          ) : (
                            <span className="text-rose-700">❌ الخيار المحدد غير صحيح. تابع التعلم!</span>
                          )}
                        </div>
                        <p className="text-slate-600 font-medium">
                          <strong>شرح الدليل والحل:</strong> {activeSection.exerciseExplanation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Done button to trigger progress */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-xs text-slate-400 text-right sm:text-left">
                  {activeIsCompleted 
                    ? "✨ تم إتمام هذه الفقرة بنجاح مسبقاً! تابع التقدم." 
                    : "🎯 أنجز المطلوب وسجل حضورك كمنجز ثم انقر للتحقق والتقدم."}
                </p>

                <button
                  id="mark-done-btn"
                  onClick={handleDoneClick}
                  className={`flex items-center gap-2 py-2.5 px-6 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer ${
                    activeIsCompleted
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/10 active:scale-95"
                  }`}
                >
                  <CheckCircle className={`w-4 h-4 ${activeIsCompleted ? "fill-emerald-200" : ""}`} />
                  <span>{activeIsCompleted ? "✓ فقرة مكتملة وتم كسب الـ XP" : "تحديد هذه الفقرة كمنجزة بالكامل"}</span>
                </button>
              </div>

            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">اختر فقرة دراسية من الفهرس للمباشرة بالدراسة وحصد النقاط.</p>
            </div>
          )}

          {/* Simulated Banner Ad Slot if free student */}
          {!profile.isPremium && (
            <div id="simulated-ad-slot-2" className="bg-slate-100 rounded-xl p-4 border border-slate-200 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4 text-right">
              <span className="absolute top-0 right-0 py-0.2 px-1.5 bg-slate-250 text-[6px] font-mono rounded-bl text-slate-400 uppercase select-none">إعلان</span>
              <div className="flex items-center gap-3 text-xs justify-end order-2 sm:order-1">
                <span className="p-2 bg-indigo-100 text-indigo-700 rounded-lg font-bold">SM/PC</span>
                <span className="text-slate-650 text-slate-600 font-semibold">هل تريد تفوقاً حتمياً؟ تواصل معنا للاشتراك بالخدمة الكاملة للامتحانات الممنهجة!</span>
              </div>
              <span className="text-xs text-indigo-600 font-bold hover:underline select-none order-1 sm:order-2">تفاصيل إضافية ←</span>
            </div>
          )}

          {/* STYLED COMMUNITY FORUM CHAT SECTION */}
          <div className="bg-white rounded-2xl shadow-md border border-slate-200/80 p-6 space-y-6">
            <div className="text-right">
              <h3 className="text-lg font-bold font-display text-slate-800">نقاش وتجربة التميز ومشاركة الحلول</h3>
              <p className="text-slate-500 text-xs mt-0.5">اطرح جميع استفساراتك الرياضية والفيزيائية للاستفادة للجميع</p>
            </div>

            {/* Comments list */}
            <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
              {filteredComments.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs sm:text-sm">
                  لا توجد أي نقاشات لهذه الفقرة حالياً. تفضل بطرح أول سؤال!
                </div>
              ) : (
                filteredComments.map((comment) => (
                  <div 
                    key={comment.id} 
                    id={`comment-card-${comment.id}`}
                    className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 relative text-right"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {comment.userEmail === profile.email && (
                          <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-700 text-[9px] rounded font-semibold uppercase">أنت</span>
                        )}
                        <span className="font-semibold text-xs sm:text-sm text-slate-800">{comment.userName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {(comment.userEmail === profile.email) && (
                          <button
                            id={`delete-comment-${comment.id}`}
                            onClick={() => onDeleteComment(comment.id)}
                            className="text-slate-400 hover:text-rose-500 transition-colors p-1 rounded hover:bg-rose-50 cursor-pointer"
                            title="حذف تعليقي"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 font-sans leading-relaxed text-right">
                      {comment.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Post comment input */}
            <form onSubmit={handlePostCommentSubmit} className="flex gap-2.5">
              <button
                id="post-comment-btn"
                type="submit"
                className="px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <Send className="w-4 h-4 transform rotate-180" />
              </button>
              <input
                id="comment-input-text"
                type="text"
                required
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="تواصل مع بقية طلاب الباكالوريا... (مثال: ما معنى الدالة العكسية؟)"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white transition-all text-xs sm:text-sm text-right"
              />
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
