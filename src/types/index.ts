export interface Player {
  id: string;
  name: string;
  readiness_score: number;
  hrv_data: { time: string; value: number }[];
  sleep_cycles: { deep_sleep: string; rem: string };
  tactical_position: string;
  scouting_metrics: { [key: string]: number };
  image_url?: string; // For Locker Room cards
  stats?: {
    pace: number;
    shooting: number;
    passing: number;
    dribbling: number;
    defending: number;
    physical: number;
  };
  biometrics?: {
    weight: number;
    body_fat: number;
    muscle_mass: number;
  };
  activity?: {
    max_hr: number;
    resting_hr: number;
    calories_burned: number;
  };
  star_rating?: number; // 1-5
  status_override?: 'GREEN' | 'YELLOW' | 'RED';
  category: 'PRO' | 'YOUTH';
}

export type Persona = 'TRAINER' | 'MANAGER' | 'DOCTOR';

export type FormationType = '4-4-2' | '3-4-3' | '4-3-3';

export interface MatchState {
  isActive: boolean;
  homeFormation: FormationType;
  awayFormation: FormationType;
  minute: number;
  score: { home: number; away: number };
}

export interface Sponsor {
  id: string;
  name: string;
  tier: 'PLATINUM' | 'GOLD' | 'SILVER';
  value: string;
  roi: number;
  status: 'ACTIVE' | 'NEGOTIATION' | 'PENDING';
}

export interface Article {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  author: string;
  date: string;
  image_url?: string;
  tags: string[];
}

export interface PressQuestion {
  id: string;
  text: string;
  tone: 'AGGRESSIVE' | 'NEUTRAL' | 'PRAISING';
  context: string;
}

export interface InterviewSession {
  id: string;
  clipId: string;
  playerId: string;
  playerName: string;
  topic: string;
  questions: PressQuestion[];
  answers: string[];
  articleHeadline?: string;
  articleBody?: string;
  date: string;
}

export interface MediaEntry {
  id: string;
  title: string;
  thumbnailUrl: string;
  videoUrl: string;
  date: string;
  duration: string;
  type: 'TACTICAL' | 'PRESS' | 'SPONSOR';
  persona: 'TRAINER' | 'MANAGER' | 'PRESS' | 'CFO';
  tags: string[];
  impactScore: number; // 0-100
  transcript?: string;
  sponsorVisibility?: 'HIGH' | 'MEDIUM' | 'LOW';
}
