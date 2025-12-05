export type Round = '1' | '2';

export interface Entry {
  id: string;
  participantId: string;
  participantName: string; // Added name field
  round: Round;
  score: number;
  time: number;
  timestamp: number;
}

export interface ParticipantStats {
  participantId: string;
  participantName: string; // Added name field
  bestEntry: Entry | null;
  round1: Entry | null;
  round2: Entry | null;
  rank?: number;
}

export interface RosterItem {
  id: string;
  name: string;
}

// Global declaration for the CDN-loaded XLSX library
declare global {
  interface Window {
    XLSX: any;
  }
}