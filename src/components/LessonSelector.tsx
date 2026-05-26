import React from 'react';
import { Subject, Lesson } from '../types';
import { ArrowLeft, BookOpen, Clock, Award, Play, CheckCircle2, ChevronRight, FileText } from 'lucide-react';

interface LessonSelectorProps {
  subject: Subject;
  onSelectLesson: (lesson: Lesson) => void;
  onBack: () => void;
  completedSections: string[];
}

export default function LessonSelector({
  subject,
  onSelectLesson,
  onBack,
  completedSections
}: LessonSelectorProps) {
  
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      
      {/* Header Bar */}
      <div>
        <button
          onClick={onBack}
          className="group flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-700 font-bold uppercase transition-all mb-3 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>الرجوع للمواد (Retour)</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-extrabold text-emerald-850 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full uppercase tracking-widest">
              Syllabus : {subject.name}
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-black text-slate-900 tracking-tight mt-2.5">
              📖 الدروس والوحدات التعليمية
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              اختر الدرس الذي ترغب في مراجعته اليوم وابدأ شروحات الفيديو والتمارين التفاعلية.
            </p>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-right">
            <span className="block text-[8px] text-slate-400 font-extrabold uppercase tracking-widest">Compteur total</span>
            <span className="font-mono text-base font-black text-slate-800">
              {subject.lessons?.length || 0} دروس مصنفة
            </span>
          </div>
        </div>
      </div>

      {/* Lesson List */}
      {!subject.lessons || subject.lessons.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-150 shadow-sm">
          <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">لم يتم إدراج أي دروس في هذه المادة بعد.</p>
          <p className="text-xs text-slate-400 mt-1">يرجى الانتظار لحين إضافة المحتوى بشكل رسمي من طرف المعلم.</p>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Group into Semesters if desired. For now, let's list them cleanly */}
          {subject.lessons.map((lesson, idx) => {
            // Calculate lesson finished status
            const totalSectionsCount = lesson.sections?.length || 0;
            const completedCount = totalSectionsCount > 0 
              ? lesson.sections.filter(s => completedSections.includes(s.id)).length
              : 0;
            
            const isLessonDone = totalSectionsCount > 0 && completedCount === totalSectionsCount;
            const hasStarted = completedCount > 0;
            const percentage = totalSectionsCount > 0 ? Math.round((completedCount / totalSectionsCount) * 100) : 0;

            return (
              <div 
                key={lesson.id}
                onClick={() => onSelectLesson(lesson)}
                className={`group bg-white rounded-2xl border ${
                  isLessonDone ? 'border-emerald-200 bg-emerald-50/5' : 'border-slate-200 hover:border-emerald-400'
                } p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer transform hover:-translate-y-0.5`}
              >
                
                {/* Details */}
                <div className="flex-1 space-y-3.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-emerald-800 bg-emerald-50 px-2.5 py-0.5 border border-emerald-100 rounded uppercase tracking-wider">
                      Dars {idx + 1}
                    </span>
                    <span className="text-[9px] font-semibold text-slate-450 text-slate-400 bg-slate-50 px-2.5 py-0.5 border border-slate-100 rounded">
                      السداسي الدراسي: {lesson.term === 1 ? "الدورة الأولى" : "الدورة الثانية"}
                    </span>
                    {isLessonDone && (
                      <span className="flex items-center gap-1 text-[9px] font-extrabold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full uppercase">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 fill-emerald-100" />
                        كامل مكتمل
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-black font-display text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {lesson.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-sans mt-1">
                      {lesson.description || "استوعب المفاهيم الأساسية، البراهين الهندسية، وحل المعادلات التدريبية لهذه الوحدة."}
                    </p>
                  </div>

                  {/* Sections list overview badges */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-1.5">
                    {lesson.sections?.slice(0, 4).map((sec, sIdx) => {
                      const secDone = completedSections.includes(sec.id);
                      return (
                        <span 
                          key={sec.id}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                            secDone 
                              ? "bg-emerald-50/60 text-emerald-900 border border-emerald-100/50" 
                              : "bg-slate-50 text-slate-500 border border-slate-100"
                          }`}
                        >
                          {sec.type === 'video' ? <Play className="w-2.5 h-2.5 text-emerald-600 fill-emerald-100" /> : <FileText className="w-2.5 h-2.5 text-slate-500" />}
                          <span className="max-w-[80px] truncate">{sec.title}</span>
                        </span>
                      );
                    })}
                    {lesson.sections?.length > 4 && (
                      <span className="text-[10px] text-slate-400 font-mono font-bold">
                        +{lesson.sections.length - 4} فقرات
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Indicators */}
                <div className="flex items-center gap-4 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 justify-between md:justify-end">
                  
                  {/* Progress Line */}
                  <div className="text-right space-y-1">
                    <span className="block text-[8px] text-slate-400 font-extrabold uppercase tracking-widest leading-none">
                      état d'avancement
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="font-mono text-sm font-black text-slate-800">
                        {completedCount} / {totalSectionsCount} ({percentage}%)
                      </div>
                    </div>
                    {/* Tiny Progress slider */}
                    <div className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-100">
                      <div 
                        className="h-full bg-emerald-600 rounded-full transition-all duration-300" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Large access chevron */}
                  <div className="p-2 sm:p-2.5 bg-slate-50 group-hover:bg-emerald-600 group-hover:text-white rounded-xl border border-slate-150 transition-all text-slate-400 flex items-center justify-center">
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                  </div>

                </div>

              </div>
            );
          })}

        </div>
      )}

    </div>
  );
}
