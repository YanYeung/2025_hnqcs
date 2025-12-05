
import { Entry, RosterItem, SubEvent, Referee, AwardConfig, Role } from '../types';

// ==========================================
// CONFIGURATION
// ==========================================
// Set to TRUE for Vercel deployment (uses relative path /api)
const USE_SERVER = true; 

// In Vercel/Production, we use relative paths. In local dev, we might use absolute.
// If window.location.hostname is localhost, you might want to point to port 3001, 
// but typically with Vercel we use 'vercel dev' which handles proxying.
const API_BASE_URL = '/api';

// ==========================================
// INTERFACES
// ==========================================

export interface CompetitionInfo {
  name: string;
  awardConfig: AwardConfig;
}

export interface DataClient {
  init(): Promise<void>;
  
  // Auth
  login(username: string, password: string): Promise<{ success: boolean; user?: any; token?: string }>;
  changePassword(newPass: string): Promise<boolean>;

  // Competition Info
  getCompetitionInfo(): Promise<CompetitionInfo>;
  updateCompetitionInfo(name: string, config: AwardConfig): Promise<void>;

  // SubEvents
  getSubEvents(): Promise<SubEvent[]>;
  addSubEvent(name: string): Promise<SubEvent>;
  deleteSubEvent(id: string): Promise<void>;
  renameSubEvent(id: string, name: string): Promise<void>;

  // Referees
  getReferees(): Promise<Referee[]>;
  addReferee(ref: Omit<Referee, 'id'>): Promise<Referee>;
  deleteReferee(id: string): Promise<void>;

  // Entries
  getEntries(subEventId?: string): Promise<Entry[]>;
  addEntry(entry: Entry): Promise<Entry>;
  updateEntry(entry: Entry): Promise<void>;
  deleteEntry(id: string): Promise<void>;

  // Roster
  getRoster(subEventId?: string): Promise<RosterItem[]>;
  importRoster(items: RosterItem[]): Promise<void>;
}

// ==========================================
// LOCAL STORAGE IMPLEMENTATION (Fallback)
// ==========================================

class LocalClient implements DataClient {
  private simulateDelay() {
    return new Promise(resolve => setTimeout(resolve, 300)); // Simulate network latency
  }

  async init(): Promise<void> {
    // No-op for local storage
  }

  async login(username: string, password: string): Promise<{ success: boolean; user?: any }> {
    await this.simulateDelay();
    const adminPass = localStorage.getItem('competition_admin_password') || 'admin';
    
    if (username === 'admin' && password === adminPass) {
      return { success: true, user: { role: 'admin', username: 'admin' } };
    }

    const referees: Referee[] = JSON.parse(localStorage.getItem('competition_referees') || '[]');
    const ref = referees.find(r => r.username === username && r.password === password);
    
    if (ref) {
      return { success: true, user: { role: 'referee', username: ref.username, assignedEventId: ref.subEventId } };
    }

    return { success: false };
  }

  async changePassword(newPass: string): Promise<boolean> {
    await this.simulateDelay();
    localStorage.setItem('competition_admin_password', newPass);
    return true;
  }

  async getCompetitionInfo(): Promise<CompetitionInfo> {
    await this.simulateDelay();
    return {
      name: localStorage.getItem('competition_name') || '2025年湖南省青少年创新实践大赛',
      awardConfig: JSON.parse(localStorage.getItem('competition_award_config') || '{"first":15,"second":25,"third":30}')
    };
  }

  async updateCompetitionInfo(name: string, config: AwardConfig): Promise<void> {
    await this.simulateDelay();
    localStorage.setItem('competition_name', name);
    localStorage.setItem('competition_award_config', JSON.stringify(config));
  }

  async getSubEvents(): Promise<SubEvent[]> {
    await this.simulateDelay();
    const saved = localStorage.getItem('competition_subevents');
    return saved ? JSON.parse(saved) : [{ id: 'default', name: '默认赛项' }];
  }

  async addSubEvent(name: string): Promise<SubEvent> {
    await this.simulateDelay();
    const events = await this.getSubEvents();
    const newEvent = { id: crypto.randomUUID(), name };
    localStorage.setItem('competition_subevents', JSON.stringify([...events, newEvent]));
    return newEvent;
  }

  async deleteSubEvent(id: string): Promise<void> {
    await this.simulateDelay();
    const events = await this.getSubEvents();
    localStorage.setItem('competition_subevents', JSON.stringify(events.filter(e => e.id !== id)));
    
    // Clean up associated data
    const entries = await this.getEntries();
    localStorage.setItem('competition_entries', JSON.stringify(entries.filter(e => e.subEventId !== id)));
    
    const roster = await this.getRoster();
    localStorage.setItem('competition_roster', JSON.stringify(roster.filter(r => r.subEventId !== id)));
    
    const referees = await this.getReferees();
    localStorage.setItem('competition_referees', JSON.stringify(referees.filter(r => r.subEventId !== id)));
  }

  async renameSubEvent(id: string, name: string): Promise<void> {
    await this.simulateDelay();
    const events = await this.getSubEvents();
    const updated = events.map(e => e.id === id ? { ...e, name } : e);
    localStorage.setItem('competition_subevents', JSON.stringify(updated));
  }

  async getReferees(): Promise<Referee[]> {
    await this.simulateDelay();
    return JSON.parse(localStorage.getItem('competition_referees') || '[]');
  }

  async addReferee(ref: Omit<Referee, 'id'>): Promise<Referee> {
    await this.simulateDelay();
    const refs = await this.getReferees();
    const newRef = { ...ref, id: crypto.randomUUID() };
    localStorage.setItem('competition_referees', JSON.stringify([...refs, newRef]));
    return newRef;
  }

  async deleteReferee(id: string): Promise<void> {
    await this.simulateDelay();
    const refs = await this.getReferees();
    localStorage.setItem('competition_referees', JSON.stringify(refs.filter(r => r.id !== id)));
  }

  async getEntries(subEventId?: string): Promise<Entry[]> {
    await this.simulateDelay();
    const all = JSON.parse(localStorage.getItem('competition_entries') || '[]');
    if (subEventId) return all.filter((e: Entry) => e.subEventId === subEventId);
    return all;
  }

  async addEntry(entry: Entry): Promise<Entry> {
    await this.simulateDelay();
    const all = await this.getEntries();
    // Filter duplicates locally just in case
    const filtered = all.filter(e => !(
        e.participantId === entry.participantId && 
        e.round === entry.round && 
        e.subEventId === entry.subEventId
    ));
    localStorage.setItem('competition_entries', JSON.stringify([...filtered, entry]));
    return entry;
  }

  async updateEntry(entry: Entry): Promise<void> {
    await this.simulateDelay();
    const all = await this.getEntries();
    const updated = all.map(e => e.id === entry.id ? entry : e);
    localStorage.setItem('competition_entries', JSON.stringify(updated));
  }

  async deleteEntry(id: string): Promise<void> {
    await this.simulateDelay();
    const all = await this.getEntries();
    localStorage.setItem('competition_entries', JSON.stringify(all.filter(e => e.id !== id)));
  }

  async getRoster(subEventId?: string): Promise<RosterItem[]> {
    await this.simulateDelay();
    const all = JSON.parse(localStorage.getItem('competition_roster') || '[]');
    if (subEventId) return all.filter((r: RosterItem) => r.subEventId === subEventId);
    return all;
  }

  async importRoster(items: RosterItem[]): Promise<void> {
    await this.simulateDelay();
    const all = await this.getRoster();
    // Simple merge: remove existing for these IDs in this event, then add
    const incomingIds = new Set(items.map(i => i.id + '_' + i.subEventId));
    const kept = all.filter(r => !incomingIds.has(r.id + '_' + r.subEventId));
    localStorage.setItem('competition_roster', JSON.stringify([...kept, ...items]));
  }
}

// ==========================================
// REST API IMPLEMENTATION (Server)
// ==========================================

class RestClient implements DataClient {
  private headers() {
    return {
      'Content-Type': 'application/json',
    };
  }

  async init() {}

  async login(username: string, password: string) {
    const res = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return { success: res.ok, user: data.user, token: data.token };
  }

  async changePassword(newPass: string) {
    const res = await fetch(`${API_BASE_URL}/admin/password`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ password: newPass })
    });
    return res.ok;
  }

  async getCompetitionInfo() {
    const res = await fetch(`${API_BASE_URL}/info`);
    return res.json();
  }

  async updateCompetitionInfo(name: string, config: AwardConfig) {
    await fetch(`${API_BASE_URL}/info`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ name, config })
    });
  }

  async getSubEvents() {
    const res = await fetch(`${API_BASE_URL}/events`);
    return res.json();
  }

  async addSubEvent(name: string) {
    const res = await fetch(`${API_BASE_URL}/events`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ name })
    });
    return res.json();
  }

  async deleteSubEvent(id: string) {
    await fetch(`${API_BASE_URL}/events/${id}`, { method: 'DELETE' });
  }

  async renameSubEvent(id: string, name: string) {
    await fetch(`${API_BASE_URL}/events/${id}`, {
      method: 'PUT',
      headers: this.headers(),
      body: JSON.stringify({ name })
    });
  }

  async getReferees() {
    const res = await fetch(`${API_BASE_URL}/referees`);
    return res.json();
  }

  async addReferee(ref: Omit<Referee, 'id'>) {
    const res = await fetch(`${API_BASE_URL}/referees`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(ref)
    });
    return res.json();
  }

  async deleteReferee(id: string) {
    await fetch(`${API_BASE_URL}/referees/${id}`, { method: 'DELETE' });
  }

  async getEntries(subEventId?: string) {
    const url = subEventId ? `${API_BASE_URL}/entries?subEventId=${subEventId}` : `${API_BASE_URL}/entries`;
    const res = await fetch(url);
    return res.json();
  }

  async addEntry(entry: Entry) {
    const res = await fetch(`${API_BASE_URL}/entries`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(entry)
    });
    return res.json();
  }

  async updateEntry(entry: Entry) {
    await fetch(`${API_BASE_URL}/entries/${entry.id}`, {
      method: 'PUT',
      headers: this.headers(),
      body: JSON.stringify(entry)
    });
  }

  async deleteEntry(id: string) {
    await fetch(`${API_BASE_URL}/entries/${id}`, { method: 'DELETE' });
  }

  async getRoster(subEventId?: string) {
    const url = subEventId ? `${API_BASE_URL}/roster?subEventId=${subEventId}` : `${API_BASE_URL}/roster`;
    const res = await fetch(url);
    return res.json();
  }

  async importRoster(items: RosterItem[]) {
    await fetch(`${API_BASE_URL}/roster/batch`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ items })
    });
  }
}

// Export the configured client
export const client = USE_SERVER ? new RestClient() : new LocalClient();
