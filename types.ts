
export type Round = '1' | '2';
export type Group = 'junior' | 'senior'; // New Group Type

export interface Entry {
  id: string;
  participantId: string;
  participantName: string;
  group: Group; // Added group
  round: Round;
  score: number;
  time: number;
  timestamp: number;
}

export interface ParticipantStats {
  participantId: string;
  participantName: string;
  group: Group; // Added group
  bestEntry: Entry | null;
  round1: Entry | null;
  round2: Entry | null;
  rank?: number;
}

export interface RosterItem {
  id: string;
  name: string;
  group: Group; // Added group
}

// Global declaration for the CDN-loaded XLSX library
declare global {
  interface Window {
    XLSX: any;
  }
}
