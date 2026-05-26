import React, { useState } from 'react';
import { BookOpen, LogOut, Instagram, ShieldAlert, BookMarked, Home, MoreVertical, X } from 'lucide-react';
import { StudentProfile } from '../types';

interface NavbarProps {
  profile: StudentProfile | null;
  currentView: 'dashboard' | 'subjects' | 'lessons' | 'lesson-viewer' | 'admin';
  onNavigate: (view: 'dashboard' | 'subjects' | 'lessons' | 'lesson-viewer' | 'admin') => void;
  onLogout: () => void;
}

export default function Navbar({
  profile,
  currentView,
  onNavigate,
  onLogout
}: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  if (!profile) return null;

  const handleLinkClick = (view: 'dashboard' | 'subjects' | 'lessons' | 'lesson-viewer' | 'admin') => {
    onNavigate(view);
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-sm px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16">
        
        {/* Brand/Logo on the Left */}
        <button 
          onClick={() => handleLinkClick('dashboard')} 
          className="flex items-center gap-2.5 text-left hover:opacity-90 active:scale-95 transition-all focus:outline-none cursor-pointer"
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/15">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-emerald-950 leading-none">
              Moul <span className="text-emerald-600">L'Bac AI</span>
            </h1>
            <span className="block text-[8px] text-slate-400 font-extrabold uppercase tracking-widest mt-0.5">
              BAC PREP MA
            </span>
          </div>
        </button>

        {/* 3-Dots Action Button on the Right */}
        <div className="relative">
          <button
            id="three-dots-menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1"
            title="القائمة (Menu)"
          >
            {menuOpen ? <X className="w-5 h-5 text-slate-900" /> : <MoreVertical className="w-5 h-5 text-slate-700" />}
            <span className="text-xs font-bold font-display ml-0.5 hidden sm:inline text-slate-800">الأقسام (Sections)</span>
          </button>

          {/* Expanded Dropdown Menu containing the requested sections */}
          {menuOpen && (
            <>
              {/* Overlay Backdrop to easily close the dropdown */}
              <div 
                className="fixed inset-0 z-40 cursor-default" 
                onClick={() => setMenuOpen(false)}
              ></div>
              
              <div 
                id="three-dots-dropdown-menu" 
                className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-150 py-2.5 z-50 animate-fade-in text-right"
                style={{ direction: 'rtl' }}
              >
                <div className="px-4 py-2 border-b border-slate-100 text-right mb-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">أقسام الموقع (Navigation)</p>
                  <p className="text-xs font-bold text-slate-700 truncate">{profile.name}</p>
                </div>

                {/* 1. الرئيسية / Dashboard */}
                <button
                  id="nav-link-dashboard"
                  onClick={() => handleLinkClick('dashboard')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold transition-all ${
                    currentView === 'dashboard'
                      ? "text-emerald-600 bg-emerald-50/50"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Home className="w-4.5 h-4.5 text-slate-500" />
                  <span>لوحة التحكم الرئيسية</span>
                </button>

                {/* 2. المواد / Subjects */}
                <button
                  id="nav-link-subjects"
                  onClick={() => handleLinkClick('subjects')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold transition-all ${
                    currentView === 'subjects' || currentView === 'lessons' || currentView === 'lesson-viewer'
                      ? "text-emerald-600 bg-emerald-50/50"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <BookMarked className="w-4.5 h-4.5 text-slate-500" />
                  <span>المواد الدراسية (Matières)</span>
                </button>

                {/* 3. حسابنا على الانستا / Instagram */}
                <a
                  href="https://www.instagram.com/obito_p_y?igsh=MWQyMjNsdzhpcDNnMw=="
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-600 transition-all text-right"
                >
                  <Instagram className="w-4.5 h-4.5 text-pink-500" />
                  <span>حسابنا على إنستغرام</span>
                </a>

                {/* 4. لوحة أدمن (Only visible if isAdmin) */}
                {profile.isAdmin && (
                  <button
                    id="nav-link-admin"
                    onClick={() => handleLinkClick('admin')}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold transition-all ${
                      currentView === 'admin'
                        ? "text-indigo-600 bg-indigo-55 bg-indigo-50/70"
                        : "text-amber-800 bg-amber-50/45 hover:bg-amber-50"
                    }`}
                  >
                    <ShieldAlert className="w-4.5 h-4.5 text-amber-600" />
                    <span>لوحة التحكم للأدمن (Admin)</span>
                  </button>
                )}

                {/* Separator */}
                <div className="my-1.5 border-t border-slate-100"></div>

                {/* 5. تسجيل الخروج / Log out */}
                <button
                  id="nav-link-logout"
                  onClick={() => {
                    setMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 transition-all text-right"
                >
                  <LogOut className="w-4.5 h-4.5 text-rose-500" />
                  <span>تسجيل الخروج (Log out)</span>
                </button>

              </div>
            </>
          )}

        </div>

      </div>
    </header>
  );
}
