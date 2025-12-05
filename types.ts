
export type Round = '1' | '2';
export type Group = 'junior' | 'senior';
export type Role = 'admin' | 'referee';

export interface SubEvent {
  id: string;
  name: string;
}

export interface Referee {
  id: string;
  username: string;
  password: string;
  subEventId: string;
}

export interface Entry {
  id: string;
  participantId: string;
  participantName: string;
  group: Group;
  round: Round;
  score: number;
  time: number;
  timestamp: number;
  subEventId: string;
}

export interface ParticipantStats {
  participantId: string;
  participantName: string;
  group: Group;
  bestEntry: Entry | null;
  round1: Entry | null;
  round2: Entry | null;
  rank?: number;
}

export interface RosterItem {
  id: string;
  name: string;
  group: Group;
  subEventId: string;
}

// Global declaration for the CDN-loaded XLSX library
declare global {
  interface Window {
    XLSX: any;
  }
}
