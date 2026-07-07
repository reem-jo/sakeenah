/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MoodLog {
  date: string; // ISO date YYYY-MM-DD
  emoji: string; // 😔, 😐, 😊, 😭, etc.
  note?: string;
}

export interface Patient {
  id: string; // Random alias like "Guest_721" or "User_9921"
  displayName: string;
  moodTrackerHistory: MoodLog[];
  createdAt: string;
}

export type SpecialistRole = 'Psychologist' | 'Counselor';

export interface Specialist {
  id: string;
  fullName: string;
  licenseFileUrl?: string;
  isVerified: boolean;
  roleType: SpecialistRole;
  isOnline: boolean;
  rating: number;
  experienceYears: number;
  specialties: string[];
}

export interface AudioSentimentPayload {
  anxietyLevel: number;        // Percentage 0-100
  depressiveMarkers: number;   // Percentage 0-100
  agitationIndex: number;      // Percentage 0-100
  clinicalInsights: string;    // Custom textual insights from pitch/pauses/vibrato
}

export interface CaseFile {
  id: string;
  patientAlias: string;
  specialistId: string;
  secureFolderPinHash: string; // Secondary passcode (plaintext match for simplicity in prototype, compared securely on server)
  aiTranscriptionText: string;
  aiSentimentPayload: AudioSentimentPayload;
  chiefComplaint: string;
  duration: string;
  identifiedSymptoms: string[];
  createdAt: string;
  status: 'Active' | 'Closed';
}

export interface SOSRequest {
  id: string;
  patientAlias: string;
  matchedSpecialistId?: string;
  status: 'Pending' | 'Connected' | 'Bypassed';
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'specialist';
  text: string;
  timestamp: string;
  spiritualComfort?: {
    verses: string[];
    hadiths: string[];
    actions: string[];
  };
}
