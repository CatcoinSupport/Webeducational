import React, { useState, useEffect } from 'react';
import { BookOpen, UserCheck, Star, Sparkles, Lock, Mail, User, AlertCircle, ShieldEllipsis, ShieldCheck } from 'lucide-react';
import { StudentProfile, AcademicLevel } from '../types';

interface AuthModalProps {
  onLogin: (profile: StudentProfile) => void;
  levels: AcademicLevel[];
}

export default function AuthModal({ onLogin, levels }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [level, setLevel] = useState('2eme');
  const [stream, setStream] = useState('pc');

  // Multi-step: force selection of level and stream if they logged in but do not have one (mandatory)
  const [pendingUser, setPendingUser] = useState<any | null>(null);
  const [pendingLevel, setPendingLevel] = useState('2eme');
  const [pendingStream, setPendingStream] = useState('pc');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFirstUserTip, setIsFirstUserTip] = useState(false);

  // Auto-detect if database is empty so we tip the user that they will be the admin!
  useEffect(() => {
    async function checkSyllabusUsers() {
      try {
        const res = await fetch('/api/syllabus');
        if (res.ok) {
          const data = await res.json();
          if (!data.users || data.users.length === 0) {
            setIsFirstUserTip(true);
          }
        }
      } catch (e) {
        console.error("Failed to check db users state", e);
      }
    }
    checkSyllabusUsers();
  }, []);

  // Update stream when level changes in main registration
  useEffect(() => {
    const selectedLevelObj = levels.find(l => l.id === level);
    if (selectedLevelObj && selectedLevelObj.streams.length > 0) {
      setStream(selectedLevelObj.streams[0].id);
    }
  }, [level, levels]);

  // Update stream when level changes in pending configuration
  useEffect(() => {
    const selectedLevelObj = levels.find(l => l.id === pendingLevel);
    if (selectedLevelObj && selectedLevelObj.streams.length > 0) {
      setPendingStream(selectedLevelObj.streams[0].id);
    }
  }, [pendingLevel, levels]);

  // Register handleSubmit
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMsg("Veuillez remplir tous les champs.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
          academicLevelId: level,
          streamId: stream
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue lors de l'inscription.");
      }

      setSuccessMsg("Votre compte a été créé avec succès !");
      setTimeout(() => {
        onLogin(data.user);
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Login handleSubmit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!email.trim() || !password.trim()) {
      setErrorMsg("Veuillez saisir votre email et votre mot de passe.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Email ou mot de passe incorrect.");
      }

      // Check if standard user lacks stream configuration (mandatory condition)
      if (data.requiresConfig) {
        setPendingUser(data.user);
        setPendingLevel(levels[0]?.id || '2eme');
        return;
      }

      setSuccessMsg("Connexion réussie !");
      setTimeout(() => {
        onLogin(data.user);
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle pending profile level & stream configuration submission
  const handleConfigureProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!pendingUser) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: pendingUser.email,
          academicLevelId: pendingLevel,
          streamId: pendingStream
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur de configuration de profil.");
      }

      setSuccessMsg("Configuration enregistrée avec succès !");
      setTimeout(() => {
        onLogin(data.user);
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const currentLevelObj = levels.find(l => l.id === level);
  const currentLevelStreams = currentLevelObj?.streams || [];

  const currentPendingLevelObj = levels.find(l => l.id === pendingLevel);
  const currentPendingStreams = currentPendingLevelObj?.streams || [];

  // MOCK PROFILE PRE-SETS CHEAT BUTTON (for easy evaluation)
  const loadPreFillCredentials = (type: 'admin' | 'eleve') => {
    if (type === 'admin') {
      setEmail("admin@bac.ma");
      setPassword("admin123");
      setName("Professeur Alami (Admin)");
      setLevel("2eme");
      setStream("sm");
    } else {
      setEmail("etudiant@bac.ma");
      setPassword("etudiant123");
      setName("Youssef Sebti");
      setLevel("2eme");
      setStream("pc");
    }
    setActiveTab('login');
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-slate-800 relative overflow-y-auto">
      <div className="absolute inset-0 opacity-10 bg-moroccan-pattern bg-repeat bg-center"></div>
      
      {/* Centered beautiful Portal Box */}
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-150 overflow-hidden my-8 z-10">
        
        {/* Moroccan background banner */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 p-8 text-center text-white relative">
          <div className="absolute inset-0 opacity-10 bg-moroccan-pattern bg-repeat bg-center"></div>
          <div className="relative">
            <span className="inline-flex items-center justify-center p-2.5 rounded-2xl bg-white/10 backdrop-blur-md mb-3 text-emerald-400">
              <BookOpen className="w-10 h-10" />
            </span>
            <h1 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight">Moul L'Bac AI</h1>
            <p className="text-emerald-250 text-xs sm:text-sm mt-1.5 font-sans font-medium">Plateforme Interactive de Préparation au Baccalauréat National Marocain</p>
          </div>
        </div>

        {/* Warning or information tip */}
        {isFirstUserTip && activeTab === 'register' && !pendingUser && (
          <div className="bg-amber-50 border-b border-amber-200 p-4 text-xs text-amber-900 flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <span className="font-bold">Alerte Chef d'Établissement :</span> Aucun utilisateur n'est configuré. Le premier compte créé sera désigné comme <span className="font-bold underline">l'Administrateur principal</span> avec tous les droits de gestion !
            </div>
          </div>
        )}

        <div className="p-6">
          
          {errorMsg && (
            <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl flex items-center gap-2 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl flex items-center gap-2 text-xs font-bold">
              <UserCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* STEP A: IF USER LOGGED IN BUT HAS NO LEVEL/STREAM DEFINED (MANDATORY REQUIREMENT) */}
          {pendingUser ? (
            <form onSubmit={handleConfigureProfileSubmit} className="space-y-4">
              <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-200 text-center mb-4">
                <ShieldEllipsis className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-800">Étape Obligatoire de Profil</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Marhaban {pendingUser.name}. Pour calibrer Moul L'Bac AI et charger vos cours marocains spécialisés, veuillez renseigner votre niveau d'études.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Niveau d'Étude</label>
                  <select
                    value={pendingLevel}
                    onChange={(e) => setPendingLevel(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-xs sm:text-sm font-semibold"
                  >
                    {levels.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Filière / Branche</label>
                  <select
                    value={pendingStream}
                    onChange={(e) => setPendingStream(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-xs sm:text-sm font-semibold"
                  >
                    {currentPendingStreams.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold tracking-wide shadow-md transition-all cursor-pointer"
              >
                {loading ? "Enregistrement en cours..." : "Valider et ouvrir mes cours"}
              </button>
            </form>
          ) : (
            <>
              {/* NORMAL REGISTER / LOGIN TABS */}
              <div className="flex border-b border-slate-200 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setErrorMsg('');
                  }}
                  className={`flex-1 pb-3 text-center text-xs sm:text-sm font-extrabold border-b-2 transition-all cursor-pointer ${
                    activeTab === 'register' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 inline mr-1 text-amber-500 fill-amber-500" />
                  Créer un compte (Inscription)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setErrorMsg('');
                  }}
                  className={`flex-1 pb-3 text-center text-xs sm:text-sm font-extrabold border-b-2 transition-all cursor-pointer ${
                    activeTab === 'login' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Déjà Inscrit ? (Se Connecter)
                </button>
              </div>

              {/* REGISTER TAB FORM */}
              {activeTab === 'register' ? (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" /> Nom complet
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex. Amine El Alami"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white transition-all text-xs sm:text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" /> Adresse Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Ex. amine@gmail.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white transition-all text-xs sm:text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-slate-400" /> Mot de passe
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Créez votre mot de passe"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white transition-all text-sm font-semibold"
                    />
                  </div>

                  {/* Mandate selection of stream and academic levels during registration */}
                  <div className="grid grid-cols-2 gap-4 pt-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Niveau d'Étude</label>
                      <select
                        value={level}
                        onChange={(e) => setLevel(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white rounded-lg text-xs"
                      >
                        {levels.map(l => (
                          <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Filière / Branche</label>
                      <select
                        value={stream}
                        onChange={(e) => setStream(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white rounded-lg text-xs"
                      >
                        {currentLevelStreams.map((s: any) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold tracking-wide shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
                  >
                    <UserCheck className="w-5 h-5" />
                    {loading ? "Création du compte..." : "Créer mon compte & Commencer"}
                  </button>
                </form>
              ) : (
                /* LOGIN TAB FORM */
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" /> Adresse Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Ex. amine@gmail.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white transition-all text-xs sm:text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-slate-400" /> Mot de passe
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Entrez votre mot de passe"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white transition-all text-sm font-semibold"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold tracking-wide shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
                  >
                    <UserCheck className="w-5 h-5" />
                    {loading ? "Connexion..." : "Se connecter"}
                  </button>
                </form>
              )}

              {/* CONVENIENT SHORTCUTS FOR CONVERSATION EVALUATION */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/50 mt-6 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block mb-2">💡 Raccourcis d'évaluation rapide</span>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    type="button"
                    onClick={() => loadPreFillCredentials('eleve')}
                    className="px-2.5 py-1 text-[11px] bg-white border border-slate-200 hover:border-emerald-500 text-slate-700 font-bold rounded shadow-sm hover:bg-emerald-50/50"
                  >
                    Formulaire élève démo
                  </button>
                  <button
                    type="button"
                    onClick={() => loadPreFillCredentials('admin')}
                    className="px-2.5 py-1 text-[11px] bg-white border border-slate-200 hover:border-emerald-500 text-slate-700 font-bold rounded shadow-sm hover:bg-emerald-50/50"
                  >
                    Formulaire admin démo
                  </button>
                </div>
              </div>
            </>
          )}

        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100/80 text-center text-[11px] text-slate-400">
          Système conforme aux exigences du décret de l'Éducation Nationale du Maroc.
        </div>
      </div>
    </div>
  );
}
