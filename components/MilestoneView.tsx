import React, { useMemo } from 'react';
import { MemoryEntry, Goal } from '../types';
import { Trophy, Target, CheckCircle2, Calendar, Crown, Award, Star } from 'lucide-react';
import { storage } from '../services/storage';

interface MilestoneViewProps {
  entries: MemoryEntry[];
  goals?: Goal[];
  onSelectEntry?: (entry: MemoryEntry) => void;
}

export const MilestoneView: React.FC<MilestoneViewProps> = ({ entries, goals = [], onSelectEntry }) => {
    
    // 1. 筛选逻辑：仅展示已完成的目标
    const milestoneItems = useMemo(() => {
        const completedGoals = goals.filter(g => g.status === 'completed');
        
        // 排序：最近完成的在前面 (或者按截止日期排序)
        // 这里按截止日期倒序排列，新的在左边
        return completedGoals.sort((a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime()).map(g => {
            const date = new Date(g.deadline);
            const dateStr = date.toDateString();
            
            // 尝试找到同一天且有图的日记作为封面
            const matchingEntry = entries.find(e => new Date(e.timestamp).toDateString() === dateStr && e.generatedCardUrl);
            
            // Fallback 图片
            const seed = g.id.charCodeAt(0) + g.text.length;
            const fallbackUrl = `https://image.pollinations.ai/prompt/golden%20trophy%20award%20cinematic%20lighting%20dark%20void%20minimalist%203d%20render?width=600&height=600&nologo=true&seed=${seed}&model=flux`;

            return {
                goal: g,
                imageUrl: matchingEntry ? matchingEntry.generatedCardUrl : fallbackUrl,
                dateStr: date.toLocaleDateString(),
                linkedEntry: matchingEntry
            };
        });
    }, [goals, entries]);

    const handleSeed = async () => {
        if (confirm("是否生成演示数据（包含几个已完成的目标）？")) {
            await storage.clearDatabase();
            await storage.seedMockData();
            window.location.reload();
        }
    };

    // === 空状态 ===
    if (milestoneItems.length === 0) {
        return (
            <div className="w-full h-[60vh] flex flex-col items-center justify-center text-slate-500 animate-fadeIn p-4">
                <div className="p-6 rounded-full bg-[#0f172a] mb-6 border border-white/5 shadow-2xl relative group">
                    <div className="absolute inset-0 rounded-full bg-amber-500/10 blur-xl group-hover:bg-amber-500/20 transition-all"></div>
                    <Trophy size={48} className="text-amber-700 relative z-10 group-hover:text-amber-500 transition-colors" />
                </div>
                
                <h3 className="text-xl font-light text-slate-200 mb-3 tracking-wide">荣誉殿堂目前关闭</h3>
                
                <div className="bg-[#0f172a]/50 p-6 rounded-xl border border-white/5 max-w-sm text-center backdrop-blur-sm">
                    <p className="text-sm text-slate-400 leading-relaxed mb-4">
                        此处仅收录状态为 <span className="text-amber-500 font-bold px-1">已完成</span> 的目标。<br/>
                        当您在目标页勾选完成时，它们将化作星辰陈列于此。
                    </p>
                    <div className="flex justify-center gap-3 text-xs opacity-70">
                        <span className="flex items-center gap-1 text-slate-500"><Target size={12}/> 设定目标</span>
                        <span className="text-slate-600">→</span>
                        <span className="flex items-center gap-1 text-slate-500"><CheckCircle2 size={12}/> 标记完成</span>
                    </div>
                </div>

                <button onClick={handleSeed} className="mt-8 px-6 py-2.5 rounded-full text-indigo-400 hover:text-white hover:bg-indigo-600/20 border border-indigo-500/20 transition-all text-xs font-medium">
                    生成测试数据
                </button>
            </div>
        );
    }

    return (
        <div className="w-full h-[75vh] bg-[#050505] rounded-3xl border border-white/10 relative shadow-2xl flex flex-col overflow-hidden">
            
            {/* 背景装饰 */}
            <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-amber-900/10 to-transparent pointer-events-none"></div>
            
            {/* 顶部标题 */}
            <div className="px-8 pt-8 pb-4 z-10 flex justify-between items-end bg-gradient-to-b from-[#050505] to-transparent">
                <div>
                    <h2 className="text-3xl font-light text-white tracking-tight flex items-center gap-3">
                        <Crown size={28} className="text-amber-400 fill-amber-400/20" />
                        <span className="tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600">Hall of Fame</span>
                    </h2>
                    <p className="text-[10px] text-amber-500/60 mt-2 font-mono tracking-[0.2em] uppercase">
                        {milestoneItems.length} Achievements Unlocked
                    </p>
                </div>
                {/* 装饰线 */}
                <div className="hidden md:block h-[1px] flex-1 bg-gradient-to-r from-amber-500/30 to-transparent mx-8 mb-2"></div>
            </div>

            {/* 横向滚动容器 */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden flex items-center px-8 md:px-12 gap-8 custom-scrollbar snap-x snap-mandatory">
                
                {milestoneItems.map((item, index) => (
                    <div 
                        key={item.goal.id} 
                        className="snap-center relative flex-shrink-0 w-72 md:w-80 h-[420px] group perspective-1000 cursor-pointer"
                        onClick={() => item.linkedEntry && onSelectEntry && onSelectEntry(item.linkedEntry)}
                    >
                        {/* 卡片主体 */}
                        <div className="relative w-full h-full bg-[#0f172a] rounded-xl border border-amber-500/20 overflow-hidden transition-all duration-500 transform group-hover:-translate-y-4 group-hover:shadow-[0_0_40px_rgba(245,158,11,0.2)]">
                            
                            {/* 图片区域 */}
                            <div className="h-3/5 w-full relative overflow-hidden">
                                {item.imageUrl ? (
                                    <img 
                                        src={item.imageUrl} 
                                        alt="Milestone" 
                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                                        <Award size={48} className="text-slate-700" />
                                    </div>
                                )}
                                {/* 金色渐变遮罩 */}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent opacity-90"></div>
                                
                                {/* 勋章 */}
                                <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md border border-amber-500/30 p-2 rounded-full shadow-lg">
                                    <Trophy size={16} className="text-amber-400" />
                                </div>
                            </div>

                            {/* 内容区域 */}
                            <div className="h-2/5 p-6 flex flex-col relative">
                                {/* 装饰性编号 */}
                                <div className="absolute -top-6 left-6 text-4xl font-black text-white/5 font-mono select-none">
                                    {String(milestoneItems.length - index).padStart(2, '0')}
                                </div>

                                <div className="mb-auto">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                                            Completed
                                        </div>
                                        <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                                            <Calendar size={10} /> {item.dateStr}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-100 leading-tight group-hover:text-amber-200 transition-colors line-clamp-2">
                                        {item.goal.text}
                                    </h3>
                                </div>

                                {/* 底部装饰 */}
                                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                                    <div className="flex gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={8} className="fill-amber-500/50 text-amber-500/50" />
                                        ))}
                                    </div>
                                    <div className="w-8 h-[1px] bg-amber-500/50"></div>
                                </div>
                            </div>
                        </div>

                        {/* 倒影效果 (CSS Reflection Simulation) */}
                        <div className="absolute -bottom-4 left-0 w-full h-8 bg-gradient-to-b from-amber-500/5 to-transparent blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[50%] transform scale-x-90"></div>
                    </div>
                ))}
                
                {/* 尾部留白 */}
                <div className="w-12 flex-shrink-0"></div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(245, 158, 11, 0.2); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(245, 158, 11, 0.4); }
                .perspective-1000 { perspective: 1000px; }
            `}</style>
        </div>
    );
};
