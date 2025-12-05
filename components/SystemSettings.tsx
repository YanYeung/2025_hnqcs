
import React, { useState } from 'react';
import { X, Save, Plus, Trash2, Edit2, RotateCcw, UserPlus, Percent } from 'lucide-react';
import { SubEvent, Referee, AwardConfig } from '../types';

interface SystemSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  competitionName: string;
  onUpdateCompetitionName: (name: string) => void;
  awardConfig: AwardConfig;
  onUpdateAwardConfig: (config: AwardConfig) => void;
  subEvents: SubEvent[];
  onAddSubEvent: (name: string) => void;
  onDeleteSubEvent: (id: string) => void;
  onRenameSubEvent: (id: string, name: string) => void;
  referees: Referee[];
  onAddReferee: (referee: Omit<Referee, 'id'>) => void;
  onDeleteReferee: (id: string) => void;
}

const SystemSettings: React.FC<SystemSettingsProps> = ({
  isOpen,
  onClose,
  competitionName,
  onUpdateCompetitionName,
  awardConfig,
  onUpdateAwardConfig,
  subEvents,
  onAddSubEvent,
  onDeleteSubEvent,
  onRenameSubEvent,
  referees,
  onAddReferee,
  onDeleteReferee
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'events' | 'users'>('general');
  const [tempName, setTempName] = useState(competitionName);
  const [tempAwardConfig, setTempAwardConfig] = useState<AwardConfig>(awardConfig);
  
  // Events state
  const [newEventName, setNewEventName] = useState('');
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editingEventName, setEditingEventName] = useState('');

  // Referee state
  const [newRefUser, setNewRefUser] = useState('');
  const [newRefPass, setNewRefPass] = useState('');
  const [newRefEventId, setNewRefEventId] = useState('');

  if (!isOpen) return null;

  const handleSaveGeneral = () => {
    onUpdateCompetitionName(tempName);
    onUpdateAwardConfig(tempAwardConfig);
    alert('保存成功');
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventName.trim()) return;
    onAddSubEvent(newEventName.trim());
    setNewEventName('');
  };

  const handleUpdateEvent = (id: string) => {
    if (!editingEventName.trim()) return;
    onRenameSubEvent(id, editingEventName.trim());
    setEditingEventId(null);
  };

  const handleAddReferee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRefUser.trim() || !newRefPass.trim() || !newRefEventId) {
      alert('请填写完整信息');
      return;
    }
    // Check duplication
    if (referees.some(r => r.username === newRefUser.trim())) {
      alert('用户名已存在');
      return;
    }
    onAddReferee({
      username: newRefUser.trim(),
      password: newRefPass.trim(),
      subEventId: newRefEventId
    });
    setNewRefUser('');
    setNewRefPass('');
    setNewRefEventId('');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-indigo-600 p-4 flex justify-between items-center text-white shrink-0">
          <h3 className="font-semibold text-lg">系统设置</h3>
          <button onClick={onClose} className="hover:bg-indigo-500 p-1 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 bg-slate-50 border-r border-slate-200 flex flex-col p-4 space-y-2 shrink-0">
            <button
              onClick={() => setActiveTab('general')}
              className={`text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'general' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              基本设置
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'events' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              赛项管理
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              裁判员管理
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            
            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-8">
                <div>
                  <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                    <Edit2 className="w-5 h-5 mr-2 text-indigo-600" /> 赛事信息
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">赛事名称</label>
                      <input
                        type="text"
                        value={tempName}
                        onChange={e => setTempName(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                    <Percent className="w-5 h-5 mr-2 text-indigo-600" /> 获奖比例设置
                  </h4>
                  <p className="text-sm text-slate-500 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    设置各等级奖项的百分比（如15表示15%）。系统将根据排名自动计算获奖等级并包含在导出的成绩单中。
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1 text-yellow-600">一等奖比例 (%)</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={tempAwardConfig.first}
                          onChange={e => setTempAwardConfig({...tempAwardConfig, first: Number(e.target.value)})}
                          className="w-full pl-4 pr-8 py-2 border border-yellow-200 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                        />
                        <span className="absolute right-3 top-2 text-slate-400 text-sm">%</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1 text-slate-600">二等奖比例 (%)</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={tempAwardConfig.second}
                          onChange={e => setTempAwardConfig({...tempAwardConfig, second: Number(e.target.value)})}
                          className="w-full pl-4 pr-8 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none"
                        />
                         <span className="absolute right-3 top-2 text-slate-400 text-sm">%</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1 text-orange-600">三等奖比例 (%)</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={tempAwardConfig.third}
                          onChange={e => setTempAwardConfig({...tempAwardConfig, third: Number(e.target.value)})}
                          className="w-full pl-4 pr-8 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                         <span className="absolute right-3 top-2 text-slate-400 text-sm">%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleSaveGeneral}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium flex items-center shadow-sm"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    保存所有设置
                  </button>
                </div>
              </div>
            )}

            {/* Events Tab */}
            {activeTab === 'events' && (
              <div className="space-y-6">
                <h4 className="text-lg font-semibold text-slate-800">赛项管理</h4>
                
                <form onSubmit={handleAddEvent} className="flex gap-2">
                  <input
                    type="text"
                    value={newEventName}
                    onChange={e => setNewEventName(e.target.value)}
                    placeholder="输入新赛项名称..."
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center">
                    <Plus className="w-4 h-4 mr-1" /> 添加
                  </button>
                </form>

                <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
                  {subEvents.map(event => (
                    <div key={event.id} className="p-4 flex items-center justify-between group hover:bg-slate-50">
                      {editingEventId === event.id ? (
                        <div className="flex items-center gap-2 flex-1 mr-4">
                          <input
                            type="text"
                            value={editingEventName}
                            onChange={e => setEditingEventName(e.target.value)}
                            className="flex-1 px-2 py-1 border border-indigo-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
                            autoFocus
                          />
                          <button onClick={() => handleUpdateEvent(event.id)} className="text-green-600 p-1 hover:bg-green-50 rounded"><Save className="w-4 h-4" /></button>
                          <button onClick={() => setEditingEventId(null)} className="text-slate-400 p-1 hover:bg-slate-100 rounded"><X className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <div className="font-medium text-slate-700 flex-1">{event.name}</div>
                      )}
                      
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {editingEventId !== event.id && (
                          <button 
                            onClick={() => { setEditingEventId(event.id); setEditingEventName(event.name); }}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            if (subEvents.length <= 1) {
                              alert('至少保留一个赛项');
                              return;
                            }
                            if (confirm(`确定要删除赛项 "${event.name}" 吗？该赛项下的所有成绩也将被隐藏或删除。`)) {
                              onDeleteSubEvent(event.id);
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <h4 className="text-lg font-semibold text-slate-800">裁判员账号</h4>
                
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h5 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
                    <UserPlus className="w-4 h-4 mr-2" /> 新增裁判员
                  </h5>
                  <form onSubmit={handleAddReferee} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input
                      type="text"
                      placeholder="用户名"
                      value={newRefUser}
                      onChange={e => setNewRefUser(e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                    <input
                      type="text" // Visible text for simple management
                      placeholder="密码"
                      value={newRefPass}
                      onChange={e => setNewRefPass(e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                    <select
                      value={newRefEventId}
                      onChange={e => setNewRefEventId(e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                    >
                      <option value="">选择负责赛项...</option>
                      {subEvents.map(ev => (
                        <option key={ev.id} value={ev.id}>{ev.name}</option>
                      ))}
                    </select>
                    <button type="submit" className="bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700">
                      创建账号
                    </button>
                  </form>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">用户名</th>
                        <th className="px-4 py-3">密码</th>
                        <th className="px-4 py-3">负责赛项</th>
                        <th className="px-4 py-3 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {referees.length === 0 && (
                        <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">暂无裁判员账号</td></tr>
                      )}
                      {referees.map(ref => {
                        const eventName = subEvents.find(e => e.id === ref.subEventId)?.name || '未知赛项';
                        return (
                          <tr key={ref.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-medium text-slate-800">{ref.username}</td>
                            <td className="px-4 py-3 text-slate-500 font-mono">{ref.password}</td>
                            <td className="px-4 py-3">
                              <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs border border-indigo-100">
                                {eventName}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => {
                                  if (confirm(`确定要删除裁判员 ${ref.username} 吗?`)) {
                                    onDeleteReferee(ref.id);
                                  }
                                }}
                                className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;