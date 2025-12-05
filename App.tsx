
import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, History, Trash2, Edit2, Users, Monitor, ExternalLink, LogOut, Settings, ChevronDown } from 'lucide-react';
import EntryForm from './components/EntryForm';
import Leaderboard from './components/Leaderboard';
import Login from './components/Login';
import ChangePasswordModal from './components/ChangePasswordModal';
import SystemSettings from './components/SystemSettings';
import { Entry, Round, ParticipantStats, RosterItem, Group, SubEvent, Referee, Role } from './types';

type ViewMode = 'admin' | 'display';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('admin');
  const [currentUser, setCurrentUser] = useState<{ role: Role, username: string, assignedEventId?: string } | null>(null);

  // --- Persistence State ---
  
  // Competition Info
  const [competitionName, setCompetitionName] = useState(() => localStorage.getItem('competition_name') || '2025年湖南省青少年创新实践大赛');
  
  // SubEvents
  const [subEvents, setSubEvents] = useState<SubEvent[]>(() => {
    const saved = localStorage.getItem('competition_subevents');
    return saved ? JSON.parse(saved) : [{ id: 'default', name: '默认赛项' }];
  });
  
  // Current active sub-event ID
  const [currentSubEventId, setCurrentSubEventId] = useState<string>(() => {
    // Try to restore last used event from session or default to first
    const saved = sessionStorage.getItem('competition_current_event');
    return saved || 'default';
  });

  // Referees
  const [referees, setReferees] = useState<Referee[]>(() => {
    const saved = localStorage.getItem('competition_referees');
    return saved ? JSON.parse(saved) : [];
  });

  // Data
  const [entries, setEntries] = useState<Entry[]>(() => {
    const saved = localStorage.getItem('competition_entries');
    let loaded: Entry[] = saved ? JSON.parse(saved) : [];
    // Migration: If no subEventId, assign to 'default'
    if (loaded.some(e => !e.subEventId)) {
      loaded = loaded.map(e => ({ ...e, subEventId: e.subEventId || 'default' }));
    }
    return loaded;
  });

  const [roster, setRoster] = useState<RosterItem[]>(() => {
    const saved = localStorage.getItem('competition_roster');
    let loaded: RosterItem[] = saved ? JSON.parse(saved) : [];
    // Migration
    if (loaded.some(r => !r.subEventId)) {
      loaded = loaded.map(r => ({ ...r, subEventId: r.subEventId || 'default' }));
    }
    return loaded;
  });

  const [adminPassword, setAdminPassword] = useState(() => {
    return localStorage.getItem('competition_admin_password') || 'admin';
  });

  // UI State
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // --- Effects ---

  // Session check
  useEffect(() => {
    const auth = sessionStorage.getItem('competition_auth');
    if (auth) {
      setCurrentUser(JSON.parse(auth));
    }
  }, []);

  // Sync subEventId to session
  useEffect(() => {
    sessionStorage.setItem('competition_current_event', currentSubEventId);
  }, [currentSubEventId]);

  // Handle Hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/display')) {
        setViewMode('display');
      } else {
        setViewMode('admin');
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Storage Persistence
  useEffect(() => localStorage.setItem('competition_entries', JSON.stringify(entries)), [entries]);
  useEffect(() => localStorage.setItem('competition_roster', JSON.stringify(roster)), [roster]);
  useEffect(() => localStorage.setItem('competition_name', competitionName), [competitionName]);
  useEffect(() => localStorage.setItem('competition_subevents', JSON.stringify(subEvents)), [subEvents]);
  useEffect(() => localStorage.setItem('competition_referees', JSON.stringify(referees)), [referees]);
  useEffect(() => localStorage.setItem('competition_admin_password', adminPassword), [adminPassword]);

  // --- Filtering Data based on Current SubEvent ---

  const currentRoster = useMemo(() => {
    return roster.filter(r => r.subEventId === currentSubEventId);
  }, [roster, currentSubEventId]);

  const currentEntries = useMemo(() => {
    return entries.filter(e => e.subEventId === currentSubEventId);
  }, [entries, currentSubEventId]);

  const currentSubEventName = useMemo(() => {
    return subEvents.find(e => e.id === currentSubEventId)?.name || '未知赛项';
  }, [subEvents, currentSubEventId]);

  // --- Handlers ---

  const handleLogin = (u: string, p: string) => {
    // Admin check
    if ((u === 'admin') && p === adminPassword) {
      const user = { role: 'admin' as Role, username: 'admin' };
      setCurrentUser(user);
      sessionStorage.setItem('competition_auth', JSON.stringify(user));
      // Admin defaults to first event if valid
      if (subEvents.length > 0) setCurrentSubEventId(subEvents[0].id);
      return true;
    }

    // Referee check
    const ref = referees.find(r => r.username === u && r.password === p);
    if (ref) {
      const user = { role: 'referee' as Role, username: ref.username, assignedEventId: ref.subEventId };
      setCurrentUser(user);
      sessionStorage.setItem('competition_auth', JSON.stringify(user));
      setCurrentSubEventId(ref.subEventId); // Lock to assigned event
      return true;
    }

    return false;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('competition_auth');
    setViewMode('admin'); // Reset view
  };

  const addEntry = (participantId: string, participantName: string, group: Group, round: Round, score: number, time: number) => {
    const newEntry: Entry = {
      id: crypto.randomUUID(),
      participantId,
      participantName,
      group,
      round,
      score,
      time,
      timestamp: Date.now(),
      subEventId: currentSubEventId, // Tag with current event
    };
    
    setEntries(prev => {
      // Remove existing entry for same person+round+event
      const filtered = prev.filter(e => !(
        e.participantId === participantId && 
        e.round === round && 
        e.subEventId === currentSubEventId
      ));
      return [...filtered, newEntry];
    });
  };

  const updateEntry = (updatedEntry: Entry) => {
    setEntries(prev => {
      return prev.map(entry => {
        if (entry.id === updatedEntry.id) return updatedEntry;
        // Ensure uniqueness for round/id/event
        if (entry.participantId === updatedEntry.participantId && 
            entry.round === updatedEntry.round && 
            entry.subEventId === updatedEntry.subEventId) {
          return null; 
        }
        return entry;
      }).filter((e): e is Entry => e !== null);
    });
    setEditingEntry(null);
  };

  const removeEntry = (id: string) => {
    if (confirm('确定要删除这条成绩记录吗？')) {
      setEntries(prev => prev.filter(e => e.id !== id));
      if (editingEntry?.id === id) {
        setEditingEntry(null);
      }
    }
  };

  const handleImportRoster = (newItems: Omit<RosterItem, 'subEventId'>[]) => {
    // Attach currentSubEventId to imported items
    const itemsWithId = newItems.map(item => ({
      ...item,
      subEventId: currentSubEventId
    }));

    // Merge logic: Remove existing items for this subEvent that match ID, then add new
    setRoster(prev => {
      const otherEventsRoster = prev.filter(r => r.subEventId !== currentSubEventId);
      const currentEventRoster = prev.filter(r => r.subEventId === currentSubEventId);
      
      // Filter out duplicates from currentEventRoster based on incoming IDs
      const incomingIds = new Set(itemsWithId.map(i => i.id));
      const keptCurrent = currentEventRoster.filter(r => !incomingIds.has(r.id));
      
      return [...otherEventsRoster, ...keptCurrent, ...itemsWithId];
    });
  };

  // --- Settings Handlers ---

  const handleAddSubEvent = (name: string) => {
    const newEvent: SubEvent = { id: crypto.randomUUID(), name };
    setSubEvents(prev => [...prev, newEvent]);
    if (subEvents.length === 0) setCurrentSubEventId(newEvent.id);
  };

  const handleDeleteSubEvent = (id: string) => {
    setSubEvents(prev => prev.filter(e => e.id !== id));
    // Also remove associated data? For now, we keep orphan data or could filter it. 
    // Let's filter entries/roster to keep it clean.
    setEntries(prev => prev.filter(e => e.subEventId !== id));
    setRoster(prev => prev.filter(r => r.subEventId !== id));
    setReferees(prev => prev.filter(r => r.subEventId !== id)); // Remove refs assigned to this event
    
    if (currentSubEventId === id) {
      setCurrentSubEventId(subEvents.find(e => e.id !== id)?.id || '');
    }
  };

  const handleRenameSubEvent = (id: string, name: string) => {
    setSubEvents(prev => prev.map(e => e.id === id ? { ...e, name } : e));
  };

  const handleAddReferee = (ref: Omit<Referee, 'id'>) => {
    setReferees(prev => [...prev, { ...ref, id: crypto.randomUUID() }]);
  };

  const handleDeleteReferee = (id: string) => {
    setReferees(prev => prev.filter(r => r.id !== id));
  };

  // --- Derived Ranking Data ---
  
  const rankingData = useMemo(() => {
    const participantMap = new Map<string, { round1: Entry | null, round2: Entry | null, name: string, group: Group }>();

    // Only process current event entries
    currentEntries.forEach(entry => {
      // Find roster match within current event roster
      const rosterMatch = currentRoster.find(r => r.id === entry.participantId);
      const effectiveGroup = rosterMatch ? rosterMatch.group : entry.group || 'junior';
      const effectiveName = rosterMatch ? rosterMatch.name : (entry.participantName || entry.participantId);

      if (!participantMap.has(entry.participantId)) {
        participantMap.set(entry.participantId, { 
          round1: null, 
          round2: null, 
          name: effectiveName,
          group: effectiveGroup
        });
      }
      const p = participantMap.get(entry.participantId)!;
      p.name = effectiveName;
      p.group = effectiveGroup;

      if (entry.round === '1') p.round1 = entry;
      else p.round2 = entry;
    });

    const stats: ParticipantStats[] = [];

    participantMap.forEach((data, pid) => {
      let bestEntry: Entry | null = null;
      if (data.round1 && !data.round2) bestEntry = data.round1;
      else if (!data.round1 && data.round2) bestEntry = data.round2;
      else if (data.round1 && data.round2) {
        if (data.round1.score > data.round2.score) bestEntry = data.round1;
        else if (data.round2.score > data.round1.score) bestEntry = data.round2;
        else bestEntry = data.round1.time < data.round2.time ? data.round1 : data.round2;
      }

      if (bestEntry) {
        stats.push({
          participantId: pid,
          participantName: data.name,
          group: data.group,
          bestEntry,
          round1: data.round1,
          round2: data.round2
        });
      }
    });

    return stats.sort((a, b) => {
      if (!a.bestEntry || !b.bestEntry) return 0;
      if (b.bestEntry.score !== a.bestEntry.score) return b.bestEntry.score - a.bestEntry.score;
      return a.bestEntry.time - b.bestEntry.time;
    });
  }, [currentEntries, currentRoster]);

  // --- Views ---

  if (viewMode === 'display') {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col">
        {/* Simple Header for switching events in Display Mode */}
        <div className="bg-indigo-900 text-white p-2 flex justify-between items-center px-4">
           <span className="opacity-70 text-sm">{competitionName}</span>
           <select 
             value={currentSubEventId} 
             onChange={(e) => setCurrentSubEventId(e.target.value)}
             className="bg-indigo-800 border-none text-white text-sm rounded px-2 py-1 outline-none cursor-pointer hover:bg-indigo-700"
           >
             {subEvents.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
           </select>
        </div>
        <Leaderboard stats={rankingData} viewMode="display" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <Login 
        onLogin={handleLogin} 
        onGoToDisplay={() => window.open(`${window.location.origin}${window.location.pathname}#/display`, '_blank')}
        competitionName={competitionName}
      />
    );
  }

  // Admin / Referee View
  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)}
        currentPasswordHash={adminPassword}
        onSave={(newPass) => { setAdminPassword(newPass); localStorage.setItem('competition_admin_password', newPass); }}
      />
      
      {/* Settings Modal (Admin Only) */}
      <SystemSettings 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        competitionName={competitionName}
        onUpdateCompetitionName={setCompetitionName}
        subEvents={subEvents}
        onAddSubEvent={handleAddSubEvent}
        onDeleteSubEvent={handleDeleteSubEvent}
        onRenameSubEvent={handleRenameSubEvent}
        referees={referees}
        onAddReferee={handleAddReferee}
        onDeleteReferee={handleDeleteReferee}
      />

      <header className="bg-indigo-600 text-white shadow-lg sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Trophy className="w-8 h-8 text-yellow-300 flex-shrink-0" />
            <div className="flex flex-col">
              <h1 className="text-lg font-bold tracking-tight leading-tight">{competitionName}</h1>
              <div className="flex items-center text-xs text-indigo-200 font-medium space-x-2">
                <span>评分系统</span>
                <span className="w-1 h-1 bg-indigo-400 rounded-full"></span>
                <span>{currentUser.role === 'admin' ? '管理员' : `裁判员: ${currentUser.username}`}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
             <button 
               onClick={() => window.open(`${window.location.origin}${window.location.pathname}#/display`, '_blank')}
               className="hidden md:flex items-center space-x-2 bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-1.5 rounded-lg transition-colors border border-indigo-400 shadow-sm"
             >
               <Monitor className="w-4 h-4" />
               <span className="text-sm font-medium">打开大屏</span>
             </button>

             <div className="h-6 w-px bg-indigo-500 mx-1"></div>
             
             {currentUser.role === 'admin' && (
               <>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-2 text-indigo-200 hover:text-white hover:bg-indigo-500 rounded-full transition-colors flex items-center space-x-1"
                  title="系统设置"
                >
                  <Settings className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="p-2 text-indigo-200 hover:text-white hover:bg-indigo-500 rounded-full transition-colors"
                  title="修改管理员密码"
                >
                  <div className="relative">
                    <Edit2 className="w-4 h-4" />
                  </div>
                </button>
               </>
             )}

             <button
               onClick={handleLogout}
               className="p-2 text-indigo-200 hover:text-white hover:bg-indigo-500 rounded-full transition-colors"
               title="退出登录"
             >
               <LogOut className="w-5 h-5" />
             </button>
          </div>
        </div>
      </header>

      {/* SubEvent Selector Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto py-3 space-x-2 no-scrollbar">
            {currentUser.role === 'admin' ? (
              subEvents.map(event => (
                <button
                  key={event.id}
                  onClick={() => setCurrentSubEventId(event.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    currentSubEventId === event.id
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {event.name}
                </button>
              ))
            ) : (
              <div className="flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium border border-indigo-100">
                当前赛项: {currentSubEventName}
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {subEvents.length === 0 ? (
           <div className="text-center py-20 text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
             请先在系统设置中添加比赛项目
           </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Input & History */}
            <div className="lg:col-span-4 space-y-6">
              <section>
                <div className="flex items-center justify-between mb-2">
                   <h3 className="font-semibold text-slate-700">{currentSubEventName} - 成绩录入</h3>
                   <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">名单库: {currentRoster.length}人</span>
                </div>
                <EntryForm 
                  onAddEntry={addEntry} 
                  editingEntry={editingEntry}
                  onUpdateEntry={updateEntry}
                  onCancelEdit={() => setEditingEntry(null)}
                  onImportRoster={handleImportRoster}
                  roster={currentRoster}
                />
              </section>

              <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <History className="w-5 h-5 text-slate-500" />
                  <h3 className="text-lg font-semibold text-slate-800">最近录入 ({currentSubEventName})</h3>
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {currentEntries.length === 0 && <p className="text-slate-400 text-sm text-center py-4">暂无本赛项记录</p>}
                  {[...currentEntries].sort((a, b) => b.timestamp - a.timestamp).map(entry => {
                    const isEditingThis = editingEntry?.id === entry.id;
                    const displayGroup = entry.group || 'junior';
                    
                    return (
                      <div 
                        key={entry.id} 
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all group ${
                          isEditingThis 
                          ? 'bg-amber-50 border-amber-200 ring-1 ring-amber-300' 
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-100'
                        }`}
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className={`font-bold ${isEditingThis ? 'text-amber-800' : 'text-slate-700'}`}>
                              {entry.participantName || entry.participantId}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">{entry.participantId}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wide ${entry.round === '1' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                              R{entry.round}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-[10px] bg-slate-200 text-slate-600 px-1 rounded">
                              {displayGroup === 'junior' ? '初级' : '高级'}
                            </span>
                            <div className={`text-xs ${isEditingThis ? 'text-amber-700' : 'text-slate-500'}`}>
                              得分: <span className="font-medium text-slate-900">{entry.score}</span> · 
                              耗时: <span className="font-medium text-slate-900">{entry.time}s</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => {
                              setEditingEntry(entry);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            disabled={isEditingThis}
                            className={`p-2 rounded-full transition-all ${
                              isEditingThis 
                                ? 'text-amber-400 cursor-default opacity-50' 
                                : 'text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 opacity-0 group-hover:opacity-100'
                            }`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => removeEntry(entry.id)}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* Right Column: Leaderboard Preview in Admin */}
            <div className="lg:col-span-8">
              <Leaderboard stats={rankingData} viewMode="admin" />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
