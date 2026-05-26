import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import Dashboard from './components/Dashboard';
import LessonViewer from './components/LessonViewer';
import AiTutor from './components/AiTutor';
import AdminPanel from './components/AdminPanel';
import SubjectChooser from './components/SubjectChooser';
import LessonSelector from './components/LessonSelector';
import { AcademicLevel, Subject, Lesson, StudentProfile, ForumComment } from './types';
import { Sparkles, MessageSquareCode, Layers } from 'lucide-react';

export default function App() {
  // Application view states with explicit type safety mapping for student navigation streams
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [levels, setLevels] = useState<AcademicLevel[]>([]);
  const [forumComments, setForumComments] = useState<ForumComment[]>([]);
  const [activeView, setActiveView] = useState<'dashboard' | 'subjects' | 'lessons' | 'lesson-viewer' | 'admin'>('dashboard');
  
  // Selection states
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [completedSections, setCompletedSections] = useState<string[]>([]);

  // AI Drawer states
  const [isAiTutorOpen, setIsAiTutorOpen] = useState(false);
  const [aiQuickPrompt, setAiQuickPrompt] = useState<string | undefined>(undefined);

  // Load initial syllabus and comments from full-stack server
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/syllabus');
        if (res.ok) {
          const data = await res.json();
          setLevels(data.academicLevels || []);
          setForumComments(data.forumComments || []);
        }
      } catch (err) {
        console.error("Failed to fetch starting syllabus from Express API:", err);
      }
    }
    fetchData();

    // Recover student progress from client-side persistent storage
    const storedCompleted = localStorage.getItem('bac_completed_sections');
    if (storedCompleted) {
      try {
        setCompletedSections(JSON.parse(storedCompleted));
      } catch (e) {
        console.error("Failed parsing stored progress states.", e);
      }
    }

    // Recover active student profile if any
    const storedProfile = localStorage.getItem('bac_student_profile');
    if (storedProfile) {
      try {
        setProfile(JSON.parse(storedProfile));
      } catch (e) {
        console.error("Failed parsing stored profile states.", e);
      }
    }
  }, []);

  // Save profile helper
  const handleLogin = (newProfile: StudentProfile) => {
    setProfile(newProfile);
    localStorage.setItem('bac_student_profile', JSON.stringify(newProfile));
  };

  const handleLogout = () => {
    setProfile(null);
    localStorage.removeItem('bac_student_profile');
    setActiveView('dashboard');
  };

  // Toggle Section study steps completed status
  const handleToggleSectionDone = (sectionId: string) => {
    if (!profile) return;

    let updatedList = [...completedSections];
    let xpGain = 0;

    if (completedSections.includes(sectionId)) {
      // Remove it
      updatedList = updatedList.filter(id => id !== sectionId);
      xpGain = -20;
    } else {
      // Add it
      updatedList.push(sectionId);
      xpGain = 20;
    }

    setCompletedSections(updatedList);
    localStorage.setItem('bac_completed_sections', JSON.stringify(updatedList));

    // Grant XP points in profile and save
    const updatedProfile = {
      ...profile,
      totalXP: Math.max(0, profile.totalXP + xpGain)
    };
    setProfile(updatedProfile);
    localStorage.setItem('bac_student_profile', JSON.stringify(updatedProfile));

    // Sync to backend DB asynchronously
    fetch('/api/auth/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: profile.email, totalXP: updatedProfile.totalXP })
    }).catch(e => console.error("Error syncing points to DB", e));
  };

  // Save/Update syllabus via admin panel API
  const handleSaveSyllabus = async (updatedLevels: AcademicLevel[]) => {
    try {
      const response = await fetch('/api/syllabus/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ academicLevels: updatedLevels })
      });

      if (response.ok) {
        const data = await response.json();
        setLevels(data.academicLevels);
      } else {
        console.error("Failed saving updated syllabus metadata.");
      }
    } catch (err) {
      console.error("Failed calling fallback save API endpoint.", err);
    }
  };

  // Add a comment to the forum and synchronize with server
  const handleAddComment = async (commentData: { lessonId: string; sectionId?: string; content: string }) => {
    if (!profile) return;
    try {
      const response = await fetch('/api/forum/comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...commentData,
          userName: profile.name,
          userEmail: profile.email
        })
      });

      if (response.ok) {
        const newComment = await response.json();
        setForumComments(prev => [...prev, newComment]);
        
        // Award +5 XP bonus for participating in academic thread discussions !
        const updatedProfile = {
          ...profile,
          totalXP: profile.totalXP + 5
        };
        setProfile(updatedProfile);
        localStorage.setItem('bac_student_profile', JSON.stringify(updatedProfile));
      }
    } catch (err) {
      console.error("Failed posting user comment.", err);
    }
  };

  // Remove a comment
  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/forum/comment/${commentId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setForumComments(prev => prev.filter(c => c.id !== commentId));
      }
    } catch (err) {
      console.error("Failed deleting comment.", err);
    }
  };

  const handleSelectLesson = (subject: Subject, lesson: Lesson) => {
    setSelectedSubject(subject);
    setSelectedLesson(lesson);
    setActiveView('lesson-viewer');
  };

  const handleAskAiTutor = (textToPrompt: string) => {
    setIsAiTutorOpen(true);
    setAiQuickPrompt(textToPrompt);
  };

  return (
    <div id="react-app-container" className="min-h-screen bg-slate-50 flex flex-col relative font-sans antialiased text-slate-800">
      
      {/* If profile doesn't exist, show welcome registration screen */}
      {!profile ? (
        <AuthModal onLogin={handleLogin} levels={levels} />
      ) : (
        <>
          {/* Main Top Header Navigation */}
          <Navbar 
            profile={profile}
            currentView={activeView}
            onNavigate={(view) => {
              setActiveView(view);
              setIsAiTutorOpen(false); // Close AI drawer if switching views
            }}
            onLogout={handleLogout}
          />

          {/* Core Content Body */}
          <main className="flex-grow pb-16">
            {activeView === 'dashboard' && (
              <Dashboard 
                levels={levels}
                profile={profile}
                completedSections={completedSections}
                onNavigate={setActiveView}
              />
            )}

            {activeView === 'subjects' && (
              <SubjectChooser
                levels={levels}
                profile={profile}
                onSelectSubject={(subj) => {
                  setSelectedSubject(subj);
                  setActiveView('lessons');
                }}
                onNavigateHome={() => setActiveView('dashboard')}
              />
            )}

            {activeView === 'lessons' && selectedSubject && (
              <LessonSelector
                subject={selectedSubject}
                completedSections={completedSections}
                onSelectLesson={(lsn) => {
                  setSelectedLesson(lsn);
                  setActiveView('lesson-viewer');
                }}
                onBack={() => setActiveView('subjects')}
              />
            )}

            {activeView === 'lesson-viewer' && selectedSubject && selectedLesson && (
              <LessonViewer 
                subject={selectedSubject}
                lesson={selectedLesson}
                profile={profile}
                completedSections={completedSections}
                forumComments={forumComments}
                onToggleSectionDone={handleToggleSectionDone}
                onBackToDashboard={() => setActiveView('lessons')}
                onAddComment={handleAddComment}
                onDeleteComment={handleDeleteComment}
                onAskAiTutor={handleAskAiTutor}
              />
            )}

            {activeView === 'admin' && (
              <AdminPanel 
                levels={levels}
                onSaveSyllabus={handleSaveSyllabus}
                onClose={() => setActiveView('dashboard')}
              />
            )}
          </main>

          {/* Floating AI Tutor trigger widget */}
          <button
            id="floating-ai-tutor-bubble"
            onClick={() => setIsAiTutorOpen(!isAiTutorOpen)}
            className="fixed bottom-6 right-6 z-45 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-emerald-700 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95 group focus:outline-none cursor-pointer"
            title="Poser une question à Moul L'Bac AI"
          >
            <Sparkles className="w-5 h-5 fill-white text-white group-hover:rotate-12 transition-transform" />
            <span className="text-xs sm:text-sm">Tuteur Moul L'Bac AI</span>
          </button>

          {/* Moul L'Bac AI Sidebar panel */}
          <AiTutor 
            profile={profile}
            activeSubjectName={selectedSubject?.name}
            activeLessonTitle={selectedLesson?.title}
            isOpen={isAiTutorOpen}
            onClose={() => setIsAiTutorOpen(false)}
            quickPromptText={aiQuickPrompt}
            onClearQuickPrompt={() => setAiQuickPrompt(undefined)}
          />

          {/* Clean, tiny professional copyright footer */}
          <footer className="bg-slate-900 text-slate-500 py-6 text-center text-xs mt-auto border-t border-slate-850">
            <div className="max-w-7xl mx-auto px-4 space-y-2">
              <p className="font-display font-medium text-slate-400">BacPrep Maroc — Moul L'Bac AI Platform</p>
              <p>Directives conformes aux examens nationaux marocains pour 1ère Bac et 2ème Bac.</p>
              <p className="text-[10px] text-slate-600">© 2026 BacPrep MA. Tout droit réservé.</p>
            </div>
          </footer>
        </>
      )}

    </div>
  );
}
