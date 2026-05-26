import React from 'react';
import { AcademicLevel, Stream, Subject } from '../types';
import { BookOpen, Award, ArrowLeft, ArrowRight, BookMarked, Sparkles } from 'lucide-react';

interface SubjectChooserProps {
  levels: AcademicLevel[];
  profile: any;
  onSelectSubject: (subject: Subject) => void;
  onNavigateHome: () => void;
}

export default function SubjectChooser({
  levels,
  profile,
  onSelectSubject,
  onNavigateHome
}: SubjectChooserProps) {
  
  const currentLevel = levels.find(l => l.id === profile.academicLevelId);
  const activeStream: Stream | undefined = currentLevel?.streams.find(s => s.id === profile.streamId) || currentLevel?.streams[0];

  if (!activeStream) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={onNavigateHome}
            className="group flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-700 font-bold uppercase transition-all mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>الرجوع للرئيسية_</span>
          </button>
          
          <h2 className="text-2xl font-display font-black text-slate-900 tracking-tight flex items-center gap-2">
            📚 قائمة المواد الدراسية المتاحة
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            تصفح المواد الأساسية المعتمدة لشعبة <span className="text-emerald-700 font-bold">{activeStream.name}</span> ({currentLevel?.name || profile.academicLevelId})
          </p>
        </div>

        <div className="bg-emerald-50 text-emerald-800 text-xs font-bold px-4 py-2 rounded-xl border border-emerald-100 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
          <span>المقرر متوافق مع أطر وزارة التربية الوطنية</span>
        </div>
      </div>

      {activeStream.subjects.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-150 shadow-md">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">لم يتم إعداد أي مواد دراسية لهذه الشعبة بعد.</p>
          <p className="text-xs text-slate-400 mt-1">يجب على المسؤول (الأدمن) إضافة المواد في لوحة التحكم.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeStream.subjects.map((subject) => {
            return (
              <div 
                key={subject.id} 
                onClick={() => onSelectSubject(subject)}
                className="group bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-525 hover:border-emerald-400 transition-all duration-300 overflow-hidden flex flex-col justify-between cursor-pointer transform hover:-translate-y-1"
              >
                <div>
                  {/* Subject Header banner */}
                  <div className={`p-5 bg-gradient-to-br ${
                    subject.color === 'indigo' ? 'from-emerald-705 to-emerald-900 bg-emerald-850' : 
                    subject.color === 'rose' ? 'from-rose-700 to-rose-900' :
                    'from-teal-600 to-teal-800 bg-teal-800'
                  } text-white relative`}>
                    <div className="absolute inset-x-0 bottom-0 top-0 opacity-10 bg-moroccan-pattern bg-repeat bg-center"></div>
                    
                    <div className="relative flex items-center justify-between">
                      <span className="px-2 py-0.5 bg-white/20 rounded-md text-[9px] uppercase font-mono tracking-widest font-black">
                        {subject.code || "REG"}
                      </span>
                      <BookMarked className="w-4.5 h-4.5 text-white/80" />
                    </div>
                    
                    <h3 className="text-lg font-black mt-4 font-display text-white group-hover:text-emerald-250 transition-colors">
                      {subject.name}
                    </h3>
                  </div>

                  {/* Body info */}
                  <div className="p-6 space-y-4">
                    <p className="text-slate-560 text-xs sm:text-sm text-slate-500 leading-relaxed font-sans line-clamp-3">
                      {subject.description || "الوصف غير متاح. دروس تفصيلية مصممة لمرافقتك واجتياز الامتحان الوطني بنجاح."}
                    </p>

                    <div className="flex items-center justify-between text-xs text-slate-400 font-medium pt-3 border-t border-slate-100">
                      <span>الدروس المتاحة</span>
                      <span className="font-mono font-bold text-slate-700 bg-slate-50 px-2.5 py-0.5 border border-slate-100 rounded-md">
                        {subject.lessons?.length || 0} درس
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer action */}
                <div className="p-4 bg-slate-50/50 border-t border-slate-100/85 px-6 flex items-center justify-between group-hover:bg-emerald-50/30 transition-colors">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-extrabold">étudier la matière</span>
                  <span className="flex items-center gap-1 font-extrabold text-xs text-emerald-700 group-hover:translate-x-1 duration-200 transition-transform">
                    <span>عرض الدروس</span>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
