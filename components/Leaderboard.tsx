
import React, { useState } from 'react';
import { Download, Medal, Timer, TrendingUp, Trophy, Users } from 'lucide-react';
import { ParticipantStats, Group, AwardConfig } from '../types';

interface LeaderboardProps {
  stats: ParticipantStats[];
  viewMode?: 'admin' | 'display';
  awardConfig?: AwardConfig;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ stats, viewMode = 'admin', awardConfig }) => {
  const [activeGroup, setActiveGroup] = useState<Group>('junior');
  const isDisplay = viewMode === 'display';

  // Filter stats by active group
  const displayStats = stats.filter(s => s.group === activeGroup);

  const exportCSV = () => {
    // CSV Header
    const headers = ['排名,组别,队员编号,姓名,最终得分,最终耗时,第一轮得分,第一轮耗时,第二轮得分,第二轮耗时,获奖等级'];
    
    // Calculate award cutoffs if config exists
    let c1 = 0, c2 = 0, c3 = 0;
    if (awardConfig) {
      const total = displayStats.length;
      c1 = Math.round(total * (awardConfig.first / 100));
      c2 = Math.round(total * ((awardConfig.first + awardConfig.second) / 100));
      c3 = Math.round(total * ((awardConfig.first + awardConfig.second + awardConfig.third) / 100));
    }

    // CSV Rows
    const rows = displayStats.map((stat, index) => {
      const rank = index + 1;
      const groupName = stat.group === 'junior' ? '初级组' : '高级组';
      const finalScore = stat.bestEntry?.score ?? 0;
      const finalTime = stat.bestEntry?.time ?? 0;
      const name = stat.participantName || '';
      
      const r1Score = stat.round1?.score ?? '-';
      const r1Time = stat.round1?.time ?? '-';
      
      const r2Score = stat.round2?.score ?? '-';
      const r2Time = stat.round2?.time ?? '-';

      let award = '-';
      if (awardConfig) {
        if (rank <= c1) award = '一等奖';
        else if (rank <= c2) award = '二等奖';
        else if (rank <= c3) award = '三等奖';
      }

      return `${rank},${groupName},"${stat.participantId}","${name}",${finalScore},${finalTime},${r1Score},${r1Time},${r2Score},${r2Time},${award}`;
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `比赛排名_${activeGroup === 'junior' ? '初级组' : '高级组'}_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getRankStyle = (index: number) => {
    const base = "flex items-center justify-center rounded-full border shadow-sm flex-shrink-0";
    const size = isDisplay ? "w-10 h-10 md:w-12 md:h-12 text-lg md:text-xl" : "w-8 h-8 text-sm";
    
    switch (index) {
      case 0: return `${base} ${size} bg-yellow-100 text-yellow-700 border-yellow-300`;
      case 1: return `${base} ${size} bg-slate-100 text-slate-700 border-slate-300`;
      case 2: return `${base} ${size} bg-orange-100 text-orange-700 border-orange-300`;
      default: return `${base} ${size} bg-white text-slate-500 border-slate-200`;
    }
  };

  const getMedalIcon = (index: number) => {
    const iconSize = isDisplay ? "w-6 h-6 md:w-8 md:h-8" : "w-5 h-5";
    switch (index) {
      case 0: return <Medal className={`${iconSize} text-yellow-500 fill-yellow-500`} />;
      case 1: return <Medal className={`${iconSize} text-slate-400 fill-slate-400`} />;
      case 2: return <Medal className={`${iconSize} text-orange-400 fill-orange-400`} />;
      default: return <span className="font-mono font-bold">{index + 1}</span>;
    }
  };

  return (
    <div className={`bg-white shadow-sm border border-slate-200 overflow-hidden flex flex-col ${isDisplay ? 'h-full min-h-screen md:rounded-none' : 'h-full rounded-xl'}`}>
      {/* Header */}
      <div className={`border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 ${isDisplay ? 'p-4 md:p-6 bg-indigo-600 text-white sticky top-0 z-20' : 'p-4 md:p-6'}`}>
        <div className="flex items-center space-x-3 self-start sm:self-center">
          <div className={`p-2 rounded-lg ${isDisplay ? 'bg-white/10' : 'bg-yellow-100'}`}>
            <TrendingUp className={`w-6 h-6 ${isDisplay ? 'text-white' : 'text-yellow-700'}`} />
          </div>
          <div>
            <h2 className={`${isDisplay ? 'text-xl md:text-2xl' : 'text-lg'} font-bold ${isDisplay ? 'text-white' : 'text-slate-800'}`}>
              {isDisplay ? '实时排行榜' : '实时排名'}
            </h2>
            {isDisplay && <p className="text-indigo-200 text-xs md:text-sm mt-1">Real-time Leaderboard</p>}
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:ml-auto">
          {/* Group Toggles */}
          <div className={`flex p-1 rounded-lg ${isDisplay ? 'bg-black/20' : 'bg-slate-100'}`}>
             <button
               onClick={() => setActiveGroup('junior')}
               className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                 activeGroup === 'junior'
                  ? isDisplay ? 'bg-white text-indigo-600 shadow-sm' : 'bg-white text-slate-800 shadow-sm'
                  : isDisplay ? 'text-indigo-200 hover:text-white' : 'text-slate-500 hover:text-slate-700'
               }`}
             >
               <span>初级组</span>
             </button>
             <button
               onClick={() => setActiveGroup('senior')}
               className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                 activeGroup === 'senior'
                  ? isDisplay ? 'bg-white text-indigo-600 shadow-sm' : 'bg-white text-slate-800 shadow-sm'
                  : isDisplay ? 'text-indigo-200 hover:text-white' : 'text-slate-500 hover:text-slate-700'
               }`}
             >
               <span>高级组</span>
             </button>
          </div>
          
          {!isDisplay && (
            <button
              onClick={exportCSV}
              className="flex items-center space-x-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg transition-colors ml-2"
              title="导出当前组别排名"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">导出</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-slate-50/50">
        
        {displayStats.length === 0 ? (
           <div className={`flex flex-col items-center justify-center p-12 text-center h-full min-h-[300px]`}>
             <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
               <Trophy className="w-8 h-8 text-slate-300" />
             </div>
             <p className="text-slate-500">该组别暂无数据</p>
           </div>
        ) : (
          <>
            {/* Desktop Table View (Hidden on Mobile) */}
            <table className="hidden md:table w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white shadow-sm z-10">
                <tr className={`border-b border-slate-200 font-semibold uppercase tracking-wider ${isDisplay ? 'text-sm text-slate-600' : 'text-xs text-slate-500'}`}>
                  <th className={`px-6 text-center ${isDisplay ? 'py-6 w-32' : 'py-4 w-20'}`}>排名</th>
                  <th className={`px-6 ${isDisplay ? 'py-6' : 'py-4'}`}>参赛队员</th>
                  <th className={`px-6 text-right ${isDisplay ? 'py-6' : 'py-4'}`}>最终得分</th>
                  <th className={`px-6 text-right ${isDisplay ? 'py-6' : 'py-4'}`}>最终耗时</th>
                  <th className={`px-6 text-center ${isDisplay ? 'py-6' : 'py-4'}`}>详细轮次</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {displayStats.map((stat, index) => (
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
                    <td className={`px-6 text-center ${isDisplay ? 'py-6' : 'py-4'}`}>
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

            {/* Mobile Card View (Visible on Mobile) */}
            <div className="md:hidden space-y-1 p-2">
               {displayStats.map((stat, index) => (
                 <div 
                   key={stat.participantId} 
                   className={`p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between mb-2 ${index < 3 ? 'bg-white' : 'bg-white/80'}`}
                 >
                   <div className="flex items-center space-x-3 overflow-hidden">
                     <div className={getRankStyle(index)}>
                       {getMedalIcon(index)}
                     </div>
                     <div className="min-w-0">
                        <div className={`font-bold text-slate-800 truncate ${isDisplay ? 'text-lg' : 'text-base'}`}>
                          {stat.participantName || '未知姓名'}
                        </div>
                        <div className="flex items-center text-slate-400 space-x-2 text-xs">
                           <span className="font-mono bg-slate-100 px-1 rounded">{stat.participantId}</span>
                           <span>•</span>
                           <span className="flex space-x-1">
                              <span className={stat.bestEntry?.round === '1' ? 'text-indigo-600 font-bold' : ''}>R1</span>
                              <span>/</span>
                              <span className={stat.bestEntry?.round === '2' ? 'text-indigo-600 font-bold' : ''}>R2</span>
                           </span>
                        </div>
                     </div>
                   </div>
                   
                   <div className="text-right pl-2 flex-shrink-0">
                     <div className={`font-bold text-indigo-600 leading-none ${isDisplay ? 'text-2xl' : 'text-xl'}`}>
                       {stat.bestEntry?.score.toFixed(1)}
                     </div>
                     <div className="text-slate-500 text-xs mt-1 flex items-center justify-end space-x-1">
                       <Timer className="w-3 h-3" />
                       <span>{stat.bestEntry?.time.toFixed(2)}s</span>
                     </div>
                   </div>
                 </div>
               ))}
               
               <div className="text-center text-xs text-slate-400 py-4 pb-12">
                  —— {activeGroup === 'junior' ? '初级组' : '高级组'}到底了 ——
               </div>
            </div>
          </>
        )}
      </div>
      
      {/* Footer for display mode */}
      {isDisplay && (
        <div className="bg-slate-100 border-t border-slate-200 p-4 flex flex-col md:flex-row justify-between items-center text-slate-500 text-xs md:text-sm text-center md:text-left space-y-2 md:space-y-0">
          <span>2025年湖南省青少年创新实践大赛</span>
          <span>智能奥运会挑战赛 · 实时评分系统</span>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;