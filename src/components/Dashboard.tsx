import React from 'react';
import { AcademicLevel, Stream, StudentProfile } from '../types';
import { Clock, BookMarked, Sparkles, Trophy, Award, Calendar } from 'lucide-react';

interface DashboardProps {
  levels: AcademicLevel[];
  profile: StudentProfile;
  completedSections: string[];
  onNavigate: (view: 'dashboard' | 'subjects' | 'lessons' | 'lesson-viewer' | 'admin') => void;
}

export default function Dashboard({
  levels,
  profile,
  completedSections,
  onNavigate
}: DashboardProps) {
  
  // Find level object and corresponding stream
  const currentLevel = levels.find(l => l.id === profile.academicLevelId);
  const activeStream: Stream | undefined = currentLevel?.streams.find(s => s.id === profile.streamId) || currentLevel?.streams[0];

  if (!activeStream) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <Sparkles className="w-12 h-12 text-rose-500 mx-auto mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-slate-800">Aucune matière configurée pour votre branche</h2>
        <p className="text-slate-500 mt-1.5">Veuillez configurer votre programme au moyen du Panneau Admin.</p>
        <button
          onClick={() => onNavigate('admin')}
          className="mt-6 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow"
        >
          Ouvrir le Panneau Admin
        </button>
      </div>
    );
  }

  // Calculate live dynamic counts requested by the user:
  // We count as COMPLETED any lesson where ALL its sections are fully marked done
  let totalLessonsCount = 0;
  let completedLessonsCount = 0;

  activeStream.subjects.forEach(subject => {
    subject.lessons.forEach(lesson => {
      totalLessonsCount++;
      const sectCount = lesson.sections?.length || 0;
      if (sectCount > 0) {
        const doneCount = lesson.sections.filter(s => completedSections.includes(s.id)).length;
        if (doneCount === sectCount) {
          completedLessonsCount++;
        }
      }
    });
  });

  const overallPercent = totalLessonsCount > 0 
    ? Math.round((completedLessonsCount / totalLessonsCount) * 100) 
    : 0;

  // Render SVG Ring math
  const size = 200;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (overallPercent / 100) * circumference;

  // Moroccan official exam details countdown 
  const examDate = new Date("2026-06-15T08:00:00Z");
  const now = new Date();
  const diffDays = Math.max(0, Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      
      {/* Title greeting bar */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-display font-black text-slate-900 tracking-tight">
          لوحة التحكم في المقررات <span className="font-light">| Moul L'Bac AI</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          مرحباً بك مجدداً يا <span className="text-emerald-700 font-bold">{profile.name}</span> • المستوى: {currentLevel?.name || profile.academicLevelId} ({activeStream.name})
        </p>
      </div>

      {/* Main Column centering the giant completion circle */}
      <div className="bg-white rounded-3xl border border-slate-150 p-8 sm:p-12 shadow-xl flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] bg-moroccan-pattern bg-repeat bg-center pointer-events-none"></div>
        
        {/* Dynamic Badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-100/80">
          <Trophy className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
          معدل إتمام المقررات الوطنية
        </div>

        {/* GIANT PROGRESS CIRCLE RENDER */}
        <div className="relative flex items-center justify-center pt-2">
          <svg className="transform -rotate-90" width={size} height={size}>
            {/* Background trace circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              className="text-slate-100"
              strokeWidth={strokeWidth}
              stroke="currentColor"
              fill="transparent"
            />
            {/* Foreground progress path with duration transition style */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              className="text-emerald-600 transition-all duration-1000 ease-out"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>

          {/* Centered text counts */}
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-0.5">
            <span className="text-4xl sm:text-5xl font-mono font-black text-slate-900">{overallPercent}%</span>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Élaboration</span>
          </div>
        </div>

        {/* Informative details under the giant circle */}
        <div className="space-y-2 max-w-md">
          <p className="text-base sm:text-lg font-bold text-slate-800 leading-snug">
            لقد أنهيت <span className="text-emerald-600 px-1 bg-emerald-50 rounded-md font-extrabold font-mono">{completedLessonsCount}</span> من أصل <span className="text-slate-800 font-extrabold font-mono">{totalLessonsCount}</span> دروس للشعبة
          </p>
          <p className="text-xs text-slate-400 leading-relaxed font-sans font-medium">
            يتم احتساب الدرس كـ "مكتمل" بنسبة 100٪ بمجرد دراسة وإنهاء كافة الفقرات الملحقة به. سيقوم النظام بتحديث هذه النسبة فوراً عند إضافة أو تعديل الدروس من طرف المدير.
          </p>
        </div>

        {/* CTA TO START STUDYING */}
        <button
          onClick={() => onNavigate('subjects')}
          className="flex items-center gap-2.5 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-600/20 active:scale-95 transition-all text-xs sm:text-sm uppercase tracking-wider cursor-pointer mt-4"
        >
          <BookMarked className="w-5 h-5 fill-white" />
          <span>تصفح المواد وبدء الدراسة (Accéder aux Cours)</span>
        </button>
      </div>

      {/* Grid of countdown clock and status metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
        
        {/* Exam countdown */}
        <div className="bg-white rounded-3xl border border-slate-150 p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-100">
                examen national 2026
              </span>
              <Clock className="w-4 h-4 text-emerald-600 animate-pulse" />
            </div>
            
            <h3 className="text-base font-black text-slate-850">العد التنازلي للامتحان الوطني</h3>
            
            <div className="flex items-baseline gap-2 pt-2">
              <span className="font-mono text-4xl font-black text-slate-900 px-3 py-1 bg-slate-50 border border-slate-200 rounded-xl">
                {diffDays}
              </span>
              <span className="text-xs font-black text-slate-500 uppercase tracking-wide">يوم متبقي (jours restants)</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              « الإعداد المستمر والتركيز هما سر النجاح الباهر في الباكالوريا. كل دقيقة تقضيها في فهم المعادلات تدعم مستقبلك الأكاديمي. »
            </p>
          </div>
        </div>

        {/* Study tips & status */}
        <div className="bg-white rounded-3xl border border-slate-150 p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-amber-800 bg-amber-550/10 px-3 py-1 bg-amber-50 rounded-full uppercase tracking-widest border border-amber-100">
                conseil de motivation
              </span>
              <Award className="w-4 h-4 text-amber-500" />
            </div>
            
            <h3 className="text-base font-black text-slate-850">مستشار الدراسة الذكي</h3>
            <p className="text-slate-600 text-xs leading-relaxed font-sans">
              انقر على زر <strong>"المواد"</strong> في الشريط العلوي لعرض قائمة المواد الدراسية، حيث يمكنك استعراض الدروس الحالية ثم دراسة الفقرات الفردية خطوة بخطوة مع الفيديوهات وملخصات المراجعة.
            </p>

            <div className="pt-2 flex items-center gap-2 text-[11px] font-bold text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>معدل النشاط الحالي: مميز 🔥 • المجموع: {profile.totalXP} XP</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
