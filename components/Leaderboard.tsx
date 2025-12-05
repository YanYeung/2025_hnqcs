import React from 'react';
import { Download, Medal, Timer, TrendingUp, Trophy } from 'lucide-react';
import { ParticipantStats } from '../types';

interface LeaderboardProps {
  stats: ParticipantStats[];
}

const Leaderboard: React.FC<LeaderboardProps> = ({ stats }) => {
  const exportCSV = () => {
    // CSV Header
    const headers = ['排名,队员编号,姓名,最终得分,最终耗时,第一轮得分,第一轮耗时,第二轮得分,第二轮耗时'];
    
    // CSV Rows
    const rows = stats.map((stat, index) => {
      const rank = index + 1;
      const finalScore = stat.bestEntry?.score ?? 0;
      const finalTime = stat.bestEntry?.time ?? 0;
      const name = stat.participantName || '';
      
      const r1Score = stat.round1?.score ?? '-';
      const r1Time = stat.round1?.time ?? '-';
      
      const r2Score = stat.round2?.score ?? '-';
      const r2Time = stat.round2?.time ?? '-';

      return `${rank},"${stat.participantId}","${name}",${finalScore},${finalTime},${r1Score},${r1Time},${r2Score},${r2Time}`;
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `比赛排名_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getRankStyle = (index: number) => {
    switch (index) {
      case 0: return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case 1: return "bg-slate-50 text-slate-700 border-slate-200";
      case 2: return "bg-orange-50 text-orange-700 border-orange-200";
      default: return "bg-white text-slate-600 border-transparent";
    }
  };

  const getMedalIcon = (index: number) => {
    switch (index) {
      case 0: return <Medal className="w-5 h-5 text-yellow-500 fill-yellow-500" />;
      case 1: return <Medal className="w-5 h-5 text-slate-400 fill-slate-400" />;
      case 2: return <Medal className="w-5 h-5 text-orange-400 fill-orange-400" />;
      default: return <span className="text-slate-400 font-mono font-medium w-5 text-center">{index + 1}</span>;
    }
  };

  if (stats.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <Trophy className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-lg font-medium text-slate-900">暂无排名数据</h3>
        <p className="text-slate-500 mt-1">请在左侧录入成绩以生成实时排名</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <TrendingUp className="w-5 h-5 text-yellow-700" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800">实时排名</h2>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center space-x-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>导出排名</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <th className="px-6 py-4 w-20 text-center">排名</th>
              <th className="px-6 py-4">参赛队员</th>
              <th className="px-6 py-4 text-right">最终得分</th>
              <th className="px-6 py-4 text-right">最终耗时</th>
              <th className="px-6 py-4 text-center hidden md:table-cell">详细轮次</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {stats.map((stat, index) => (
              <tr 
                key={stat.participantId} 
                className="hover:bg-slate-50/80 transition-colors group"
              >
                <td className="px-6 py-4">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border ${getRankStyle(index)}`}>
                    {getMedalIcon(index)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-800">{stat.participantName || '未知姓名'}</span>
                    <span className="text-xs text-slate-400 font-mono">{stat.participantId}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="font-bold text-indigo-600 text-lg">
                    {stat.bestEntry?.score.toFixed(1)} <span className="text-xs text-indigo-300 font-normal">pts</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="font-mono text-slate-600 flex items-center justify-end space-x-1">
                    <Timer className="w-3 h-3 text-slate-400" />
                    <span>{stat.bestEntry?.time.toFixed(2)}s</span>
                  </div>
                </td>
                <td className="px-6 py-4 hidden md:table-cell">
                  <div className="flex justify-center space-x-2 text-xs">
                    <div className={`px-2 py-1 rounded ${stat.bestEntry?.round === '1' ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200' : 'bg-slate-100 text-slate-500'}`}>
                      R1: {stat.round1 ? `${stat.round1.score}/${stat.round1.time}s` : '-'}
                    </div>
                    <div className={`px-2 py-1 rounded ${stat.bestEntry?.round === '2' ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200' : 'bg-slate-100 text-slate-500'}`}>
                      R2: {stat.round2 ? `${stat.round2.score}/${stat.round2.time}s` : '-'}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboard;