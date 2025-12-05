import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, History, Trash2, Edit2, Users } from 'lucide-react';
import EntryForm from './components/EntryForm';
import Leaderboard from './components/Leaderboard';
import { Entry, Round, ParticipantStats, RosterItem } from './types';

const App: React.FC = () => {
  // Load initial state from local storage
  const [entries, setEntries] = useState<Entry[]>(() => {
    const saved = localStorage.getItem('competition_entries');
    return saved ? JSON.parse(saved) : [];
  });

  const [roster, setRoster] = useState<RosterItem[]>(() => {
    const saved = localStorage.getItem('competition_roster');
    return saved ? JSON.parse(saved) : [];
  });

  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);

  useEffect(() => {
    localStorage.setItem('competition_entries', JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem('competition_roster', JSON.stringify(roster));
  }, [roster]);

  const addEntry = (participantId: string, participantName: string, round: Round, score: number, time: number) => {
    const newEntry: Entry = {
      id: crypto.randomUUID(),
      participantId,
      participantName,
      round,
      score,
      time,
      timestamp: Date.now(),
    };
    
    setEntries(prev => {
      // Remove any existing entry for this ID + Round
      const filtered = prev.filter(e => !(e.participantId === participantId && e.round === round));
      return [...filtered, newEntry];
    });
  };

  const updateEntry = (updatedEntry: Entry) => {
    setEntries(prev => {
      return prev.map(entry => {
        if (entry.id === updatedEntry.id) return updatedEntry;
        // Check for collision
        if (entry.participantId === updatedEntry.participantId && entry.round === updatedEntry.round) {
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

  const handleImportRoster = (newRoster: RosterItem[]) => {
    setRoster(newRoster);
    // Optional: Update names in existing entries if they match IDs
    setEntries(prev => prev.map(entry => {
      const match = newRoster.find(r => r.id === entry.participantId);
      if (match) {
        return { ...entry, participantName: match.name };
      }
      return entry;
    }));
  };

  const handleEditClick = (entry: Entry) => {
    setEditingEntry(entry);
    if (window.innerWidth < 1024) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Calculate stats and ranking
  const rankingData = useMemo(() => {
    const participantMap = new Map<string, { round1: Entry | null, round2: Entry | null, name: string }>();

    // 1. Initialize from entries
    entries.forEach(entry => {
      if (!participantMap.has(entry.participantId)) {
        participantMap.set(entry.participantId, { 
          round1: null, 
          round2: null, 
          name: entry.participantName || entry.participantId 
        });
      }
      const p = participantMap.get(entry.participantId)!;
      // Prefer name from Roster if available, otherwise use entry name
      const rosterMatch = roster.find(r => r.id === entry.participantId);
      if (rosterMatch) {
        p.name = rosterMatch.name;
      } else if (entry.participantName) {
        p.name = entry.participantName;
      }

      if (entry.round === '1') p.round1 = entry;
      else p.round2 = entry;
    });

    const stats: ParticipantStats[] = [];

    participantMap.forEach((data, pid) => {
      let bestEntry: Entry | null = null;

      if (data.round1 && !data.round2) {
        bestEntry = data.round1;
      } else if (!data.round1 && data.round2) {
        bestEntry = data.round2;
      } else if (data.round1 && data.round2) {
        if (data.round1.score > data.round2.score) {
          bestEntry = data.round1;
        } else if (data.round2.score > data.round1.score) {
          bestEntry = data.round2;
        } else {
          bestEntry = data.round1.time < data.round2.time ? data.round1 : data.round2;
        }
      }

      if (bestEntry) {
        stats.push({
          participantId: pid,
          participantName: data.name,
          bestEntry,
          round1: data.round1,
          round2: data.round2
        });
      }
    });

    return stats.sort((a, b) => {
      if (!a.bestEntry || !b.bestEntry) return 0;
      if (b.bestEntry.score !== a.bestEntry.score) {
        return b.bestEntry.score - a.bestEntry.score;
      }
      return a.bestEntry.time - b.bestEntry.time;
    });
  }, [entries, roster]);

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header */}
      <header className="bg-indigo-600 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Trophy className="w-8 h-8 text-yellow-300 flex-shrink-0" />
            <div className="flex flex-col">
              <h1 className="text-lg font-bold tracking-tight leading-tight">2025年湖南省青少年创新实践大赛</h1>
              <span className="text-xs text-indigo-200 font-medium">智能奥运会挑战赛</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
             <div className="hidden md:flex items-center space-x-1 bg-indigo-700 px-3 py-1 rounded-full border border-indigo-500 text-sm">
                <Users className="w-4 h-4 text-indigo-300" />
                <span>名单库: {roster.length}人</span>
             </div>
             <div className="text-sm bg-indigo-700 px-3 py-1 rounded-full border border-indigo-500">
               总记录: {entries.length}
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Input & History */}
          <div className="lg:col-span-4 space-y-8">
            <section>
              <EntryForm 
                onAddEntry={addEntry} 
                editingEntry={editingEntry}
                onUpdateEntry={updateEntry}
                onCancelEdit={() => setEditingEntry(null)}
                onImportRoster={handleImportRoster}
                roster={roster}
              />
            </section>

            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <History className="w-5 h-5 text-slate-500" />
                <h3 className="text-lg font-semibold text-slate-800">最近录入</h3>
              </div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {entries.length === 0 && <p className="text-slate-400 text-sm text-center py-4">暂无记录</p>}
                {[...entries].sort((a, b) => b.timestamp - a.timestamp).map(entry => {
                  const isEditingThis = editingEntry?.id === entry.id;
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
                        <div className={`text-xs mt-1 ${isEditingThis ? 'text-amber-700' : 'text-slate-500'}`}>
                          得分: <span className="font-medium text-slate-900">{entry.score}</span> · 
                          耗时: <span className="font-medium text-slate-900">{entry.time}s</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleEditClick(entry)}
                          disabled={isEditingThis}
                          className={`p-2 rounded-full transition-all ${
                            isEditingThis 
                              ? 'text-amber-400 cursor-default opacity-50' 
                              : 'text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 opacity-0 group-hover:opacity-100'
                          }`}
                          title="修改"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => removeEntry(entry.id)}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                          title="删除"
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

          {/* Right Column: Leaderboard */}
          <div className="lg:col-span-8">
            <Leaderboard stats={rankingData} />
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;