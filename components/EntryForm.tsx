
import React, { useState, useEffect, useRef } from 'react';
import { PlusCircle, Timer, Trophy, User, Edit2, X, Upload, FileSpreadsheet, Search, Download, Users } from 'lucide-react';
import { Round, Entry, RosterItem, Group } from '../types';

interface EntryFormProps {
  onAddEntry: (participantId: string, participantName: string, group: Group, round: Round, score: number, time: number) => void;
  editingEntry?: Entry | null;
  onUpdateEntry?: (entry: Entry) => void;
  onCancelEdit?: () => void;
  onImportRoster: (roster: RosterItem[]) => void;
  roster: RosterItem[];
}

const EntryForm: React.FC<EntryFormProps> = ({ 
  onAddEntry, 
  editingEntry, 
  onUpdateEntry, 
  onCancelEdit,
  onImportRoster,
  roster
}) => {
  const [participantId, setParticipantId] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [group, setGroup] = useState<Group>('junior');
  const [round, setRound] = useState<Round>('1');
  const [score, setScore] = useState('');
  const [time, setTime] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingEntry) {
      setParticipantId(editingEntry.participantId);
      setParticipantName(editingEntry.participantName || '');
      setGroup(editingEntry.group || 'junior');
      setRound(editingEntry.round);
      setScore(editingEntry.score.toString());
      setTime(editingEntry.time.toString());
      setError(null);
    } else {
      setParticipantId('');
      setParticipantName('');
      // Keep group selection as is for convenience when entering multiple same-group students
      setRound('1');
      setScore('');
      setTime('');
      setError(null);
    }
  }, [editingEntry]);

  // Auto-fill name and group when ID changes based on roster
  useEffect(() => {
    if (!editingEntry && participantId) {
      const match = roster.find(r => r.id === participantId.trim());
      if (match) {
        setParticipantName(match.name);
        setGroup(match.group);
      }
    }
  }, [participantId, roster, editingEntry]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!participantId.trim()) {
      setError("请输入参赛队员编号");
      return;
    }

    const numScore = parseFloat(score);
    const numTime = parseFloat(time);

    if (isNaN(numScore) || numScore < 0) {
      setError("请输入有效的分数");
      return;
    }

    if (isNaN(numTime) || numTime <= 0) {
      setError("请输入有效的耗时");
      return;
    }

    // Default name to ID if empty
    const finalName = participantName.trim() || participantId.trim();

    if (editingEntry && onUpdateEntry) {
      onUpdateEntry({
        ...editingEntry,
        participantId: participantId.trim(),
        participantName: finalName,
        group,
        round,
        score: numScore,
        time: numTime,
      });
    } else {
      onAddEntry(participantId.trim(), finalName, group, round, numScore, numTime);
      if (!editingEntry) {
        setParticipantId('');
        setParticipantName('');
        setScore('');
        setTime('');
      }
    }
  };

  const handleCancel = () => {
    if (onCancelEdit) onCancelEdit();
  };

  // Generate and download a template file with 20 dummy users
  const handleDownloadTemplate = () => {
    try {
      const headers = ['编号', '姓名', '组别(初级组/高级组)'];
      const surnames = ['赵', '钱', '孙', '李', '周', '吴', '郑', '王', '冯', '陈', '褚', '卫', '蒋', '沈', '韩', '杨', '朱', '秦', '尤', '许'];
      const names = ['伟', '芳', '娜', '敏', '静', '秀', '强', '军', '杰', '磊', '洋', '勇', '艳', '杰', '娟', '涛', '明', '超', '秀', '丽'];
      
      const data = [headers];
      
      for (let i = 0; i < 20; i++) {
        const id = `A${String(i + 1).padStart(3, '0')}`; 
        const name = `${surnames[i % surnames.length]}${names[(i * 3) % names.length]}`; 
        // Alternate groups
        const groupText = i % 2 === 0 ? '初级组' : '高级组';
        data.push([id, name, groupText]);
      }

      const ws = window.XLSX.utils.aoa_to_sheet(data);
      const wb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(wb, ws, "参赛名单");
      window.XLSX.writeFile(wb, "参赛名单导入模板.xlsx");
    } catch (err) {
      console.error(err);
      alert('生成模板失败');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = window.XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = window.XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        if (data.length > 0) {
          const headers = data[0].map((h: any) => String(h).toLowerCase().trim());
          
          // Heuristics for columns
          let idIndex = headers.findIndex((h: string) => h.includes('编号') || h.includes('id') || h.includes('code'));
          let nameIndex = headers.findIndex((h: string) => h.includes('姓名') || h.includes('name'));
          let groupIndex = headers.findIndex((h: string) => h.includes('组别') || h.includes('组') || h.includes('group'));

          // Fallbacks
          if (idIndex === -1) idIndex = 0;
          if (nameIndex === -1) nameIndex = 1;
          // Group is optional in fallback, handled in logic below

          const newRoster: RosterItem[] = [];
          
          for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (row[idIndex]) {
              // Parse group text
              let rowGroup: Group = 'junior'; // Default
              if (groupIndex !== -1 && row[groupIndex]) {
                const gText = String(row[groupIndex]).trim();
                if (gText.includes('高') || gText.includes('Senior')) {
                  rowGroup = 'senior';
                }
              }

              newRoster.push({
                id: String(row[idIndex]).trim(),
                name: row[nameIndex] ? String(row[nameIndex]).trim() : '',
                group: rowGroup
              });
            }
          }

          if (newRoster.length > 0) {
            onImportRoster(newRoster);
            alert(`成功导入 ${newRoster.length} 名参赛选手信息！`);
          } else {
            alert('未能识别有效数据，请确保Excel包含编号和姓名列。');
          }
        }
      } catch (err) {
        console.error(err);
        alert('解析文件失败，请检查文件格式。');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const isEditing = !!editingEntry;

  return (
    <div className={`rounded-xl shadow-sm border p-6 transition-colors duration-200 ${isEditing ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <div className={`p-2 rounded-lg ${isEditing ? 'bg-amber-100' : 'bg-indigo-100'}`}>
            {isEditing ? (
              <Edit2 className="w-5 h-5 text-amber-600" />
            ) : (
              <PlusCircle className="w-5 h-5 text-indigo-600" />
            )}
          </div>
          <h2 className={`text-lg font-semibold ${isEditing ? 'text-amber-900' : 'text-slate-800'}`}>
            {isEditing ? '修改成绩' : '录入成绩'}
          </h2>
        </div>
        
        {isEditing ? (
          <button 
            onClick={handleCancel}
            className="p-1 rounded-full text-amber-400 hover:bg-amber-100 hover:text-amber-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          <div className="flex space-x-2">
            <button 
              onClick={handleDownloadTemplate}
              className="flex items-center space-x-1 text-xs bg-slate-50 text-slate-600 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
              title="下载20人测试名单模板"
            >
              <Download className="w-4 h-4" />
              <span>下载模板</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-1 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors"
              title="导入Excel名单 (包含编号、姓名、组别)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>导入名单</span>
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div className="grid grid-cols-2 gap-4">
          {/* Participant ID */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-slate-600 mb-1">编号 <span className="text-red-400">*</span></label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                list="roster-ids"
                value={participantId}
                onChange={(e) => setParticipantId(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="编号..."
              />
              <datalist id="roster-ids">
                {roster.map(r => (
                  <option key={r.id} value={r.id}>{r.name} ({r.group === 'junior' ? '初级' : '高级'})</option>
                ))}
              </datalist>
            </div>
          </div>

          {/* Participant Name */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-slate-600 mb-1">姓名</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white"
                placeholder="自动匹配或手输"
              />
            </div>
          </div>
        </div>

        {/* Group Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">组别</label>
          <div className="flex space-x-4">
            <label className={`flex-1 flex items-center justify-center space-x-2 cursor-pointer border rounded-lg p-2 transition-all ${group === 'junior' ? 'bg-sky-50 border-sky-500 text-sky-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              <input 
                type="radio" 
                name="group" 
                value="junior" 
                checked={group === 'junior'} 
                onChange={() => setGroup('junior')} 
                className="hidden" 
              />
              <Users className="w-4 h-4" />
              <span className="font-medium">初级组</span>
            </label>
            <label className={`flex-1 flex items-center justify-center space-x-2 cursor-pointer border rounded-lg p-2 transition-all ${group === 'senior' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              <input 
                type="radio" 
                name="group" 
                value="senior" 
                checked={group === 'senior'} 
                onChange={() => setGroup('senior')} 
                className="hidden" 
              />
              <Users className="w-4 h-4" />
              <span className="font-medium">高级组</span>
            </label>
          </div>
        </div>

        {/* Round Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">比赛轮次</label>
          <div className="flex space-x-4">
            <label className={`flex-1 flex items-center justify-center space-x-2 cursor-pointer border rounded-lg p-2 transition-all ${round === '1' ? 'bg-slate-100 border-slate-400 text-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              <input 
                type="radio" 
                name="round" 
                value="1" 
                checked={round === '1'} 
                onChange={() => setRound('1')} 
                className="hidden" 
              />
              <span className="font-medium">第一轮</span>
            </label>
            <label className={`flex-1 flex items-center justify-center space-x-2 cursor-pointer border rounded-lg p-2 transition-all ${round === '2' ? 'bg-slate-100 border-slate-400 text-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              <input 
                type="radio" 
                name="round" 
                value="2" 
                checked={round === '2'} 
                onChange={() => setRound('2')} 
                className="hidden" 
              />
              <span className="font-medium">第二轮</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Score */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">得分</label>
            <div className="relative">
              <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="number"
                step="0.1"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="0.0"
              />
            </div>
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">耗时 (秒)</label>
            <div className="relative">
              <Timer className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="number"
                step="0.01"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center">
             <span className="mr-2">⚠️</span> {error}
          </div>
        )}

        <div className="flex space-x-3 pt-2">
          {isEditing && (
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 bg-white border border-slate-300 text-slate-700 font-semibold py-2.5 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
            >
              取消
            </button>
          )}
          <button
            type="submit"
            className={`flex-1 font-semibold py-2.5 rounded-lg transition-colors shadow-sm active:transform active:scale-[0.98] ${
              isEditing 
                ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {isEditing ? '保存修改' : '提交成绩'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EntryForm;
