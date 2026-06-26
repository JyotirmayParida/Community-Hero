import { ReportStatus, SeverityLevel } from './constants';

export interface Report {
  id: string;
  citizenId: string;
  mediaUrl: string;
  description?: string;
  geo: { lat: number; lng: number };
  category: string;
  severity: SeverityLevel;
  confidence: number;
  status: ReportStatus;
  duplicateOf: string | null;
  department: string | null;
  priority: string | null;
  history: Array<{ status: string; timestamp: string; note: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface SystemConfig {
  categories: string[];
  severityLevels: string[];
  slaHoursByPriority: Record<string, number>;
}

export interface Department {
  id: string;
  name: string;
  category: string;
  contactInfo: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: 'citizen' | 'verifier' | 'admin';
  points: number;
}

export interface IntakePayload {
  citizenId: string;
  mediaUrl: string;
  geo?: { lat: number; lng: number };
  description?: string;
}

