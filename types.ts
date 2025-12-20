
export interface MemoryEntry {
  id: string;
  timestamp: number;
  originalText: string;
  imageUrl?: string; // 用户上传的原图
  generatedCardUrl?: string; // AI 生成的风格化卡片
  
  userMood?: number; // 用户手动输入的心情指数 0-100
  visualStyle?: string; // 视觉风格 (chiikawa, maltese, naruto, custom...)
  
  // AI Extracted Data
  title: string;
  summary: string;
  tags: string[];
  rating: number; // 1-5
  importance: 'low' | 'medium' | 'high';
  actionItems: string[];
  
  // New field to distinguish daily summaries
  type?: 'entry' | 'daily_report'; 
}

export interface Goal {
  id: string;
  text: string;
  deadline: string; // ISO date string
  status: 'active' | 'completed' | 'dropped';
  aiFeedback?: string;
}

export interface UserProfile {
  archetype?: string; // e.g. "熬夜冠军"
  summary: string; // The "Roast"
  detailedAnalysis?: string; // The content for the back of the card
  strengths: string[];
  areasForImprovement: string[];
  recentMood: string;
}

export enum AppView {
  JOURNAL = 'JOURNAL',
  TIMELINE = 'TIMELINE',
  MILESTONES = 'MILESTONES', // New View
  CAPTURE = 'CAPTURE',
  PROFILE = 'PROFILE',
  GOALS = 'GOALS'
}
