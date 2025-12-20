import React, { useState, useEffect } from 'react';
import { Activity, Plus, GitCommit, UserCircle, Cpu, X, Clock, ChevronRight, CalendarDays, Sparkles, Loader2, Settings as SettingsIcon, Target, TrendingUp, Trophy } from 'lucide-react';
import { InputModule } from './components/InputModule';
import { MemoryCard } from './components/MemoryCard';
import { TimelineView } from './components/TimelineView';
import { MilestoneView } from './components/MilestoneView'; // New Import
import { ProfileView } from './components/ProfileView';
import { GoalsView } from './components/GoalsView';
import { Background3D } from './components/Background3D';
import { SettingsModal } from './components/SettingsModal';
import { MemoryEntry, Goal, AppView } from './types';
import { storage } from './services/storage';
import { generateDailySummary } from './services/geminiService';

const THEMATIC_DATA = [
  {
    label: "LOVE",
    subtext: "CONNECTION DETECTED",
    images: [
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1518568814500-bf0f8d125f46?auto=format&fit=crop&q=80&w=800"
    ]
  },
  {
    label: "GROWTH",
    subtext: "EVOLUTION IN PROGRESS",
    images: [
      "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=800"
    ]
  },
  {
    label: "SOLITUDE",
    subtext: "INNER REFLECTION",
    images: [
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1499591934245-40b55745b905?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&q=80&w=800"
    ]
  },
  {
    label: "WONDER",
    subtext: "NEURAL EXPANSION",
    images: [
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1484589065579-248aad0d8b13?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&q=80&w=800"
    ]
  }
];

const MemoryFragment: React.FC<{ url: string; index: number; total: number }> = ({ url, index, total }) => {
  const randomSeed = (index + 1) * 137; 
  const angle = (index / total) * 360 + (randomSeed % 30);
  const distance = 32 + (randomSeed % 15); 
  
  const rad = angle * (Math.PI / 180);
  const top = `${50 + distance * Math.sin(rad)}%`;
  const left = `${50 + distance * Math.cos(rad)}%`;
  
  const rotation = (randomSeed % 20) - 10;

  return (
    <div 
      className="absolute w-48 h-64 md:w-60 md:h-80 origin-center animate-shutter"
      style={{ 
        top, 
        left, 
        transform: 'translate(-50%, -50%)',
        animationDelay: `${index * 80}ms`, 
        zIndex: 20
      }}
    >
      <div 
        className="w-full h-full p-2 bg-white/5 backdrop-blur-sm border border-white/10 shadow-2xl transition-transform duration-[8000ms] animate-float"
        style={{
           transform: `rotate(${rotation}deg)`,
           animationDelay: `${index * 200}ms`
        }}
      >
        <div className="w-full h-full overflow-hidden relative grayscale-[30%] contrast-125">
          <img 
            src={url} 
            alt="memory" 
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent opacity-20 bg-[length:100%_4px]"></div>
        </div>
      </div>
    </div>
  );
};

const IntroSequence = ({ onComplete }: { onComplete: () => void }) => {
  const [themeIndex, setThemeIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [stage, setStage] = useState<'playing' | 'final'>('playing');

  useEffect(() => {
    if (stage === 'playing') {
      const cycleTime = 1800;
      
      const timer = setTimeout(() => {
        setIsTransitioning(true); 
        
        setTimeout(() => {
          if (themeIndex < THEMATIC_DATA.length - 1) {
            setThemeIndex(prev => prev + 1);
            setIsTransitioning(false); 
          } else {
            setStage('final'); 
          }
        }, 400); 
        
      }, cycleTime);

      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
         onComplete();
      }, 2200); 
      return () => clearTimeout(timer);
    }
  }, [themeIndex, stage, onComplete]);

  const currentTheme = THEMATIC_DATA[themeIndex];
  const progress = ((themeIndex + 1) / THEMATIC_DATA.length) * 100;

  if (stage === 'final') {
    return (
      <div className="fixed inset-0 z-[100] bg-[#020202] flex flex-col items-center justify-center overflow-hidden animate-fadeIn">
        <div className="relative z-[60] text-center px-6">
           <div className="inline-flex items-center gap-2 mb-8 text-indigo-500/50 font-mono text-xs tracking-[0.5em] animate-pulse">
              <Cpu size={12} />
              SYSTEM SYNCHRONIZED
           </div>
           
           <h1 className="text-6xl md:text-9xl font-extralight tracking-[0.1em] text-white leading-tight glitch-text" data-text="Record what matters.">
            Record <br className="md:hidden" />
            <span className="italic font-light text-indigo-400">what matters.</span>
          </h1>
          
          <div className="mt-16 w-full max-w-xs mx-auto relative">
             <div className="h-[1px] w-full bg-slate-800"></div>
             <div className="absolute top-0 left-0 h-[1px] bg-indigo-500 animate-[width_1s_ease-out_forwards]" style={{width: '100%'}}></div>
          </div>
        </div>
        <Background3D />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[#020202] overflow-hidden flex items-center justify-center">
      <div 
        key={themeIndex} 
        className={`relative w-full h-full transition-all duration-400 ${isTransitioning ? 'opacity-0 scale-110 blur-xl' : 'opacity-100 scale-100 blur-0'}`}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 pointer-events-none mix-blend-screen">
          <p className="text-indigo-500 font-mono text-xs tracking-[1em] mb-4 opacity-70 animate-fadeIn">
            0{themeIndex + 1} / 0{THEMATIC_DATA.length} — {currentTheme.subtext}
          </p>
          <h2 className="text-8xl md:text-[12rem] font-black tracking-tighter text-white uppercase glitch-text leading-none drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]" data-text={currentTheme.label}>
            {currentTheme.label}
          </h2>
        </div>

        <div className="absolute inset-0 pointer-events-none">
          {currentTheme.images.map((url, idx) => (
            <MemoryFragment 
              key={`${themeIndex}-${idx}`} 
              url={url} 
              index={idx} 
              total={currentTheme.images.length} 
            />
          ))}
        </div>

      </div>

      <div className="absolute bottom-10 left-10 right-10 md:left-20 md:right-20 z-[60]">
        <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-2 uppercase tracking-widest">
           <span>Memory Retrieval</span>
           <span>Universal Neural Core</span>
        </div>
        <div className="h-[2px] w-full bg-slate-900 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)] transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
      
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_120%)] opacity-80 pointer-events-none z-40"></div>
    </div>
  );
};

const MemoryModal = ({ entry, onClose }: { entry: MemoryEntry, onClose: () => void }) => {
  if (!entry) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fadeIn cursor-pointer" onClick={onClose}></div>
      <div className="relative z-[210] w-full max-w-4xl animate-shutter" onClick={(e) => e.stopPropagation()}>
        <button 
          onClick={onClose}
          className="absolute -top-12 right-0 md:-right-12 text-white/50 hover:text-white transition-colors bg-white/5 p-2 rounded-full hover:bg-white/10"
        >
          <X size={24} strokeWidth={1.5} />
        </button>
        <MemoryCard entry={entry} variant="full" />
      </div>
    </div>
  );
};

const App = () => {
  const [introFinished, setIntroFinished] = useState(false);
  const [view, setView] = useState<AppView>(AppView.CAPTURE);
  const [selectedEntry, setSelectedEntry] = useState<MemoryEntry | null>(null);
  const [entries, setEntries] = useState<MemoryEntry[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isGeneratingDaily, setIsGeneratingDaily] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        const isEmpty = await storage.checkIsEmpty();
        if (isEmpty) {
          await storage.seedMockData();
        }

        const [loadedEntries, loadedGoals] = await Promise.all([
          storage.getEntries(),
          storage.getGoals()
        ]);
        
        if (loadedEntries) {
          const sorted = loadedEntries.sort((a, b) => b.timestamp - a.timestamp);
          setEntries(sorted);
        }
        
        if (loadedGoals) {
          setGoals(loadedGoals);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };
    loadData();
  }, []);

  const addEntry = async (entry: MemoryEntry) => {
    await storage.saveEntry(entry);
    setEntries(prev => [entry, ...prev]);
  };

  const handleGenerateDaily = async () => {
      const todayStr = new Date().toLocaleDateString();
      const todaysEntries = entries.filter(e => 
          new Date(e.timestamp).toLocaleDateString() === todayStr && 
          e.type !== 'daily_report'
      );

      if (todaysEntries.length === 0) {
          alert("今天还没有记录，请先添加一些碎片。");
          return;
      }

      setIsGeneratingDaily(true);
      try {
          const report = await generateDailySummary(todaysEntries);
          const newEntry: MemoryEntry = {
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              originalText: "Generated Daily Report",
              type: 'daily_report',
              title: report.title || `日报 ${todayStr}`,
              summary: report.summary || "今日总结",
              tags: report.tags || [],
              rating: 5,
              importance: 'high',
              generatedCardUrl: report.generatedCardUrl,
              actionItems: [],
              userMood: report.userMood
          };
          
          await addEntry(newEntry);
          setView(AppView.TIMELINE);
      } catch (e) {
          console.error(e);
          alert("日报生成失败，请重试");
      } finally {
          setIsGeneratingDaily(false);
      }
  };

  const addGoal = async (text: string, deadline: string) => {
    const newGoal: Goal = { id: crypto.randomUUID(), text, deadline, status: 'active' };
    await storage.saveGoal(newGoal);
    setGoals(prev => [...prev, newGoal]);
  };

  const updateGoalStatus = async (id: string, status: Goal['status']) => {
    const goal = goals.find(g => g.id === id);
    if (goal) {
      const updatedGoal = { ...goal, status };
      await storage.saveGoal(updatedGoal);
      setGoals(prev => prev.map(g => g.id === id ? updatedGoal : g));
    }
  };

  const renderContent = () => {
    switch (view) {
      case AppView.CAPTURE:
        const todayStr = new Date().toLocaleDateString();
        const todaysEntries = entries.filter(e => 
            new Date(e.timestamp).toLocaleDateString() === todayStr && 
            e.type !== 'daily_report'
        );

        return (
          <div className="max-w-2xl mx-auto animate-blurIn">
            <div className="mb-12 text-center relative">
              <div className="inline-block px-3 py-1 border rounded-full text-[10px] font-mono tracking-widest uppercase mb-6 shadow-[0_0_15px_rgba(16,185,129,0.2)] bg-emerald-500/10 border-emerald-500/20 text-emerald-400 cursor-default select-none">
                System Online (Hybrid Engine)
              </div>
              <h1 className="text-5xl md:text-7xl font-extralight text-slate-100 tracking-tighter mb-4">
                Record <span className="text-indigo-500 italic">what matters.</span>
              </h1>
              <p className="text-slate-500 font-light text-sm tracking-widest max-w-sm mx-auto uppercase">
                将瞬间归档为生命的数字资产
              </p>
            </div>
            
            <InputModule onEntryCreated={addEntry} goals={goals} />
            
            <div className="mt-16 animate-slideUp">
               <div className="flex items-center justify-between px-2 mb-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <CalendarDays size={14} className="text-indigo-500" />
                    Today's Log
                  </h3>
                  
                  <div className="flex items-center gap-4">
                    <button 
                        onClick={handleGenerateDaily}
                        disabled={isGeneratingDaily || todaysEntries.length === 0}
                        className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title="将今日碎片聚合成时光篇章"
                    >
                        {isGeneratingDaily ? (
                            <Loader2 size={12} className="animate-spin" />
                        ) : (
                            <Sparkles size={12} className="group-hover:text-yellow-300 transition-colors" />
                        )}
                        <span className="text-[10px] font-bold tracking-wider uppercase">生成日报</span>
                    </button>

                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-[10px] text-slate-600 font-mono">{todaysEntries.length} ENTRIES</span>
                    </div>
                  </div>
               </div>

               <div className="space-y-3">
                 {todaysEntries.length === 0 ? (
                    <div className="bg-[#0f172a]/20 border border-dashed border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center text-center group hover:bg-[#0f172a]/30 transition-colors">
                        <Clock size={24} className="text-slate-700 mb-3 group-hover:text-indigo-500/50 transition-colors" />
                        <p className="text-slate-500 text-xs font-light tracking-wide">今日暂无记录</p>
                    </div>
                 ) : (
                    todaysEntries.map((entry) => {
                       const moodColor = entry.userMood && entry.userMood > 60 ? 'bg-rose-500' : (entry.userMood && entry.userMood < 40 ? 'bg-blue-500' : 'bg-emerald-500');
                       const timeStr = new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                       return (
                         <div 
                           key={entry.id} 
                           onClick={() => setSelectedEntry(entry)}
                           className="group flex items-center gap-4 p-4 bg-[#0f172a]/40 backdrop-blur-md border border-white/5 rounded-xl hover:bg-[#0f172a]/60 hover:border-indigo-500/20 hover:shadow-lg transition-all duration-300 cursor-pointer relative overflow-hidden"
                         >
                            <div className="text-[10px] font-mono text-slate-500 group-hover:text-indigo-400 transition-colors">
                               {timeStr}
                            </div>
                            <div className="w-[1px] h-6 bg-white/5 group-hover:bg-indigo-500/30 transition-colors"></div>
                            <div className="flex-1 min-w-0">
                               <h4 className="text-sm text-slate-200 font-medium truncate group-hover:text-white transition-colors">{entry.title}</h4>
                               <p className="text-xs text-slate-500 truncate mt-0.5">{entry.summary}</p>
                            </div>
                            <div className="flex items-center gap-3">
                               {entry.generatedCardUrl && (
                                 <div className="w-8 h-8 rounded-md overflow-hidden border border-white/10 opacity-70 group-hover:opacity-100 transition-opacity">
                                    <img src={entry.generatedCardUrl} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                                 </div>
                               )}
                               <div className={`w-1.5 h-1.5 rounded-full ${moodColor} shadow-[0_0_8px_currentColor] opacity-60 group-hover:opacity-100`}></div>
                               <ChevronRight size={14} className="text-slate-700 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                            </div>
                         </div>
                       );
                    })
                 )}
               </div>
            </div>
          </div>
        );
      case AppView.JOURNAL:
        const journalEntries = entries.filter(e => e.type !== 'daily_report');
        return (
          <div className="max-w-7xl mx-auto animate-slideUp">
            <div className="mb-8 border-b border-white/5 pb-4 flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-extralight text-slate-100 tracking-tight">记忆档案库</h2>
                <p className="text-slate-500 text-xs mt-2 font-mono uppercase tracking-widest">Memory Grid</p>
              </div>
              <div className="text-xs text-slate-600 font-mono">{journalEntries.length} ITEMS</div>
            </div>
            {journalEntries.length === 0 ? (
                <div className="text-center py-24 glass-card rounded-2xl border-dashed border-white/10">
                  <Activity size={32} className="mx-auto text-slate-800 mb-4" />
                  <p className="text-slate-500 font-light">档案库目前为空。请开始您的第一次捕捉。</p>
                  <button onClick={() => setView(AppView.CAPTURE)} className="mt-6 px-6 py-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-full text-xs hover:bg-indigo-600/30 transition-all">建立链接</button>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-20">
                  {journalEntries.map(entry => (
                    <MemoryCard 
                      key={entry.id} 
                      entry={entry} 
                      variant="compact"
                      onClick={() => setSelectedEntry(entry)}
                    />
                  ))}
                </div>
            )}
          </div>
        );
      case AppView.TIMELINE:
        return (
          <div className="max-w-6xl mx-auto animate-slideUp pb-20">
            <div className="text-center mb-10">
               <h2 className="text-3xl font-extralight text-slate-100 tracking-tight">星际旅程</h2>
               <p className="text-slate-500 text-xs mt-3 font-mono uppercase tracking-widest">Daily Chronicles</p>
            </div>
            <TimelineView entries={entries} onSelectEntry={setSelectedEntry} />
          </div>
        );
      case AppView.MILESTONES: // New Case
        return (
            <div className="max-w-6xl mx-auto animate-slideUp pb-20">
                 <MilestoneView entries={entries} goals={goals} onSelectEntry={setSelectedEntry} />
            </div>
        );
      case AppView.PROFILE:
        return <div className="pb-20"><ProfileView entries={entries} /></div>;
      case AppView.GOALS:
        return (
          <div className="pb-20">
            <GoalsView 
              entries={entries} 
              goals={goals} 
              onAddGoal={addGoal}
              onUpdateGoalStatus={updateGoalStatus}
            />
          </div>
        );
    }
  };

  return (
    <>
      <Background3D />
      {!introFinished && <IntroSequence onComplete={() => setIntroFinished(true)} />}
      
      {selectedEntry && (
        <MemoryModal 
          entry={selectedEntry} 
          onClose={() => setSelectedEntry(null)} 
        />
      )}

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onConfigUpdate={() => {}} 
      />
      
      <div className={`relative z-10 min-h-screen text-slate-200 font-sans pb-32 md:pb-0 transition-opacity duration-1000 ${introFinished ? 'opacity-100' : 'opacity-0'}`}>
        
        <nav className="hidden md:block fixed top-0 w-full bg-black/40 backdrop-blur-xl border-b border-white/5 z-50 px-10 py-6">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2 font-bold text-xl text-slate-100 tracking-tight select-none">
              <TrendingUp size={24} className="text-emerald-400" />
              <span>Go<span className="text-emerald-400">2</span>Grow</span>
            </div>
            
            <div className="flex items-center gap-10">
              <DesktopNavLink active={view === AppView.JOURNAL} onClick={() => setView(AppView.JOURNAL)} label="档案" />
              <DesktopNavLink active={view === AppView.TIMELINE} onClick={() => setView(AppView.TIMELINE)} label="时间轴" />
              <DesktopNavLink active={view === AppView.MILESTONES} onClick={() => setView(AppView.MILESTONES)} label="里程碑" />
              
              <button 
                onClick={() => setView(AppView.CAPTURE)}
                className={`flex items-center gap-2 px-8 py-2.5 rounded-full text-xs font-semibold uppercase tracking-widest transition-all duration-500 border
                  ${view === AppView.CAPTURE 
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-[0_0_30px_rgba(79,70,229,0.4)]' 
                    : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'}`}
              >
                <Plus size={16} />
                捕捉
              </button>

              <DesktopNavLink active={view === AppView.PROFILE} onClick={() => setView(AppView.PROFILE)} label="画像" />
              <DesktopNavLink active={view === AppView.GOALS} onClick={() => setView(AppView.GOALS)} label="目标" />
              
              <button onClick={() => setIsSettingsOpen(true)} className="text-slate-500 hover:text-white transition-colors">
                <SettingsIcon size={18} />
              </button>
            </div>
          </div>
        </nav>

        <nav className="md:hidden fixed top-0 w-full bg-black/60 backdrop-blur-xl border-b border-white/5 z-50 px-4 py-4 flex justify-between items-center h-16">
             <div className="flex items-center gap-2 font-bold text-lg text-slate-100 tracking-tight select-none">
              <TrendingUp size={20} className="text-emerald-400" />
              <span>Go<span className="text-emerald-400">2</span>Grow</span>
            </div>
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-slate-400 hover:text-white transition-colors">
              <SettingsIcon size={20} strokeWidth={1.5} />
            </button>
        </nav>

        {/* Mobile Bottom Navigation - Added Milestone Button */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-2xl border-t border-white/10 z-50 h-24">
          <div className="grid grid-cols-7 h-full items-center px-2 pb-4">
            <MobileNavBtn active={view === AppView.JOURNAL} onClick={() => setView(AppView.JOURNAL)} icon={<GitCommit size={20} strokeWidth={1} />} label="档案" />
            <MobileNavBtn active={view === AppView.TIMELINE} onClick={() => setView(AppView.TIMELINE)} icon={<Activity size={20} strokeWidth={1} />} label="时间" />
            <MobileNavBtn active={view === AppView.MILESTONES} onClick={() => setView(AppView.MILESTONES)} icon={<Trophy size={20} strokeWidth={1} />} label="荣耀" />
            
            <div className="relative flex justify-center -top-4">
              <button 
                onClick={() => setView(AppView.CAPTURE)}
                className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all duration-500 shadow-2xl
                  ${view === AppView.CAPTURE 
                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-indigo-500/50' 
                    : 'bg-slate-900 border-white/10 text-slate-400'}`}
              >
                <Plus size={24} />
              </button>
            </div>

            <MobileNavBtn active={view === AppView.GOALS} onClick={() => setView(AppView.GOALS)} icon={<Target size={20} strokeWidth={1} />} label="目标" />
            <MobileNavBtn active={view === AppView.PROFILE} onClick={() => setView(AppView.PROFILE)} icon={<UserCircle size={20} strokeWidth={1} />} label="画像" />
            {/* Added explicit 7th col for spacing balance or future use, currently hidden on mobile grid logic often needs exact counts */}
            <div className="hidden"></div>
          </div>
        </nav>

        <main className="pt-24 md:pt-32 px-6 md:px-10 max-w-7xl mx-auto min-h-screen">
          {renderContent()}
        </main>
      </div>
    </>
  );
};

const MobileNavBtn = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1 transition-all duration-300
      ${active ? 'text-indigo-400 scale-110' : 'text-slate-600 hover:text-slate-400'}`}
  >
    {icon}
    <span className="text-[9px] font-mono tracking-tighter uppercase">{label}</span>
  </button>
);

const DesktopNavLink = ({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) => (
  <button 
    onClick={onClick}
    className={`text-[10px] font-bold tracking-[0.3em] uppercase transition-all duration-300 relative group
      ${active ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-200'}`}
  >
    {label}
    <span className={`absolute -bottom-2 left-0 w-full h-[1px] bg-indigo-500 transition-transform duration-500 origin-left ${active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-50'}`}></span>
  </button>
);

export default App;
