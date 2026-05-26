import React, { useState, useEffect } from 'react';
import { AcademicLevel, Stream, Subject, Lesson, LessonSection } from '../types';
import { 
  Folder, FileText, Plus, Edit3, Trash2, ChevronRight, Sparkles, 
  Users, Layers, BookMarked, Video, HelpCircle, ArrowLeft, RefreshCw, X
} from 'lucide-react';

interface AdminPanelProps {
  levels: AcademicLevel[];
  onSaveSyllabus: (updatedLevels: AcademicLevel[]) => void;
  onClose: () => void;
}

export default function AdminPanel({
  levels,
  onSaveSyllabus,
  onClose
}: AdminPanelProps) {
  
  // Dynamic metrics state
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<{ type: 'level' | 'stream' | 'subject' | 'lesson' | 'section'; targetId: string } | null>(null);

  // Drilldown selection states (stores item IDs)
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const [selectedStreamId, setSelectedStreamId] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  // Forms overlay state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState<any | null>(null); // { type, parentIds, currentData }

  // Simple additions text input fields
  const [addName, setAddName] = useState('');
  const [addId, setAddId] = useState('');
  
  // Subject advanced add fields
  const [addCode, setAddCode] = useState('');
  const [addColor, setAddColor] = useState('indigo');
  const [addDesc, setAddDesc] = useState('');

  // Lesson additions
  const [addTerm, setAddTerm] = useState<'1' | '2'>('1');

  // Paragraph additions
  const [addVideoUrl, setAddVideoUrl] = useState('');
  const [addExplanation, setAddExplanation] = useState('');
  const [addType, setAddType] = useState<'video' | 'explanation' | 'exercise' | 'review' | 'quiz' | 'practice_exercise'>('video');
  const [addQuizQuestions, setAddQuizQuestions] = useState<{question: string, options: string[]}[]>(
    Array(10).fill(null).map(() => ({ question: '', options: ['', '', '', '', ''] }))
  );
  const [addExerciseCorrection, setAddExerciseCorrection] = useState('');

  const handleUpdateAddQuestion = (qIdx: number, val: string) => {
    setAddQuizQuestions(prev => prev.map((q, i) => i === qIdx ? { ...q, question: val } : q));
  };

  const handleUpdateAddOption = (qIdx: number, oIdx: number, val: string) => {
    setAddQuizQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q;
      const nextOpts = [...q.options];
      nextOpts[oIdx] = val;
      return { ...q, options: nextOpts };
    }));
  };

  // Load registered users directly from backend to display accurate KPIs
  useEffect(() => {
    async function fetchSyllabusUsers() {
      setLoadingUsers(true);
      try {
        const res = await fetch('/api/syllabus');
        if (res.ok) {
          const data = await res.json();
          if (data.users) {
            setAllUsers(data.users);
          }
        }
      } catch (err) {
        console.error("Failed to load user statistics from backend:", err);
      } finally {
        setLoadingUsers(false);
      }
    }
    fetchSyllabusUsers();
  }, [levels]);

  // Success message trigger helper
  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Error message trigger helper
  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 5000);
  };

  // ----------------------------------------------------
  // CALCULATE DRILLDOWN REFS
  // ----------------------------------------------------
  const currentLevel = levels.find(l => l.id === selectedLevelId) || null;
  const currentStream = currentLevel?.streams.find(s => s.id === selectedStreamId) || null;
  const currentSubject = currentStream?.subjects.find(s => s.id === selectedSubjectId) || null;
  const currentLesson = currentSubject?.lessons.find(l => l.id === selectedLessonId) || null;

  // ----------------------------------------------------
  // CALCULATE RAW STATISTICS FOR THE COLOR BLOCKS
  // ----------------------------------------------------
  const totalUsersCount = allUsers.length;
  
  // Calculate users registered today
  const todayString = new Date().toDateString();
  const usersTodayCount = allUsers.filter(u => {
    if (!u.joinedAt) return false;
    return new Date(u.joinedAt).toDateString() === todayString;
  }).length;

  // Count Levels, Streams, Subjects and Lessons in database
  const totalLevelsCount = levels.length;
  let totalStreamsCount = 0;
  let totalSubjectsCount = 0;
  let totalLessonsCount = 0;

  levels.forEach(lvl => {
    totalStreamsCount += lvl.streams?.length || 0;
    lvl.streams?.forEach(st => {
      totalSubjectsCount += st.subjects?.length || 0;
      st.subjects?.forEach(sub => {
        totalLessonsCount += sub.lessons?.length || 0;
      });
    });
  });

  // ----------------------------------------------------
  // INTERACTIVE ADD ACTIONS (CREATE) FOR EVERY LAYER
  // ----------------------------------------------------
  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim()) return;

    const trimmedId = (addId.trim() || addName.trim().substring(0, 5)).toLowerCase().replace(/[^a-z0-9]/g, '');

    // LEVEL
    if (selectedLevelId === null) {
      if (levels.some(l => l.id === trimmedId)) {
        triggerError("المعرف الخاص بهذا المستوى الدراسي موجود بالفعل.");
        return;
      }
      const updated = [...levels, {
        id: trimmedId,
        name: addName.trim(),
        streams: []
      }];
      onSaveSyllabus(updated);
      triggerSuccess(`Niveau "${addName}" créé avec succès.`);
    }

    // STREAM (under Level)
    else if (selectedStreamId === null && currentLevel) {
      if (currentLevel.streams.some(s => s.id === trimmedId)) {
        triggerError("المعرف الخاص بهذه الشعبة موجود بالفعل.");
        return;
      }
      const updated = levels.map(lvl => {
        if (lvl.id === currentLevel.id) {
          return {
            ...lvl,
            streams: [...lvl.streams, {
              id: trimmedId,
              name: addName.trim(),
              academicLevelId: lvl.id,
              subjects: []
            }]
          };
        }
        return lvl;
      });
      onSaveSyllabus(updated);
      triggerSuccess(`Filière "${addName}" ajoutée.`);
    }

    // SUBJECT (under Stream)
    else if (selectedSubjectId === null && currentLevel && currentStream) {
      if (currentStream.subjects.some(s => s.id === trimmedId)) {
        triggerError("المعرّف الخاص بهذه المادة موجود بالفعل.");
        return;
      }
      const updated = levels.map(lvl => {
        if (lvl.id === currentLevel.id) {
          return {
            ...lvl,
            streams: lvl.streams.map(str => {
              if (str.id === currentStream.id) {
                return {
                  ...str,
                  subjects: [...str.subjects, {
                    id: trimmedId,
                    name: addName.trim(),
                    code: addCode.trim().toUpperCase() || "MATH",
                    color: addColor,
                    description: addDesc.trim(),
                    lessons: []
                  }]
                };
              }
              return str;
            })
          };
        }
        return lvl;
      });
      onSaveSyllabus(updated);
      triggerSuccess(`Matière "${addName}" ajoutée.`);
    }

    // LESSON (under Subject)
    else if (selectedLessonId === null && currentLevel && currentStream && currentSubject) {
      if (currentSubject.lessons.some(l => l.id === trimmedId)) {
        triggerError("المعرّف الخاص بهذا الدرس موجود بالفعل.");
        return;
      }
      const updated = levels.map(lvl => {
        if (lvl.id === currentLevel.id) {
          return {
            ...lvl,
            streams: lvl.streams.map(str => {
              if (str.id === currentStream.id) {
                return {
                  ...str,
                  subjects: str.subjects.map(sub => {
                    if (sub.id === currentSubject.id) {
                      return {
                        ...sub,
                        lessons: [...sub.lessons, {
                          id: trimmedId,
                          title: addName.trim(),
                          description: addDesc.trim() || `Description complète du cours : ${addName}`,
                          term: Number(addTerm) as 1 | 2,
                          sections: []
                        }]
                      };
                    }
                    return sub;
                  })
                };
              }
              return str;
            })
          };
        }
        return lvl;
      });
      onSaveSyllabus(updated);
      triggerSuccess(`Leçon "${addName}" créée.`);
    }

    // PARAGRAPH (under Lesson)
    else if (currentLevel && currentStream && currentSubject && currentLesson) {
      let finalSection: any = {
        id: trimmedId,
        title: addName.trim(),
        type: addType,
        duration: addType === 'quiz' ? "15 mins" : "10 mins"
      };

      if (addType === 'video') {
        finalSection.videoUrl = addVideoUrl.trim() || undefined;
        finalSection.explanationContent = addExplanation.trim() || undefined;
      } else if (addType === 'practice_exercise') {
        finalSection.explanationContent = addExplanation.trim() || undefined; // details of exercise
        finalSection.exerciseCorrection = addExerciseCorrection.trim() || undefined; // text correction
      } else if (addType === 'quiz') {
        // filter out blank questions
        const filteredQs = addQuizQuestions
          .filter(q => q.question.trim() !== '')
          .map(q => ({
            question: q.question.trim(),
            options: q.options.map(o => o.trim()).filter(Boolean)
          }));
        finalSection.quizQuestions = filteredQs;
      } else {
        finalSection.explanationContent = addExplanation.trim() || undefined;
      }

      const updated = levels.map(lvl => {
        if (lvl.id === currentLevel.id) {
          return {
            ...lvl,
            streams: lvl.streams.map(str => {
              if (str.id === currentStream.id) {
                return {
                  ...str,
                  subjects: str.subjects.map(sub => {
                    if (sub.id === currentSubject.id) {
                      return {
                        ...sub,
                        lessons: sub.lessons.map(lsn => {
                          if (lsn.id === currentLesson.id) {
                            return {
                              ...lsn,
                              sections: [...lsn.sections, finalSection]
                            };
                          }
                          return lsn;
                        })
                      };
                    }
                    return sub;
                  })
                };
              }
              return str;
            })
          };
        }
        return lvl;
      });
      onSaveSyllabus(updated);
      triggerSuccess(`الفقرة "${addName}" تمت إضافتها بنجاح.`);
    }

    // Reset fields
    setAddName('');
    setAddId('');
    setAddCode('');
    setAddDesc('');
    setAddVideoUrl('');
    setAddExplanation('');
    setAddExerciseCorrection('');
    setAddType('video');
    setAddQuizQuestions(Array(10).fill(null).map(() => ({ question: '', options: ['', '', '', '', ''] })));
    setIsAddOpen(false);
  };

  // ----------------------------------------------------
  // INTERACTIVE EDIT ACTIONS (UPDATE DATA OVERLAY MODAL)
  // ----------------------------------------------------
  const openEditForm = (type: 'level' | 'stream' | 'subject' | 'lesson' | 'section', rawItem: any) => {
    setIsEditOpen({
      type,
      id: rawItem.id,
      data: { ...rawItem }
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditOpen) return;

    const { type, id, data } = isEditOpen;

    const updatedLevels = levels.map(lvl => {
      // Direct high level
      if (type === 'level' && lvl.id === id) {
        return { ...lvl, name: data.name };
      }

      return {
        ...lvl,
        streams: lvl.streams.map(str => {
          if (type === 'stream' && str.id === id) {
            return { ...str, name: data.name };
          }

          return {
            ...str,
            subjects: str.subjects.map(sub => {
              if (type === 'subject' && sub.id === id) {
                return {
                  ...sub,
                  name: data.name,
                  code: data.code,
                  color: data.color,
                  description: data.description
                };
              }

              return {
                ...sub,
                lessons: sub.lessons.map(lsn => {
                  if (type === 'lesson' && lsn.id === id) {
                    return {
                      ...lsn,
                      title: data.title || data.name,
                      description: data.description,
                      term: Number(data.term) as 1 | 2
                    };
                  }

                  return {
                    ...lsn,
                    sections: lsn.sections.map(sec => {
                      if (type === 'section' && sec.id === id) {
                        return {
                          ...sec,
                          title: data.title || data.name,
                          videoUrl: data.videoUrl,
                          explanationContent: data.explanationContent,
                          exerciseCorrection: data.exerciseCorrection,
                          quizQuestions: data.quizQuestions,
                          type: data.type || sec.type
                        };
                      }
                      return sec;
                    })
                  };
                })
              };
            })
          };
        })
      };
    });

    onSaveSyllabus(updatedLevels);
    triggerSuccess(`Modifications enregistrées avec succès !`);
    setIsEditOpen(null);
  };

  // ----------------------------------------------------
  // DELETION HANDLER (DELETE ACTION AT ANY LAYER)
  // ----------------------------------------------------
  const handleDeleteItem = (type: 'level' | 'stream' | 'subject' | 'lesson' | 'section', targetId: string) => {
    setDeleteConfirmItem({ type, targetId });
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmItem) return;
    const { type, targetId } = deleteConfirmItem;

    let updatedLevels = [...levels];

    if (type === 'level') {
      updatedLevels = updatedLevels.filter(lvl => lvl.id !== targetId);
      if (selectedLevelId === targetId) setSelectedLevelId(null);
    } else {
      updatedLevels = updatedLevels.map(lvl => {
        return {
          ...lvl,
          streams: lvl.streams.filter(str => {
            if (type === 'stream' && str.id === targetId) return false;
            return true;
          }).map(str => {
            return {
              ...str,
              subjects: str.subjects.filter(sub => {
                if (type === 'subject' && sub.id === targetId) return false;
                return true;
              }).map(sub => {
                return {
                  ...sub,
                  lessons: sub.lessons.filter(lsn => {
                    if (type === 'lesson' && lsn.id === targetId) return false;
                    return true;
                  }).map(lsn => {
                    return {
                      ...lsn,
                      sections: lsn.sections.filter(sec => {
                        if (type === 'section' && sec.id === targetId) return false;
                        return true;
                      })
                    };
                  })
                };
              })
            };
          })
        };
      });
    }

    onSaveSyllabus(updatedLevels);
    triggerSuccess("تم حذف العنصر وكافة محتوياته بنجاح.");
    setDeleteConfirmItem(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-805 text-xs text-indigo-700 font-extrabold rounded bg-indigo-50 uppercase tracking-widest border border-indigo-150">
              directeur académique
            </span>
            <span className="text-xs text-emerald-600 font-bold">• Administration Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900 tracking-tight">
            لوحة الإشراف وإدارة المقررات <span className="font-light">| Moul L'Bac</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm">
            أضف، عدل، أو احذف المستويات، الشعب، المواد، الدروس، والفقرات الشارحة. سيتم تحديث بيانات الطلاب تلقائياً.
          </p>
        </div>

        <button
          onClick={onClose}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 justify-center"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>مغادرة لوحة الإشراف (Fermer)</span>
        </button>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border-l-4 border-emerald-600 font-bold text-xs sm:text-sm rounded-xl animate-pulse">
          ✓ {successMsg}
        </div>
      )}

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 text-rose-800 border-l-4 border-rose-600 font-bold text-xs sm:text-sm rounded-xl" dir="rtl">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* ----------------------------------------------------
          Requirement 4: STATISTICS HEADER BLOCKS (KPI SQUARES)
          ---------------------------------------------------- */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        
        {/* Metric 1: Total Users (Blue Box) */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-5 rounded-3xl shadow-md space-y-1 relative overflow-hidden">
          <div className="absolute right-2 bottom-1 opacity-10">
            <Users className="w-16 h-16" />
          </div>
          <span className="block text-[10px] font-black uppercase tracking-wider text-blue-105 opacity-80">المستخدمين الحاليين</span>
          <span className="block font-mono text-xl sm:text-3xl font-black">
            {loadingUsers ? "..." : totalUsersCount}
          </span>
          <span className="block text-[10px] opacity-75">Comptes enregistrés</span>
        </div>

        {/* Metric 2: Users Registered Today (Green Box) */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-5 rounded-3xl shadow-md space-y-1 relative overflow-hidden">
          <div className="absolute right-2 bottom-1 opacity-10">
            <RefreshCw className="w-16 h-16" />
          </div>
          <span className="block text-[10px] font-black uppercase tracking-wider text-emerald-105 opacity-80">المستخدمين الجدد اليوم</span>
          <span className="block font-mono text-xl sm:text-3xl font-black">{usersTodayCount}</span>
          <span className="block text-[10px] opacity-75">Aujourd'hui</span>
        </div>

        {/* Metric 3: Total Subjects (Orange/Yellow Box) */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-5 rounded-3xl shadow-md space-y-1 relative overflow-hidden">
          <div className="absolute right-2 bottom-1 opacity-10">
            <BookMarked className="w-16 h-16" />
          </div>
          <span className="block text-[10px] font-black uppercase tracking-wider text-amber-105 opacity-80">إجمالي المواد الدراسية</span>
          <span className="block font-mono text-xl sm:text-3xl font-black">{totalSubjectsCount}</span>
          <span className="block text-[10px] opacity-75">Matières actives</span>
        </div>

        {/* Metric 4: Total Lessons (Red Box) */}
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 text-white p-5 rounded-3xl shadow-md space-y-1 relative overflow-hidden">
          <div className="absolute right-2 bottom-1 opacity-10">
            <Layers className="w-16 h-16" />
          </div>
          <span className="block text-[10px] font-black uppercase tracking-wider text-rose-105 opacity-80">عدد الدروس المضافة</span>
          <span className="block font-mono text-xl sm:text-3xl font-black">{totalLessonsCount}</span>
          <span className="block text-[10px] opacity-75">Cours structurés</span>
        </div>

        {/* Metric 5: Total Streams/Levels (Purple Box) */}
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-5 rounded-3xl shadow-md space-y-1 col-span-2 md:col-span-1 relative overflow-hidden">
          <div className="absolute right-2 bottom-1 opacity-10">
            <Folder className="w-16 h-16" />
          </div>
          <span className="block text-[10px] font-black uppercase tracking-wider text-indigo-105 opacity-80">الشعب والمستويات</span>
          <span className="block font-mono text-xl sm:text-3xl font-black">
            {totalLevelsCount} <span className="text-xs opacity-60">مستويات</span> / {totalStreamsCount} <span className="text-xs opacity-60">شعب</span>
          </span>
          <span className="block text-[10px] opacity-75">Orientation Bac</span>
        </div>

      </div>

      {/* ----------------------------------------------------
          Requirement 4: DRILLDOWN HIERARCHICAL TABLE SYSTEM
          ---------------------------------------------------- */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg overflow-hidden">
        
        {/* Navigation Breadcrumb / Pathway Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-205 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
          <button 
            onClick={() => { setSelectedLevelId(null); setSelectedStreamId(null); setSelectedSubjectId(null); setSelectedLessonId(null); }}
            className={`hover:text-emerald-700 transition-colors ${selectedLevelId === null ? "text-emerald-700 font-bold" : ""}`}
          >
            المستويات (Niveaux)
          </button>
          
          {selectedLevelId !== null && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <button 
                onClick={() => { setSelectedStreamId(null); setSelectedSubjectId(null); setSelectedLessonId(null); }}
                className={`hover:text-emerald-700 transition-colors ${selectedStreamId === null ? "text-emerald-700 font-bold" : ""}`}
              >
                {currentLevel?.name}
              </button>
            </>
          )}

          {selectedStreamId !== null && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <button 
                onClick={() => { setSelectedSubjectId(null); setSelectedLessonId(null); }}
                className={`hover:text-emerald-700 transition-colors ${selectedSubjectId === null ? "text-emerald-700 font-bold" : ""}`}
              >
                شعبة {currentStream?.name}
              </button>
            </>
          )}

          {selectedSubjectId !== null && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <button 
                onClick={() => setSelectedLessonId(null)}
                className={`hover:text-emerald-700 transition-colors ${selectedLessonId === null ? "text-emerald-700 font-bold" : ""}`}
              >
                مادة {currentSubject?.name}
              </button>
            </>
          )}

          {selectedLessonId !== null && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-800 font-bold">درس: {currentLesson?.title}</span>
            </>
          )}
        </div>

        {/* Content table block depending on current depth */}
        <div className="p-6">
          
          {/* 1. DEPTH: LEVELS LIST */}
          {selectedLevelId === null && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-850">قائمة المستويات التعليمية</h3>
                <button
                  onClick={() => { setAddId(''); setAddName(''); setIsAddOpen(true); }}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-705 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة مستوى جديد (Ajouter)</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-150">
                <table className="min-w-full divide-y divide-slate-150">
                  <thead className="bg-slate-50 text-right">
                    <tr>
                      <th className="px-6 py-3 text-xs font-extrabold text-slate-525 uppercase tracking-wider text-left">Identifiant unique</th>
                      <th className="px-6 py-3 text-right text-xs font-extrabold text-slate-525 uppercase tracking-wider">اسم المستوى الأكاديمي</th>
                      <th className="px-6 py-3 text-right text-xs font-extrabold text-slate-525 uppercase tracking-wider">الشعب المدرجة</th>
                      <th className="px-6 py-3 text-center text-xs font-extrabold text-slate-525 uppercase tracking-wider">الإجراءات والتحكم</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-150">
                    {levels.map(level => (
                      <tr key={level.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-xs font-mono font-bold text-slate-500 text-left">{level.id}</td>
                        <td className="px-6 py-4 text-slate-850 font-bold">{level.name}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-full border border-slate-205">
                            {level.streams?.length || 0} شعب دراسية
                          </span>
                        </td>
                        <td className="px-6 py-4 flex gap-1.5 justify-center items-center">
                          <button
                            onClick={() => setSelectedLevelId(level.id)}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-850 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                          >
                            <span>عرض الشعب</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            onClick={() => openEditForm('level', level)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteItem('level', level.id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. DEPTH: STREAMS/FILIERES LIST */}
          {selectedLevelId !== null && selectedStreamId === null && currentLevel && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <button 
                    onClick={() => setSelectedLevelId(null)}
                    className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-emerald-700 font-bold uppercase"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Niveaux</span>
                  </button>
                  <h3 className="text-base font-black text-slate-850 mt-1">
                    الشعب المتوفرة بالمستوى: <span className="text-emerald-700 font-bold">{currentLevel.name}</span>
                  </h3>
                </div>

                <button
                  onClick={() => { setAddId(''); setAddName(''); setIsAddOpen(true); }}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-705 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة شعبة جديدة (Ajouter)</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-150">
                <table className="min-w-full divide-y divide-slate-150">
                  <thead className="bg-slate-50 text-right">
                    <tr>
                      <th className="px-6 py-3 text-xs font-extrabold text-slate-525 uppercase tracking-wider text-left">Code filière</th>
                      <th className="px-6 py-3 text-right text-xs font-extrabold text-slate-525 uppercase tracking-wider">اسم الشعبة الدراسية</th>
                      <th className="px-6 py-3 text-right text-xs font-extrabold text-slate-525 uppercase tracking-wider">عدد المواد</th>
                      <th className="px-6 py-3 text-center text-xs font-extrabold text-slate-525 uppercase tracking-wider">الإجراءات والتحكم</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-150">
                    {currentLevel.streams.map(stream => (
                      <tr key={stream.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-xs font-mono font-bold text-slate-500 text-left">{stream.id}</td>
                        <td className="px-6 py-4 text-slate-850 font-bold">{stream.name}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-full border border-slate-205">
                            {stream.subjects?.length || 0} مواد مضافة
                          </span>
                        </td>
                        <td className="px-6 py-4 flex gap-1.5 justify-center items-center">
                          <button
                            onClick={() => setSelectedStreamId(stream.id)}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-850 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                          >
                            <span>عرض المواد</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            onClick={() => openEditForm('stream', stream)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteItem('stream', stream.id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {currentLevel.streams.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-400 text-sm">
                          لم يتم إدراج شعبة في هذا المستوى الأكاديمي بعد. انقر على الزر في الأعلى لإضافة أول شعبة!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. DEPTH: SUBJECTS LIST */}
          {selectedLevelId !== null && selectedStreamId !== null && currentLevel && currentStream && (
            selectedSubjectId === null ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <button 
                      onClick={() => setSelectedStreamId(null)}
                      className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-emerald-700 font-bold uppercase"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>Branches ({currentLevel.name})</span>
                    </button>
                    <h3 className="text-base font-black text-slate-850 mt-1">
                      مواد الشعبة المتوفرة: <span className="text-emerald-700 font-bold">{currentStream.name}</span>
                    </h3>
                  </div>

                  <button
                    onClick={() => { 
                      setAddId(''); 
                      setAddName(''); 
                      setAddCode('PHYS'); 
                      setAddDesc(''); 
                      setAddColor('indigo'); 
                      setIsAddOpen(true); 
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-705 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة مادة جديدة (Ajouter)</span>
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-150">
                  <table className="min-w-full divide-y divide-slate-150">
                    <thead className="bg-slate-50 text-right">
                      <tr>
                        <th className="px-6 py-3 text-xs font-extrabold text-slate-525 uppercase tracking-wider text-left">Code matiere</th>
                        <th className="px-6 py-3 text-right text-xs font-extrabold text-slate-525 uppercase tracking-wider">اسم المادة</th>
                        <th className="px-6 py-3 text-right text-xs font-extrabold text-slate-525 uppercase tracking-wider">عدد الدروس</th>
                        <th className="px-6 py-3 text-right text-xs font-extrabold text-slate-525 uppercase tracking-wider">اللون</th>
                        <th className="px-6 py-3 text-center text-xs font-extrabold text-slate-525 uppercase tracking-wider">الإجراءات والتحكم</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-150">
                      {currentStream.subjects.map(subject => (
                        <tr key={subject.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 text-xs font-mono font-bold text-slate-500 text-left">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-black">{subject.code || "MATH"}</span>
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-850">
                            {subject.name}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full border border-emerald-100">
                              {subject.lessons?.length || 0} دروس نشطة
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-block w-4 h-4 rounded-full bg-${subject.color || "indigo"}-500`} title={subject.color}></span>
                          </td>
                          <td className="px-6 py-4 flex gap-1.5 justify-center items-center">
                            <button
                              onClick={() => setSelectedSubjectId(subject.id)}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-850 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                            >
                              <span>عرض الدروس</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                            
                            <button
                              onClick={() => openEditForm('subject', subject)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            
                            <button
                              onClick={() => handleDeleteItem('subject', subject.id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {currentStream.subjects.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400 text-sm">
                            لم يتم إدراج أي مواد لهذه الشعبة بعد. انقر على الزر في الأعلى لإضافة أول مادة!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null
          )}

          {/* 4. DEPTH: LESSONS LIST */}
          {selectedLevelId !== null && selectedStreamId !== null && selectedSubjectId !== null && currentLevel && currentStream && currentSubject && (
            selectedLessonId === null ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <button 
                      onClick={() => setSelectedSubjectId(null)}
                      className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-emerald-700 font-bold uppercase"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>Matières ({currentStream.name})</span>
                    </button>
                    <h3 className="text-base font-black text-slate-850 mt-1">
                      دروس مادة: <span className="text-emerald-700 font-bold">{currentSubject.name}</span>
                    </h3>
                  </div>

                  <button
                    onClick={() => { 
                      setAddId(''); 
                      setAddName(''); 
                      setAddDesc(''); 
                      setAddTerm('1'); 
                      setIsAddOpen(true); 
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-705 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة درس جديد (Ajouter)</span>
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-150">
                  <table className="min-w-full divide-y divide-slate-150">
                    <thead className="bg-slate-50 text-right">
                      <tr>
                        <th className="px-6 py-3 text-xs font-extrabold text-slate-525 uppercase tracking-wider text-left">Code interne</th>
                        <th className="px-6 py-3 text-right text-xs font-extrabold text-slate-525 uppercase tracking-wider">عنوان الدرس التعليمي</th>
                        <th className="px-6 py-3 text-right text-xs font-extrabold text-slate-525 uppercase tracking-wider">الدورة / السداسي</th>
                        <th className="px-6 py-3 text-right text-xs font-extrabold text-slate-525 uppercase tracking-wider">الفقرات / الأقسام الملحقة</th>
                        <th className="px-6 py-3 text-center text-xs font-extrabold text-slate-525 uppercase tracking-wider">الإجراءات والتحكم</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-150">
                      {currentSubject.lessons.map(lesson => (
                        <tr key={lesson.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 text-xs font-mono font-bold text-slate-400 text-left">{lesson.id}</td>
                          <td className="px-6 py-4 font-bold text-slate-850">
                            {lesson.title}
                          </td>
                          <td className="px-6 py-4 text-slate-600 text-xs font-semibold">
                            {lesson.term === 1 ? "الدورة الأولى" : "الدورة الثانية"}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full border border-emerald-100">
                              {lesson.sections?.length || 0} فقرات (Paragraphes)
                            </span>
                          </td>
                          <td className="px-6 py-4 flex gap-1.5 justify-center items-center">
                            <button
                              onClick={() => setSelectedLessonId(lesson.id)}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-850 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                            >
                              <span>تعديل الفقرات</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                            
                            <button
                              onClick={() => openEditForm('lesson', lesson)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            
                            <button
                              onClick={() => handleDeleteItem('lesson', lesson.id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {currentSubject.lessons.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400 text-sm">
                            لم يتم إدراج أي دروس في هذه المادة بعد. انقر على الزر في الأعلى لإضافة أول درس!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null
          )}

          {/* 5. DEPTH: SECTIONS/PARAGRAPHS LIST (Requirement 4e) */}
          {selectedLevelId !== null && selectedStreamId !== null && selectedSubjectId !== null && selectedLessonId !== null && currentLevel && currentStream && currentSubject && currentLesson && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <button 
                    onClick={() => setSelectedLessonId(null)}
                    className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-emerald-700 font-bold uppercase animate-pulse"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Leçons ({currentSubject.name})</span>
                  </button>
                  <h3 className="text-base font-black text-slate-850 mt-1">
                    إدارة فقرات ملف الدرس: <span className="text-emerald-700 font-bold">{currentLesson.title}</span>
                  </h3>
                </div>

                <button
                  onClick={() => { 
                    setAddId(''); 
                    setAddName(''); 
                    setAddVideoUrl('https://www.youtube.com/embed/5D_yO1x_zKk'); // Beautiful default video placeholder
                    setAddExplanation('$$f(x) = x^2\\ln(x)$$\n\n1. Enoncer la limite en $0$.\n2. Vérifier les conditions fondamentales.\n\n/for all _ [الرمز الرياضي يصحح تلقائياً عند الطالب]'); 
                    setIsAddOpen(true); 
                  }}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-705 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة فقرة جديدة (Ajouter)</span>
                </button>
              </div>

              {/* Responsive custom-styled table for lesson paragraphs as requested */}
              <div className="overflow-x-auto rounded-xl border border-slate-150">
                <table className="min-w-full divide-y divide-slate-150">
                  <thead className="bg-slate-50 text-right">
                    <tr>
                      <th className="px-6 py-3 text-xs font-extrabold text-slate-525 uppercase tracking-wider text-left">Internal ID</th>
                      <th className="px-6 py-3 text-right text-xs font-extrabold text-slate-525 uppercase tracking-wider">العنوان (Titre de la section)</th>
                      <th className="px-6 py-3 text-right text-xs font-extrabold text-slate-525 uppercase tracking-wider">رابط المقطع (Lien Vidéo)</th>
                      <th className="px-6 py-3 text-right text-xs font-extrabold text-slate-525 uppercase tracking-wider">الملخصات والملاحظات المهمة للفقرة</th>
                      <th className="px-6 py-3 text-center text-xs font-extrabold text-slate-525 uppercase tracking-wider">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-150">
                    {currentLesson.sections.map(section => (
                      <tr key={section.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-xs font-mono font-bold text-slate-400 text-left">{section.id}</td>
                        <td className="px-6 py-4 font-bold text-slate-850">{section.title}</td>
                        <td className="px-6 py-4 max-w-[200px] truncate text-xs text-blue-600 font-mono">
                          {section.videoUrl || <span className="text-slate-400">Pas de vidéo</span>}
                        </td>
                        <td className="px-6 py-4 max-w-[320px] truncate text-slate-500 text-xs">
                          {section.explanationContent || <span className="text-slate-400">Pas de notes importantes</span>}
                        </td>
                        <td className="px-6 py-4 flex gap-1.5 justify-center items-center">
                          <button
                            onClick={() => openEditForm('section', section)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteItem('section', section.id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {currentLesson.sections.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400 text-sm">
                          لا توجد أي فقرة مضافة لهذا الدرس بعد. الرجاء النقر على الزر في الأعلى لإدراج أول مقال/فيديو تعريفي!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ----------------------------------------------------
          CREATION FORM OVERLAY MODAL
          ---------------------------------------------------- */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative animate-fade-in border border-slate-100">
            
            <button
              onClick={() => setIsAddOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-black text-emerald-600 tracking-wider">formulaire de création</span>
              <h3 className="text-xl font-black text-slate-900">
                {selectedLevelId === null ? "إضافة مستوى أكاديمي جديد" :
                 selectedStreamId === null ? "إضافة شعبة وطنية جديدة" :
                 selectedSubjectId === null ? "إضافة مادة تعليمية جديدة" :
                 selectedLessonId === null ? "إضافة درس جديد بالمقرر" :
                 "إضافة فقرة إيضاحية بملف الدرس"}
              </h3>
            </div>

            <form onSubmit={handleAddNew} className="space-y-4">
              
              {/* ID Identifier */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">الرمز الفريد للتعريف (ID Identifiant)</label>
                <input
                  type="text"
                  required
                  placeholder="ex : math_2bac / pc_sm"
                  value={addId}
                  onChange={(e) => setAddId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-sm"
                />
              </div>

              {/* Title / Name */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">الاسم / العنوان (Nom / Titre)</label>
                <input
                  type="text"
                  required
                  placeholder={
                    selectedLevelId === null ? "ex : 2ème Année Baccalauréat" :
                    selectedStreamId === null ? "ex : Sciences Physiques" :
                    selectedSubjectId === null ? "ex : Mathématiques" :
                    selectedLessonId === null ? "ex : Les Limites et Continuité" :
                    "ex : 1. Théorème des valeurs intermédiaires"
                  }
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-sm"
                />
              </div>

              {/* Subject Additional details */}
              {selectedLevelId !== null && selectedStreamId !== null && selectedSubjectId === null && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">ترويزة المادة (Code)</label>
                      <input
                        type="text"
                        placeholder="ex : MATH / SVT"
                        value={addCode}
                        onChange={(e) => setAddCode(e.target.value)}
                        className="w-full px-3.5 py-2 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">اللون الطيفي (Color)</label>
                      <select
                        value={addColor}
                        onChange={(e) => setAddColor(e.target.value)}
                        className="w-full px-3.5 py-2 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm bg-slate-50"
                      >
                        <option value="indigo">Indigo / Bleu Royal</option>
                        <option value="rose">Rose / Rubis</option>
                        <option value="emerald">Emerald / Émeraude</option>
                        <option value="amber">Amber / Ambre doré</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">نبذة موجزة وعامة للمادة</label>
                    <textarea
                      placeholder="استعراض شامل وتحضير للبرنامج الوطني مع الامتحانات..."
                      rows={2}
                      value={addDesc}
                      onChange={(e) => setAddDesc(e.target.value)}
                      className="w-full px-3.5 py-2 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-xs bg-slate-50"
                    />
                  </div>
                </>
              )}

              {/* Lesson Additional details */}
              {selectedLevelId !== null && selectedStreamId !== null && selectedSubjectId !== null && selectedLessonId === null && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">الدورة التعليمية (Semestre / Term)</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                        <input
                          type="radio"
                          name="lesson-term"
                          checked={addTerm === '1'}
                          onChange={() => setAddTerm('1')}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>الدورة الأولى (Semestre 1)</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                        <input
                          type="radio"
                          name="lesson-term"
                          checked={addTerm === '2'}
                          onChange={() => setAddTerm('2')}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>الدورة الثانية (Semestre 2)</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">توصيف الدرس</label>
                    <textarea
                      placeholder="مقرر ومحاور الدرس الأساسية للباكالوريا..."
                      rows={2}
                      value={addDesc}
                      onChange={(e) => setAddDesc(e.target.value)}
                      className="w-full text-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-xs bg-slate-50"
                    />
                  </div>
                </>
              )}

              {/* Paragraph / Section details (Requirement 4e) */}
              {selectedLevelId !== null && selectedStreamId !== null && selectedSubjectId !== null && selectedLessonId !== null && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">نوع الفقرة المضافة (Type de la section)</label>
                    <select
                      value={addType}
                      onChange={(e) => setAddType(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-xs font-bold"
                    >
                      <option value="video">فقرة عادية (مقطع فيديو يوتيوب + ملخص الدرس)</option>
                      <option value="practice_exercise">تمارين تطبيقية كلامية ومسائل (مع التفاصيل كلامياً والتصحيح)</option>
                      <option value="quiz">اختبار تفاعلي تفصيلي (سير العمل 10 أسئلة Quiz)</option>
                    </select>
                  </div>

                  {addType === 'video' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">رابط مقطع الشرح اليوتيوب (URL embedded)</label>
                        <input
                          type="text"
                          placeholder="https://www.youtube.com/embed/XXXXXX"
                          value={addVideoUrl}
                          onChange={(e) => setAddVideoUrl(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-xs font-mono"
                        />
                        <span className="block text-[9px] text-slate-400 mt-1">يجب أن يحتوي الرابط على صيغة embed من يوتيوب ليشرع العرض بسلاسة.</span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">ملخص الأشياء المهمة والملاحظات للفقرة (ExplicationNotes)</label>
                        <textarea
                          placeholder="صياغة الملخص بفقرات متناسقة أو كود LaTeX المميز (مثال : $$f(x)=\sqrt{x}$$)"
                          rows={4}
                          value={addExplanation}
                          onChange={(e) => setAddExplanation(e.target.value)}
                          className="w-full text-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs bg-slate-50 font-sans"
                        />
                      </div>
                    </>
                  )}

                  {addType === 'practice_exercise' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">نص التمرين أو المسائل التطبيقية</label>
                        <textarea
                          placeholder="صغ نص التمرين وصيغ الأسئلة لتظهر للطالب في الصفحة..."
                          rows={4}
                          required
                          value={addExplanation}
                          onChange={(e) => setAddExplanation(e.target.value)}
                          className="w-full text-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs bg-slate-50 font-sans"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5 font-bold text-emerald-800">الحل النموذجي والتصحيح كلامياً (Correction)</label>
                        <textarea
                          placeholder="اكتب هنا التصحيح وملاحظات الحل الكامل لتظهر للطالب فقط عندما يضغط على زر 'إظهار التصحيح'..."
                          rows={4}
                          required
                          value={addExerciseCorrection}
                          onChange={(e) => setAddExerciseCorrection(e.target.value)}
                          className="w-full text-slate-850 px-3.5 py-2.5 rounded-xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs bg-emerald-50/20 font-sans"
                        />
                      </div>
                    </>
                  )}

                  {addType === 'quiz' && (
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-1 border border-slate-100 p-3 rounded-xl bg-slate-50/50">
                      <div className="bg-emerald-50 p-2 text-[11px] font-bold text-emerald-800 rounded mb-2 text-right">
                        💡 يرجى ملء ما لا يقل عن 10 أسئلة. اكتب في السطر الأول السؤال، ثم الخيار الأول (الجواب الصحيح دائماً)، ثم الخيارات الأربعة الخاطئة الأخرى.
                      </div>
                      
                      {addQuizQuestions.map((q, qIdx) => (
                        <div key={qIdx} className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                          <span className="text-[10px] font-mono font-bold text-indigo-600 font-bold">السؤال #{qIdx + 1}</span>
                          
                          <input
                            type="text"
                            placeholder="صغ نص السؤال هنا (مثال: ما هي مشقة الدالة e^x؟)"
                            value={q.question}
                            onChange={(e) => handleUpdateAddQuestion(qIdx, e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                          />
                          
                          <div className="grid grid-cols-1 gap-1.5">
                            <input
                              type="text"
                              placeholder="الخيار الصحيح (هذا هو الجواب الصحيح دائماً)"
                              value={q.options[0] || ''}
                              onChange={(e) => handleUpdateAddOption(qIdx, 0, e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-emerald-300 bg-emerald-50/20 text-emerald-950 rounded-lg text-xs font-semibold"
                            />
                            {Array(4).fill(null).map((_, oIdx) => (
                              <input
                                key={oIdx}
                                type="text"
                                placeholder={`خيار خاطئ رقم ${oIdx + 1}`}
                                value={q.options[oIdx + 1] || ''}
                                onChange={(e) => handleUpdateAddOption(qIdx, oIdx + 1, e.target.value)}
                                className="w-full px-2.5 py-1.5 border border-slate-200 text-slate-700 rounded-lg text-xs"
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition-all shadow-md text-xs sm:text-sm uppercase tracking-wider cursor-pointer"
              >
                إدراج وحفظ البيانات (Créer)
              </button>

            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          MODIFICATION (EDIT) FORM OVERLAY MODAL
          ---------------------------------------------------- */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative border border-slate-100">
            
            <button
              onClick={() => setIsEditOpen(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-black text-indigo-600 tracking-wider">formulaire de modification</span>
              <h3 className="text-xl font-black text-slate-900">
                تعديل بيانات الـ {isEditOpen.type === 'level' ? "مستوى" :
                                isEditOpen.type === 'stream' ? "شعبة" :
                                isEditOpen.type === 'subject' ? "مادة" :
                                isEditOpen.type === 'lesson' ? "درس" : "فقرة الدرس"}
              </h3>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              
              {/* Name / Title */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">العنوان / الاسم الجديد</label>
                <input
                  type="text"
                  required
                  value={isEditOpen.type === 'level' || isEditOpen.type === 'stream' || isEditOpen.type === 'subject' ? isEditOpen.data.name : isEditOpen.data.title}
                  onChange={(e) => {
                    const nextVal = e.target.value;
                    setIsEditOpen((prev: any) => ({
                      ...prev,
                      data: {
                        ...prev.data,
                        ...(prev.type === 'level' || prev.type === 'stream' || prev.type === 'subject' ? { name: nextVal } : { title: nextVal })
                      }
                    }));
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-sm"
                />
              </div>

              {/* Subject Edit Fields */}
              {isEditOpen.type === 'subject' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">رمز المادة</label>
                      <input
                        type="text"
                        value={isEditOpen.data.code || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setIsEditOpen((prev: any) => ({ ...prev, data: { ...prev.data, code: val } }));
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-205 focus:ring-2 bg-slate-50 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">اللون</label>
                      <select
                        value={isEditOpen.data.color || 'indigo'}
                        onChange={(e) => {
                          const val = e.target.value;
                          setIsEditOpen((prev: any) => ({ ...prev, data: { ...prev.data, color: val } }));
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-205 focus:ring-2 bg-slate-50 text-sm"
                      >
                        <option value="indigo">Indigo</option>
                        <option value="rose">Rose</option>
                        <option value="emerald">Emerald</option>
                        <option value="amber">Amber</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">الوصف</label>
                    <textarea
                      value={isEditOpen.data.description || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setIsEditOpen((prev: any) => ({ ...prev, data: { ...prev.data, description: val } }));
                      }}
                      rows={3}
                      className="w-full text-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-205 focus:ring-2 bg-slate-50 text-xs"
                    />
                  </div>
                </>
              )}

              {/* Lesson Edit Fields */}
              {isEditOpen.type === 'lesson' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">الدورة (Term)</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                        <input
                          type="radio"
                          name="edit-lesson-term"
                          checked={Number(isEditOpen.data.term) === 1}
                          onChange={() => {
                            setIsEditOpen((prev: any) => ({ ...prev, data: { ...prev.data, term: 1 } }));
                          }}
                        />
                        <span>الدورة الأولى (Semestre 1)</span>
                      </label>
                      <label className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                        <input
                          type="radio"
                          name="edit-lesson-term"
                          checked={Number(isEditOpen.data.term) === 2}
                          onChange={() => {
                            setIsEditOpen((prev: any) => ({ ...prev, data: { ...prev.data, term: 2 } }));
                          }}
                        />
                        <span>الدورة الثانية (Semestre 2)</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">وصف الدرس</label>
                    <textarea
                      value={isEditOpen.data.description || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setIsEditOpen((prev: any) => ({ ...prev, data: { ...prev.data, description: val } }));
                      }}
                      rows={3}
                      className="w-full text-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-250 focus:ring-2 bg-slate-50 text-xs"
                    />
                  </div>
                </>
              )}

              {/* Section Paragraph Edit Fields */}
              {isEditOpen.type === 'section' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">نوع الفقرة (Type)</label>
                    <select
                      value={isEditOpen.data.type || 'video'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setIsEditOpen((prev: any) => ({
                          ...prev,
                          data: { ...prev.data, type: val }
                        }));
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-205 focus:ring-2 bg-slate-50 text-xs font-bold"
                    >
                      <option value="video">فقرة عادية (مقطع فيديو يوتيوب + ملخص الدرس)</option>
                      <option value="practice_exercise">تمارين تطبيقية كلامية ومسائل (مع التفاصيل والتصحيح)</option>
                      <option value="quiz">اختبار تفاعلي تفصيلي (سير العمل 10 أسئلة Quiz)</option>
                    </select>
                  </div>

                  {(isEditOpen.data.type === 'video' || !isEditOpen.data.type) && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">رابط مقطع الشرح يوتيوب (Embed format)</label>
                        <input
                          type="text"
                          value={isEditOpen.data.videoUrl || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setIsEditOpen((prev: any) => ({ ...prev, data: { ...prev.data, videoUrl: val } }));
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-205 focus:ring-2 bg-slate-50 text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">ملخص الأشياء المهمة والملاحظات للفقرة</label>
                        <textarea
                          value={isEditOpen.data.explanationContent || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setIsEditOpen((prev: any) => ({ ...prev, data: { ...prev.data, explanationContent: val } }));
                          }}
                          rows={4}
                          className="w-full text-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-205 focus:ring-2 bg-slate-50 text-xs font-sans leading-relaxed"
                        />
                      </div>
                    </>
                  )}

                  {isEditOpen.data.type === 'practice_exercise' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5 font-bold">نص التمرين والأسئلة التطبيقية</label>
                        <textarea
                          value={isEditOpen.data.explanationContent || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setIsEditOpen((prev: any) => ({ ...prev, data: { ...prev.data, explanationContent: val } }));
                          }}
                          rows={4}
                          className="w-full text-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-205 focus:ring-2 bg-slate-50 text-xs font-sans leading-relaxed"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-indigo-700 uppercase mb-1.5 font-bold">الحل النموذجي والتصحيح كلامياً (Correction)</label>
                        <textarea
                          value={isEditOpen.data.exerciseCorrection || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setIsEditOpen((prev: any) => ({ ...prev, data: { ...prev.data, exerciseCorrection: val } }));
                          }}
                          rows={4}
                          className="w-full text-slate-850 px-3.5 py-2.5 rounded-xl border border-indigo-200 focus:ring-2 bg-indigo-50/20 text-xs font-sans leading-relaxed"
                        />
                      </div>
                    </>
                  )}

                  {isEditOpen.data.type === 'quiz' && (
                    <div className="space-y-4 max-h-80 overflow-y-auto pr-1 border border-slate-200 p-3 rounded-xl bg-slate-50/50">
                      <div className="bg-indigo-50 p-2 text-[10px] font-bold text-indigo-800 rounded">
                        تعديل أسئلة الاختبار التفاعلية (Quiz Questions)
                      </div>
                      
                      {/* Make sure we have an array, or fallback if none */}
                      {((isEditOpen.data.quizQuestions || Array(10).fill(null).map(() => ({ question: '', options: ['', '', '', '', ''] }))) as any[]).map((q, qIdx) => (
                        <div key={qIdx} className="bg-white p-3 rounded-lg border border-slate-200 space-y-2 text-right">
                          <span className="text-[10px] font-mono font-bold text-indigo-600">السؤال #{qIdx + 1}</span>
                          
                          <input
                            type="text"
                            placeholder="نص السؤال"
                            value={q.question || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setIsEditOpen((prev: any) => {
                                const list = prev.data.quizQuestions ? [...prev.data.quizQuestions] : Array(10).fill(null).map(() => ({ question: '', options: ['', '', '', '', ''] }));
                                if (!list[qIdx]) list[qIdx] = { question: '', options: ['', '', '', '', ''] };
                                list[qIdx] = { ...list[qIdx], question: val };
                                return { ...prev, data: { ...prev.data, quizQuestions: list } };
                              });
                            }}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                          />
                          
                          <div className="grid grid-cols-1 gap-1">
                            {Array(5).fill(null).map((_, oIdx) => (
                              <input
                                key={oIdx}
                                type="text"
                                placeholder={oIdx === 0 ? "الخيار الصحيح" : `خيار خاطئ رقم ${oIdx}`}
                                value={q.options && q.options[oIdx] !== undefined ? q.options[oIdx] : ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setIsEditOpen((prev: any) => {
                                    const list = prev.data.quizQuestions ? [...prev.data.quizQuestions] : Array(10).fill(null).map(() => ({ question: '', options: ['', '', '', '', ''] }));
                                    if (!list[qIdx]) list[qIdx] = { question: '', options: ['', '', '', '', ''] };
                                    const nextOpts = list[qIdx].options ? [...list[qIdx].options] : ['', '', '', '', ''];
                                    nextOpts[oIdx] = val;
                                    list[qIdx] = { ...list[qIdx], options: nextOpts };
                                    return { ...prev, data: { ...prev.data, quizQuestions: list } };
                                  });
                                }}
                                className={`w-full px-2.5 py-1.5 border rounded-lg text-xs ${oIdx === 0 ? 'border-emerald-300 bg-emerald-50/10' : 'border-slate-200'}`}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl transition-all shadow-md text-xs sm:text-sm uppercase tracking-wider cursor-pointer"
              >
                تحديث وحفظ التعديلات (Enregistrer)
              </button>

            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          CUSTOM DELETE CONFIRMATION MODAL (Iframe Safe)
          ---------------------------------------------------- */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in" dir="rtl">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl relative border border-slate-100 text-right">
            
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-rose-50 text-rose-600 mb-2">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-2 text-center">
              <h3 className="text-lg font-black text-slate-900">
                تأكيد حذف العنصر نهائياً
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-bold">
                هل أنت متأكد من رغبتك في حذف هذا العنصر؟ {deleteConfirmItem.type === 'level' ? 'المستوى' : deleteConfirmItem.type === 'stream' ? 'الشعبة' : deleteConfirmItem.type === 'subject' ? 'المادة' : deleteConfirmItem.type === 'lesson' ? 'الدرس' : 'الفقرة'} المحدد (ID: <span className="font-mono text-rose-600">{deleteConfirmItem.targetId}</span>)؟
              </p>
              <p className="p-3 bg-rose-50 text-rose-800 text-xs rounded-xl font-semibold border border-rose-100">
                ⚠️ تنبيه: هذا الإجراء نهائي ولا يمكن التراجع عنه. سيتم مسح كافة البيانات والمحتويات المرتبطة به فوراً.
              </p>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl transition-all shadow-md text-xs sm:text-sm cursor-pointer"
              >
                تأكيد حذف العنصر
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl transition-all text-xs sm:text-sm cursor-pointer"
              >
                تراجع وإلغاء
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
