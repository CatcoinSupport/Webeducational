export interface QuizQuestion {
  question: string;
  options: string[]; // correct answer is options[0], rest are wrong options. We shuffle them on load.
}

export interface LessonSection {
  id: string;
  title: string;
  type: 'video' | 'explanation' | 'exercise' | 'review' | 'quiz' | 'practice_exercise';
  videoUrl?: string; // Embedded YouTube or mock video path
  duration: string; // e.g. "12 mins"
  explanationContent?: string; // Markdown summary/formulas
  exerciseQuestion?: string; // For single option question
  exerciseOptions?: string[];
  exerciseAnswerIndex?: number;
  exerciseExplanation?: string;
  quizQuestions?: QuizQuestion[]; // For interactive quiz of 10+ questions
  exerciseCorrection?: string; // Solution/correction for exercise
  reviewCheatSheet?: string; // Summary formula sheets
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  term: 1 | 2; // Semester 1 or Semester 2
  sections: LessonSection[];
}

export interface Subject {
  id: string;
  name: string; // e.g. "Mathématiques", "Physique-Chimie"
  code: string; // e.g. "MATH", "PHYS"
  color: string; // Tailwind color class, e.g. "indigo"
  description: string;
  lessons: Lesson[];
}

export interface Stream {
  id: string; // e.g. "sm" (Sciences Mathématiques), "pc" (Sciences Physiques)
  name: string; // e.g. "Sciences Mathématiques", "Sciences Physiques"
  academicLevelId: string; // "1ere" or "2eme"
  subjects: Subject[];
}

export interface AcademicLevel {
  id: string; // "1ere" (1ère Bac), "2eme" (2ème Bac)
  name: string; // "1ère Année Baccalauréat", "2ème Année Baccalauréat"
  streams: Stream[];
}

export interface StudentProfile {
  name: string;
  email: string;
  password?: string;
  academicLevelId: string; // "1ere" | "2eme"
  streamId: string; // e.g. "sm" | "pc"
  joinedAt: string;
  totalXP: number;
  dailyStreak: number;
  isPremium?: boolean;
  isAdmin?: boolean;
}

export interface ProgressState {
  completedSections: string[]; // List of sectionIds finished
  completedLessons: string[]; // List of lessonIds finished
  lastActiveDate?: string;
}

export interface ForumComment {
  id: string;
  lessonId: string;
  sectionId?: string;
  userName: string;
  userEmail: string;
  content: string;
  createdAt: string;
}
