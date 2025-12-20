import React, { useState, useMemo, useEffect } from 'react';
import { Target, Plus, CheckCircle2, Calendar as CalendarIcon, ChevronLeft, ChevronRight, XCircle, Filter } from 'lucide-react';
import { MemoryEntry, Goal } from '../types';

interface GoalsViewProps {
  entries: MemoryEntry[];
  goals: Goal[];
  onAddGoal: (text: string, deadline: string) => void;
  onUpdateGoalStatus: (id: string, status: Goal['status']) => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({ goals, onAddGoal, onUpdateGoalStatus }) => {
  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Input State
  const [newGoalText, setNewGoalText] = useState('');
  const [newGoalDate, setNewGoalDate] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // --- Calendar Helpers ---
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const handleDateClick = (date: Date) => {
    // Toggle selection
    if (selectedDate && date.toDateString() === selectedDate.toDateString()) {
        setSelectedDate(null); // Deselect
    } else {
        setSelectedDate(date);
        // Pre-fill the date input for better UX (ISO format YYYY-MM-DD)
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - (offset * 60 * 1000));
        setNewGoalDate(localDate.toISOString().split('T')[0]);
        // Optional: Auto open add form if clicking empty date? Maybe just pre-fill.
    }
  };

  const clearSelection = () => {
      setSelectedDate(null);
      setNewGoalDate('');
  };

  // --- Data Processing ---
  // 1. Map goals to dates for the calendar visuals
  const goalsMap = useMemo(() => {
    const map: Record<string, Goal[]> = {};
    goals.forEach(g => {
        const dateKey = new Date(g.deadline).toDateString(); 
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(g);
    });
    return map;
  }, [goals]);

  // 2. Filter Logic for the List View
  const displayedGoals = useMemo(() => {
      if (selectedDate) {
          // Filter by specific date
          const dateKey = selectedDate.toDateString();
          return goalsMap[dateKey] || [];
      } else {
          // Show "Upcoming" (active only, sorted by date)
          return [...goals]
            .filter(g => g.status === 'active')
            .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
            .slice(0, 6); // Limit to top 6
      }
  }, [selectedDate, goalsMap, goals]);

  // Separate completed goals just for the "Recent" view context if needed
  // But for "Selected Date" view, we want to see EVERYTHING for that day.
  const completedHistory = useMemo(() => {
      if (selectedDate) return []; // Don't show history list when filtered by date
      return goals.filter(g => g.status === 'completed').slice(0, 3);
  }, [goals, selectedDate]);


  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGoalText && newGoalDate) {
      onAddGoal(newGoalText, newGoalDate);
      setNewGoalText('');
      // Keep date if adding multiple for same day, else clear
      if (!selectedDate) setNewGoalDate('');
      setIsAdding(false);
    }
  };

  // --- Render Calendar Grid ---
  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysCount = getDaysInMonth(year, month);
    const startDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    // Padding
    for (let i = 0; i < startDay; i++) {
        days.push(<div key={`pad-${i}`} className="h-10 md:h-14"></div>);
    }

    // Days
    for (let d = 1; d <= daysCount; d++) {
        const dateObj = new Date(year, month, d);
        const dateKey = dateObj.toDateString();
        const dayGoals = goalsMap[dateKey] || [];
        
        const isToday = new Date().toDateString() === dateKey;
        const isSelected = selectedDate && selectedDate.toDateString() === dateKey;
        
        const hasActive = dayGoals.some(g => g.status === 'active');
        const hasCompleted = dayGoals.some(g => g.status === 'completed');

        // Determine Cell Style
        let cellClass = "hover:bg-white/10 border-white/5"; // Default
        let textClass = "text-slate-500";

        if (isSelected) {
            cellClass = "bg-indigo-600 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.4)] z-10 scale-105";
            textClass = "text-white font-bold";
        } else if (isToday) {
            cellClass = "bg-indigo-500/20 border-indigo-500/50";
            textClass = "text-indigo-300 font-bold";
        }

        days.push(
            <div 
                key={d} 
                onClick={() => handleDateClick(dateObj)}
                className={`h-10 md:h-14 border rounded-lg flex flex-col items-center justify-start pt-1 md:pt-2 relative group transition-all duration-200 cursor-pointer ${cellClass}`}
            >
                <span className={`text-[10px] md:text-xs font-mono ${textClass}`}>{d}</span>
                
                {/* Indicators */}
                <div className="flex gap-1 mt-1">
                    {hasActive && <div className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-indigo-400 shadow-[0_0_5px_currentColor]'}`}></div>}
                    {hasCompleted && <div className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full ${isSelected ? 'bg-white/50' : 'bg-emerald-500/50'}`}></div>}
                </div>
            </div>
        );
    }

    return days;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-20">
      {/* Header */}
      <div className="mb-8 flex justify-between items-end border-b border-white/5 pb-4">
        <div>
          <h2 className="text-2xl font-light text-slate-100">战略目标</h2>
          <p className="text-slate-500 text-sm mt-1">
             {selectedDate 
                ? `正在查看 ${selectedDate.toLocaleDateString('zh-CN')} 的计划` 
                : "时间管理与愿景追踪"}
          </p>
        </div>
        
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all
            ${isAdding ? 'bg-slate-800 text-slate-400' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20'}`}
        >
          <Plus size={16} className={isAdding ? "rotate-45 transition-transform" : ""} />
          {isAdding ? "取消" : "新增目标"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* === LEFT: Calendar Section (7 Columns) === */}
        <div className="lg:col-span-7 space-y-4">
            <div className="bg-[#0f172a]/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl">
                {/* Calendar Header */}
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                        <CalendarIcon size={18} className="text-indigo-400" />
                        {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h3>
                    <div className="flex gap-1">
                        <button onClick={handlePrevMonth} className="p-1.5 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors"><ChevronLeft size={18}/></button>
                        <button onClick={handleNextMonth} className="p-1.5 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors"><ChevronRight size={18}/></button>
                    </div>
                </div>

                {/* Weekday Header */}
                <div className="grid grid-cols-7 mb-2 text-center">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{d}</div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1 md:gap-2">
                    {renderCalendar()}
                </div>
            </div>

            {/* Quick Add Form */}
            {isAdding && (
                <div className="animate-slideUp bg-indigo-900/20 border border-indigo-500/20 rounded-xl p-4">
                    <form onSubmit={handleAddGoal} className="flex flex-col gap-3">
                        <input 
                            type="text" 
                            placeholder={selectedDate ? `添加 ${selectedDate.toLocaleDateString()} 的目标...` : "输入目标内容..."}
                            className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                            value={newGoalText}
                            onChange={(e) => setNewGoalText(e.target.value)}
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <input 
                                type="date" 
                                className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
                                value={newGoalDate}
                                onChange={(e) => setNewGoalDate(e.target.value)}
                            />
                            <button 
                                type="submit"
                                disabled={!newGoalText || !newGoalDate}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                确认添加
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>

        {/* === RIGHT: Goal List Section (5 Columns) === */}
        <div className="lg:col-span-5 space-y-6">
            
            {/* List Header & Filter Status */}
            <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    {selectedDate ? (
                        <>
                            <Filter size={14} className="text-indigo-400" /> 
                            {selectedDate.toLocaleDateString('zh-CN')}
                        </>
                    ) : (
                        <>
                            <Target size={14} className="text-indigo-400" /> 
                            近期关注
                        </>
                    )}
                </h3>
                
                {selectedDate && (
                    <button 
                        onClick={clearSelection}
                        className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                    >
                        <XCircle size={12} />
                        显示全部
                    </button>
                )}
            </div>
            
            <div className="space-y-3">
                {displayedGoals.length === 0 ? (
                        <div className="p-8 text-center border border-dashed border-white/5 rounded-xl bg-white/[0.02]">
                            <p className="text-slate-600 text-xs tracking-wide mb-2">
                                {selectedDate ? "这一天暂无安排" : "列表空空如也"}
                            </p>
                            {selectedDate && (
                                <button 
                                    onClick={() => setIsAdding(true)}
                                    className="text-indigo-400 text-xs hover:underline"
                                >
                                    为今天添加目标
                                </button>
                            )}
                        </div>
                ) : (
                    displayedGoals.map(goal => (
                        <div 
                            key={goal.id} 
                            className={`group relative backdrop-blur-md border rounded-xl p-4 transition-all duration-300
                                ${goal.status === 'completed' 
                                    ? 'bg-[#0f172a]/40 border-emerald-500/10 opacity-70 hover:opacity-100' 
                                    : 'bg-[#0f172a]/60 border-white/5 hover:border-indigo-500/30'}`}
                        >
                            <div className="flex items-start gap-3">
                                <button 
                                    onClick={() => onUpdateGoalStatus(goal.id, goal.status === 'completed' ? 'active' : 'completed')}
                                    className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center transition-all
                                        ${goal.status === 'completed' 
                                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' 
                                            : 'border-slate-600 hover:border-indigo-400 text-transparent'}`}
                                >
                                    <CheckCircle2 size={12} />
                                </button>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <p className={`text-sm font-medium transition-colors truncate pr-2 ${goal.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-200 group-hover:text-white'}`}>
                                            {goal.text}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border 
                                            ${goal.status === 'completed' ? 'text-slate-600 bg-slate-800 border-slate-700' : 'text-indigo-400 bg-indigo-500/10 border-indigo-500/10'}`}>
                                            {new Date(goal.deadline).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Completed Goals (Only show when NOT filtering by date, to avoid redundancy) */}
            {!selectedDate && completedHistory.length > 0 && (
                <div className="pt-4 border-t border-white/5">
                    <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3 px-1">
                        最近完成
                    </h3>
                    <div className="space-y-2 opacity-60 hover:opacity-100 transition-opacity">
                        {completedHistory.map(goal => (
                            <div key={goal.id} className="flex items-center gap-3 p-3 rounded-lg border border-transparent hover:bg-white/5 hover:border-white/5 transition-all">
                                <button 
                                    onClick={() => onUpdateGoalStatus(goal.id, 'active')}
                                    className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400"
                                >
                                    <CheckCircle2 size={10} />
                                </button>
                                <span className="text-xs text-slate-500 line-through decoration-slate-600">{goal.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};
