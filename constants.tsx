
import React from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Trophy, 
  HeartPulse, 
  ScrollText, 
  CalendarDays, 
  Library, 
  Target,
  CircleCheck,
  Bell,
  FileQuestion
} from 'lucide-react';
import { AppSection } from './types';

export const NAV_ITEMS = [
  { id: AppSection.DASHBOARD, label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: AppSection.GOV_EXAM_MOCK, label: 'Gov Test AI', icon: <FileQuestion size={20} /> },
  { id: AppSection.STUDY_SLEEP, label: 'Study & Sleep', icon: <BookOpen size={20} /> },
  { id: AppSection.MOCK_TESTS, label: 'Mock History', icon: <Trophy size={20} /> },
  { id: AppSection.HABITS, label: 'Habit Hub', icon: <CircleCheck size={20} /> },
  { id: AppSection.REMINDERS, label: 'Neural Alarms', icon: <Bell size={20} /> },
  { id: AppSection.FITNESS, label: 'Fitness', icon: <HeartPulse size={20} /> },
  { id: AppSection.SYLLABUS, label: 'Syllabus', icon: <ScrollText size={20} /> },
  { id: AppSection.PLANNER, label: 'Planner', icon: <CalendarDays size={20} /> },
  { id: AppSection.KNOWLEDGE_HUB, label: 'Knowledge Hub', icon: <Library size={20} /> },
  { id: AppSection.FOCUS, label: 'Focus Mode', icon: <Target size={20} /> },
];

export const SYLLABUS_STAGES = [
  "To-Do",
  "Video (1x)",
  "First Reading",
  "Video (2x)",
  "24h Revision",
  "Test 1",
  "7d Revision",
  "Weekly Reinforce",
  "Structured Rev",
  "Test 2",
  "30d Revision",
  "Mind Maps",
  "Test/Error Log",
  "Final Mastery"
];

export const SUBJECT_COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#f43f5e'
];
