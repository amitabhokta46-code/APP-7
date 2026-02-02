
export enum AppSection {
  STUDY_SLEEP = 'study_sleep',
  MOCK_TESTS = 'mock_tests',
  FITNESS = 'fitness',
  SYLLABUS = 'syllabus',
  PLANNER = 'planner',
  KNOWLEDGE_HUB = 'knowledge_hub',
  FOCUS = 'focus',
  DASHBOARD = 'dashboard',
  PROFILE = 'profile',
  HABITS = 'habits',
  REMINDERS = 'reminders',
  GOV_EXAM_MOCK = 'gov_exam_mock'
}

export type GovExamType = 'UPSC' | 'SSC' | 'State PSC' | 'Banking' | 'Railways' | 'Defence' | 'Insurance';

export interface GovQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  type: 'Factual' | 'Conceptual' | 'Analytical' | 'Numerical' | 'Assertion-Reason';
  topic: string;
}

export interface GovMockInstance {
  id: string;
  exam: GovExamType;
  subject: string;
  topic: string;
  questions: GovQuestion[];
  userAnswers: (number | null)[];
  markedForReview: boolean[];
  startTime: number;
  endTime?: number;
  score: number;
  totalMarks: number;
  negativeMarking: number; // e.g. 0.33
  language: 'EN' | 'HI';
  mistakesAnalyzed: boolean;
}

export interface GovMistake {
  id: string;
  question: GovQuestion;
  userAnswerIndex: number;
  timestamp: number;
  category: 'Conceptual' | 'Factual' | 'Calculation' | 'Silly';
}

export interface AIChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  time: string; 
  date: string; 
  type: 'one-time' | 'daily' | 'weekly';
  status: 'active' | 'fired' | 'snoozed';
  soundEnabled: boolean;
  linkedId?: string; 
  linkedType?: 'habit' | 'task' | 'topic';
}

export interface Habit {
  id: string;
  name: string;
  category: string;
  frequency: 'daily' | 'weekly';
  history: Record<string, boolean>; 
  streak: number;
  lastUpdated: string;
}

export interface UserProfile {
  name: string;
  age?: number;
  examTargets: string[];
  preferredStudyStart: string; 
  preferredStudyEnd: string;   
  dailyGoalHours: number;
  timezone: string;
  disciplineScore: number;
}

export interface StudySession {
  id: string;
  subjectId: string;
  subTopic?: string;
  notes?: string;
  duration: number; 
  timestamp: number;
  type: 'deep' | 'light';
  focusRating?: number; 
  energyLevel?: 'Low' | 'Medium' | 'High';
}

export interface SleepSession {
  id: string;
  duration: number; 
  quality: number; 
  timestamp: number;
  disturbanceNotes?: string;
  lateNightScreen?: boolean;
}

export interface ExerciseSession {
  id: string;
  type: string;
  subCategory?: string;
  duration: number; 
  intensity: 'Low' | 'Medium' | 'High';
  calories: number;
  notes?: string;
  energyRating: number; 
  muscleSoreness: number; 
  timestamp: number;
}

export interface BodyMetrics {
  weight?: number;
  waist?: number;
  restingHR?: number;
  timestamp: number;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  syllabusProgress: number; 
  priority: 'High' | 'Medium' | 'Low';
  archived: boolean;
}

export interface SyllabusNode {
  id: string;
  name: string;
  stages: boolean[]; 
  stageTimestamps: (number | null)[];
  confidence: number; 
  difficulty: 'easy' | 'moderate' | 'hard';
  weightage: 'Low' | 'Medium' | 'High';
  expectedQuestions: number;
  recallNotes?: string;
  mindMapUrl?: string;
  subTopics?: SyllabusNode[];
  lastRevisionDate?: number;
  nextRevisionDate?: number; // Spaced Repetition Logic
  revisionLevel: number; 
}

export type TaskCategory = 'Study' | 'Revision' | 'Test' | 'Exercise' | 'Personal' | 'Rest';
export type Priority = 'High' | 'Medium' | 'Low';
export type EnergyLevel = 'High' | 'Medium' | 'Low';
export type EisenhowerType = 'Urgent-Important' | 'Not Urgent-Important' | 'Urgent-Not Important' | 'Not Urgent-Not Important';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  linkedSubjectId?: string;
  linkedTopicId?: string;
  startTime: string; 
  endTime: string; 
  estimatedTime?: number; 
  duration: number; 
  completed: boolean;
  priority: Priority;
  energyRequired: EnergyLevel;
  repeat: 'None' | 'Daily' | 'Weekly' | 'Monthly' | 'Custom';
  repeatDays?: number[]; 
  repeatInterval?: number; 
  eisenhower: EisenhowerType;
  dependencies?: string[];
  isRoutine?: boolean;
  routineGroup?: 'Morning' | 'Study' | 'Coaching' | 'Evening' | 'Night';
  automationSource?: 'WeakTopic' | 'MockError' | 'MissedRevision';
  rescheduleCount: number;
  incompleteReason?: string;
  subTasks?: SubTask[];
}

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface Goal {
  id: string;
  title: string;
  startDate?: number;
  deadline: number;
  progress: number;
  linkedTopics?: string[];
  type: 'short' | 'long' | 'exam';
  milestones?: Milestone[];
  priority: Priority;
}

export interface MockTest {
  id: string;
  name: string;
  subjectId: string;
  type: string;
  totalMarks: number;
  scoreObtained: number;
  timeTaken: number;
  timeLimit: number;
  attempted: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  timestamp: number;
  errorCategories: {
    conceptual: number;
    calculation: number;
    guessing: number;
    timePressure: number;
    silly: number;
  };
  notes?: string;
  mistakes?: MockMistake[];
  aiAnalysis?: string; // AI Performance Report
}

export interface MockMistake {
  id: string;
  topicId: string;
  questionNumber: string;
  errorType: 'Conceptual' | 'Factual' | 'Silly' | 'Time Pressure';
  notes: string;
}

export interface FocusMode {
  id: string;
  name: string;
  studyTime: number; 
  breakTime: number; 
  defaultSoundId?: string;
  examMode?: boolean;
}

export interface FocusSound {
  id: string;
  name: string;
  url: string;
  type: 'white' | 'nature' | 'lofi' | 'classical' | 'binaural' | 'silent' | 'youtube' | 'file';
  isPlaying?: boolean;
}

export enum ExamPhase {
  FOUNDATION = 'Foundation',
  REVISION = 'Revision',
  TEST_PHASE = 'Test Phase',
  FINAL_SPRINT = 'Final Sprint'
}

export interface ExamGoal {
  id: string;
  name: string;
  type: 'Prelims' | 'Mains' | 'Interview' | 'Mock';
  date: number;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Upcoming' | 'Ongoing' | 'Completed';
  totalHoursRequired: number;
  totalSyllabusUnits: number;
  restDaysPerWeek: number;
  bufferDaysAdded?: number;
  currentPhase?: ExamPhase;
}

export interface FocusSession {
  id: string;
  modeId: string;
  subjectId: string;
  topicName: string;
  goalStatement: string;
  startEnergy: number;
  duration: number; 
  interruptionCount: number;
  completed: boolean;
  focusScore: number;
  timestamp: number;
  musicUsedId?: string;
  notes?: string;
  focusRating?: number; 
  examLinkId?: string;
}

export interface HubBook {
  id: string;
  name: string;
  author: string;
  category: string;
  status: string;
  notes: string;
  keyTakeaways: string[];
  audioUrl: string;
  fiveLineRecall: string;
  aiSynthesis?: string; // AI generated summary
}

export interface HubSyllabusMaterial {
  id: string;
  subjectId: string;
  name: string;
  importance: 'Low' | 'Medium' | 'High';
  notes: string;
  youtubeLinks: string[];
  pdfUrls: string[];
  audioUrl: string;
}

export interface HubPersonalityTopic {
  id: string;
  category: string;
  title: string;
  notes: string;
  audioUrl: string;
  youtubeUrl: string;
}

export interface HubMistakeEntry {
  id: string;
  subjectId: string;
  topicId: string;
  mistake: string;
  correction: string;
  timestamp: number;
}

export interface DistractionLog {
  id: string;
  timestamp: number;
  reason: string;
  duration: number; 
}

// Fixed missing interface definition
export interface NoteCheckpoint {
  id: string;
  text: string;
  done: boolean;
}

// Fixed missing interface definition
export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  lastEdited: number;
  isPinned: boolean;
  checkpoints: NoteCheckpoint[];
}

export interface AppState {
  profile: UserProfile;
  studySessions: StudySession[];
  sleepSessions: SleepSession[];
  exerciseSessions: ExerciseSession[];
  bodyMetrics: BodyMetrics[];
  subjects: Subject[];
  mockTests: MockTest[];
  tasks: Task[];
  goals: Goal[];
  syllabus: Record<string, SyllabusNode[]>;
  hubBooks: HubBook[];
  hubSyllabus: HubSyllabusMaterial[];
  hubPersonality: HubPersonalityTopic[];
  focusSessions: FocusSession[];
  distractionLogs: DistractionLog[];
  habits: Habit[];
  notes: Note[];
  reminders: Reminder[];
  examDate: number;
  lastRoutineReset?: string;
  focusModes: FocusMode[];
  focusSounds: FocusSound[];
  exams: ExamGoal[];
  disciplineStreak: number;
  lastBackupDate: number;
  theme: 'light' | 'dark' | 'night';
  appLockPin?: string;
  oneHandMode: boolean;
  aiChatHistory: AIChatMessage[];
  govMockHistory: GovMockInstance[];
  mistakeNotebook: GovMistake[];
}
