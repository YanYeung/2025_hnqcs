import React from 'react';
import { Download, Medal, Timer, TrendingUp, Trophy, Maximize2 } from 'lucide-react';
import { ParticipantStats } from '../types';

interface LeaderboardProps {
  stats: ParticipantStats[];
  viewMode?: 'admin' | 'display';
}

const Leaderboard: React.FC<LeaderboardProps> = ({ stats, viewMode = 'admin' }) => {
  const isDisplay = viewMode === 'display';

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
    const base = "flex items-center justify-center rounded-full border shadow-sm";
    const size = isDisplay ? "w-12 h-12 text-xl" : "w-8 h-8 text-sm";
    
    switch (index) {
      case 0: return `${base} ${size} bg-yellow-100 text-yellow-700 border-yellow-300`;
      case 1: return `${base} ${size} bg-slate-100 text-slate-700 border-slate-300`;
      case 2: return `${base} ${size} bg-orange-100 text-orange-700 border-orange-300`;
      default: return `${base} ${size} bg-white text-slate-500 border-slate-200`;
    }
  };

  const getMedalIcon = (index: number) => {
    const iconSize = isDisplay ? "w-8 h-8" : "w-5 h-5";
    switch (index) {
      case 0: return <Medal className={`${iconSize} text-yellow-500 fill-yellow-500`} />;
      case 1: return <Medal className={`${iconSize} text-slate-400 fill-slate-400`} />;
      case 2: return <Medal className={`${iconSize} text-orange-400 fill-orange-400`} />;
      default: return <span className="font-mono font-bold">{index + 1}</span>;
    }
  };

  if (stats.length === 0) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center flex flex-col items-center justify-center ${isDisplay ? 'h-screen' : 'min-h-[400px]'}`}>
        <div className={`${isDisplay ? 'w-32 h-32' : 'w-16 h-16'} bg-slate-100 rounded-full flex items-center justify-center mb-6`}>
          <Trophy className={`${isDisplay ? 'w-16 h-16' : 'w-8 h-8'} text-slate-300`} />
        </div>
        <h3 className={`${isDisplay ? 'text-3xl' : 'text-lg'} font-medium text-slate-900`}>暂无排名数据</h3>
        <p className={`${isDisplay ? 'text-xl mt-4' : 'text-sm mt-1'} text-slate-500`}>
          {isDisplay ? '比赛即将开始，敬请期待...' : '请在左侧录入成绩以生成实时排名'}
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white shadow-sm border border-slate-200 overflow-hidden flex flex-col ${isDisplay ? 'h-screen rounded-none' : 'h-full rounded-xl'}`}>
      <div className={`border-b border-slate-100 flex justify-between items-center ${isDisplay ? 'p-6 bg-indigo-600 text-white' : 'p-6'}`}>
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${isDisplay ? 'bg-white/10' : 'bg-yellow-100'}`}>
            <TrendingUp className={`w-6 h-6 ${isDisplay ? 'text-white' : 'text-yellow-700'}`} />
          </div>
          <div>
            <h2 className={`${isDisplay ? 'text-2xl' : 'text-lg'} font-bold ${isDisplay ? 'text-white' : 'text-slate-800'}`}>
              {isDisplay ? '实时排行榜' : '实时排名'}
            </h2>
            {isDisplay && <p className="text-indigo-200 text-sm mt-1">Real-time Leaderboard</p>}
          </div>
        </div>
        
        {!isDisplay && (
          <button
            onClick={exportCSV}
            className="flex items-center space-x-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>导出排名</span>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-auto bg-slate-50/50">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-white shadow-sm z-10">
            <tr className={`border-b border-slate-200 font-semibold uppercase tracking-wider ${isDisplay ? 'text-sm text-slate-600' : 'text-xs text-slate-500'}`}>
              <th className={`px-6 text-center ${isDisplay ? 'py-6 w-32' : 'py-4 w-20'}`}>排名</th>
              <th className={`px-6 ${isDisplay ? 'py-6' : 'py-4'}`}>参赛队员</th>
              <th className={`px-6 text-right ${isDisplay ? 'py-6' : 'py-4'}`}>最终得分</th>
              <th className={`px-6 text-right ${isDisplay ? 'py-6' : 'py-4'}`}>最终耗时</th>
              <th className={`px-6 text-center hidden md:table-cell ${isDisplay ? 'py-6' : 'py-4'}`}>详细轮次</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {stats.map((stat, index) => (
              <tr 
                key={stat.participantId} 
                className={`transition-colors group ${isDisplay ? 'hover:bg-indigo-50/30' : 'hover:bg-slate-50/80'}`}
              >
                <td className={`px-6 ${isDisplay ? 'py-6' : 'py-4'}`}>
                  <div className={getRankStyle(index)}>
                    {getMedalIcon(index)}
                  </div>
                </td>
                <td className={`px-6 ${isDisplay ? 'py-6' : 'py-4'}`}>
                  <div className="flex flex-col">
                    <span className={`font-bold text-slate-800 ${isDisplay ? 'text-2xl mb-1' : 'text-base'}`}>
                      {stat.participantName || '未知姓名'}
                    </span>
                    <span className={`text-slate-400 font-mono ${isDisplay ? 'text-base' : 'text-xs'}`}>
                      {stat.participantId}
                    </span>
                  </div>
                </td>
                <td className={`px-6 text-right ${isDisplay ? 'py-6' : 'py-4'}`}>
                  <div className={`font-bold text-indigo-600 ${isDisplay ? 'text-4xl' : 'text-lg'}`}>
                    {stat.bestEntry?.score.toFixed(1)} <span className="text-sm text-indigo-300 font-normal">pts</span>
                  </div>
                </td>
                <td className={`px-6 text-right ${isDisplay ? 'py-6' : 'py-4'}`}>
                  <div className={`font-mono text-slate-600 flex items-center justify-end space-x-1 ${isDisplay ? 'text-2xl' : 'text-base'}`}>
                    <Timer className={`${isDisplay ? 'w-5 h-5' : 'w-3 h-3'} text-slate-400`} />
                    <span>{stat.bestEntry?.time.toFixed(2)}s</span>
                  </div>
                </td>
                <td className={`px-6 text-center hidden md:table-cell ${isDisplay ? 'py-6' : 'py-4'}`}>
                  <div className={`flex justify-center space-x-3 ${isDisplay ? 'text-base' : 'text-xs'}`}>
                    <div className={`px-3 py-1.5 rounded-lg border ${
                      stat.bestEntry?.round === '1' 
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold' 
                      : 'bg-slate-50 text-slate-400 border-slate-100'
                    }`}>
                      R1: {stat.round1 ? `${stat.round1.score} / ${stat.round1.time}s` : '-'}
                    </div>
                    <div className={`px-3 py-1.5 rounded-lg border ${
                      stat.bestEntry?.round === '2' 
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold' 
                      : 'bg-slate-50 text-slate-400 border-slate-100'
                    }`}>
                      R2: {stat.round2 ? `${stat.round2.score} / ${stat.round2.time}s` : '-'}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Footer for display mode */}
      {isDisplay && (
        <div className="bg-slate-100 border-t border-slate-200 p-4 flex justify-between items-center text-slate-500 text-sm">
          <span>2025年湖南省青少年创新实践大赛</span>
          <span>智能奥运会挑战赛 · 实时评分系统</span>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;