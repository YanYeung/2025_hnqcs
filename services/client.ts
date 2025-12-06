
import { createClient, SupabaseClient as Client } from '@supabase/supabase-js';
import { Entry, RosterItem, SubEvent, Referee, AwardConfig } from '../types';

// ==========================================
// CONFIGURATION
// ==========================================

// Get these from your Vercel Project Settings -> Environment Variables
// Fix for TS error: Property 'env' does not exist on type 'ImportMeta'
const env = (import.meta as any).env || {};
const SUPABASE_URL = env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || '';

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
  login(username: string, password: string): Promise<{ success: boolean; user?: any; }>;
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
// SUPABASE IMPLEMENTATION
// ==========================================

class SupabaseDataClient implements DataClient {
  private supabase: Client;

  constructor() {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn("Supabase credentials missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
    }
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  async init() {
    // Optional: Warm up connection or check health
  }

  async login(username: string, password: string) {
    // Use RPC (Database Functions) for secure password checking on the server side
    if (username === 'admin') {
      const { data, error } = await this.supabase.rpc('login_admin', { attempt: password });
      if (error) throw error;
      if (data && data.success) {
        return { success: true, user: { role: 'admin', username: 'admin' } };
      }
    } else {
      const { data, error } = await this.supabase.rpc('login_referee', { user_name: username, pass: password });
      if (error) throw error;
      if (data && data.success) {
        return { success: true, user: { role: 'referee', username: data.username, assignedEventId: data.assignedEventId } };
      }
    }
    return { success: false };
  }

  async changePassword(newPass: string) {
    const { error } = await this.supabase
      .from('meta')
      .update({ value: newPass })
      .eq('key', 'admin_password');
    if (error) throw error;
    return true;
  }

  async getCompetitionInfo(): Promise<CompetitionInfo> {
    const { data, error } = await this.supabase.from('meta').select('*');
    if (error) throw error;

    // Explicitly type the Map to avoid 'unknown' inference
    const infoMap = new Map<string, string>(data.map((item: any) => [item.key, item.value]));
    
    let awardConfig = { first: 15, second: 25, third: 30 };
    try {
      const cfg = infoMap.get('award_config');
      if (cfg) awardConfig = JSON.parse(cfg);
    } catch (e) {}

    return {
      name: infoMap.get('competition_name') || '未命名赛事',
      awardConfig
    };
  }

  async updateCompetitionInfo(name: string, config: AwardConfig) {
    await this.supabase.from('meta').upsert({ key: 'competition_name', value: name });
    await this.supabase.from('meta').upsert({ key: 'award_config', value: JSON.stringify(config) });
  }

  async getSubEvents() {
    const { data, error } = await this.supabase.from('sub_events').select('*');
    if (error) throw error;
    return data || [];
  }

  async addSubEvent(name: string) {
    const { data, error } = await this.supabase
      .from('sub_events')
      .insert({ name })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteSubEvent(id: string) {
    // Cascading deletes handled by Postgres Foreign Keys
    const { error } = await this.supabase.from('sub_events').delete().eq('id', id);
    if (error) throw error;
  }

  async renameSubEvent(id: string, name: string) {
    const { error } = await this.supabase.from('sub_events').update({ name }).eq('id', id);
    if (error) throw error;
  }

  async getReferees() {
    // Map snake_case DB columns to camelCase Types
    const { data, error } = await this.supabase
      .from('referees')
      .select('id, username, password, subEventId:sub_event_id');
    if (error) throw error;
    return data || [];
  }

  async addReferee(ref: Omit<Referee, 'id'>) {
    const { data, error } = await this.supabase
      .from('referees')
      .insert({ 
        username: ref.username, 
        password: ref.password, 
        sub_event_id: ref.subEventId 
      })
      .select('id, username, password, subEventId:sub_event_id')
      .single();
    if (error) throw error;
    return data;
  }

  async deleteReferee(id: string) {
    const { error } = await this.supabase.from('referees').delete().eq('id', id);
    if (error) throw error;
  }

  async getEntries(subEventId?: string) {
    let query = this.supabase
      .from('entries')
      .select(`
        id, 
        participantId:participant_id, 
        participantName:participant_name, 
        group:group_type, 
        round, 
        score, 
        time, 
        timestamp, 
        subEventId:sub_event_id
      `);
    
    if (subEventId) {
      query = query.eq('sub_event_id', subEventId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async addEntry(entry: Entry) {
    // Exclude 'id' to let DB generate UUID if needed, or use the one provided
    // Here we map camelCase back to snake_case
    const dbEntry = {
      participant_id: entry.participantId,
      participant_name: entry.participantName,
      group_type: entry.group,
      round: entry.round,
      score: entry.score,
      time: entry.time,
      timestamp: entry.timestamp,
      sub_event_id: entry.subEventId
    };

    const { data, error } = await this.supabase
      .from('entries')
      .insert(dbEntry)
      .select(`
        id, 
        participantId:participant_id, 
        participantName:participant_name, 
        group:group_type, 
        round, 
        score, 
        time, 
        timestamp, 
        subEventId:sub_event_id
      `)
      .single();
      
    if (error) throw error;
    return data;
  }

  async updateEntry(entry: Entry) {
    const { error } = await this.supabase
      .from('entries')
      .update({
        participant_id: entry.participantId,
        participant_name: entry.participantName,
        group_type: entry.group,
        round: entry.round,
        score: entry.score,
        time: entry.time,
        // timestamp: entry.timestamp // Usually don't update timestamp on edit unless desired
      })
      .eq('id', entry.id);
    if (error) throw error;
  }

  async deleteEntry(id: string) {
    const { error } = await this.supabase.from('entries').delete().eq('id', id);
    if (error) throw error;
  }

  async getRoster(subEventId?: string) {
    let query = this.supabase
      .from('roster')
      .select('id, name, group:group_type, subEventId:sub_event_id');
      
    if (subEventId) {
      query = query.eq('sub_event_id', subEventId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async importRoster(items: RosterItem[]) {
    // Supabase upsert
    const dbItems = items.map(item => ({
      id: item.id,
      name: item.name,
      group_type: item.group,
      sub_event_id: item.subEventId
    }));

    const { error } = await this.supabase
      .from('roster')
      .upsert(dbItems, { onConflict: 'id,sub_event_id' });
      
    if (error) throw error;
  }
}

// Export the Supabase client
export const client = new SupabaseDataClient();
