import React, { useState, useEffect, useRef } from 'react';
import { User, Camera, Save, Calendar, Database, Activity, Settings, Edit2, Sparkles, MapPin } from 'lucide-react';
import { MemoryEntry } from '../types';

interface PersonalViewProps {
  entries: MemoryEntry[];
  onOpenSettings: () => void;
}

interface UserIdentity {
  nickname: string;
  bio: string;
  avatar: string | null;
  location: string;
}

export const PersonalView: React.FC<PersonalViewProps> = ({ entries, onOpenSettings }) => {
  const [identity, setIdentity] = useState<UserIdentity>({
    nickname: '',
    bio: '',
    avatar: null,
    location: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('user_identity');
    if (saved) {
      try {
        setIdentity(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse user identity", e);
      }
    } else {
        // Defaults
        setIdentity({
            nickname: 'Explorer',
            bio: '记录生活，探索未知。',
            avatar: null,
            location: 'Earth'
        });
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('user_identity', JSON.stringify(identity));
    setIsEditing(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setIdentity(prev => ({ ...prev, avatar: reader.result as string }));
        // Auto save avatar
        localStorage.setItem('user_identity', JSON.stringify({ ...identity, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Stats Calculation
  const stats = React.useMemo(() => {
    const totalEntries = entries.length;
    const totalDays = new Set(entries.map(e => new Date(e.timestamp).toDateString())).size;
    const avgMood = totalEntries > 0 
        ? Math.round(entries.reduce((acc, curr) => acc + (curr.userMood || 50), 0) / totalEntries) 
        : 0;
    
    // Calculate "Level" based on entries
    const level = Math.floor(Math.sqrt(totalEntries)) + 1;
    const nextLevelExp = Math.pow(level, 2);
    const progress = Math.min(100, Math.round((totalEntries / nextLevelExp) * 100));

    return { totalEntries, totalDays, avgMood, level, progress };
  }, [entries]);

  return (
    <div className="max-w-4xl mx-auto pb-24 animate-slideUp">
      
      {/* Header / Banner */}
      <div className="relative mb-20">
          <div className="h-48 w-full bg-gradient-to-r from-indigo-900 to-slate-900 rounded-3xl overflow-hidden relative">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] to-transparent"></div>
          </div>
          
          {/* User Card */}
          <div className="absolute -bottom-12 left-6 right-6 flex items-end justify-between">
              <div className="flex items-end gap-6">
                  {/* Avatar */}
                  <div className="relative group">
                      <div className="w-28 h-28 rounded-full border-4 border-[#050505] bg-slate-800 overflow-hidden shadow-2xl relative">
                          {identity.avatar ? (
                              <img src={identity.avatar} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                              <div className="w-full h-full flex items-center justify-center bg-indigo-600 text-white text-3xl font-bold">
                                  {identity.nickname.charAt(0).toUpperCase()}
                              </div>
                          )}
                          
                          {/* Avatar Edit Overlay */}
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                              <Camera size={24} className="text-white" />
                          </button>
                          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
                      </div>
                      <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-[#050505] shadow-sm" title="Online"></div>
                  </div>

                  {/* Info Display (Non-Edit Mode) */}
                  {!isEditing && (
                      <div className="mb-3">
                          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                              {identity.nickname}
                              <button onClick={() => setIsEditing(true)} className="text-slate-500 hover:text-white transition-colors">
                                  <Edit2 size={16} />
                              </button>
                          </h1>
                          <p className="text-slate-400 text-sm mt-1 max-w-md line-clamp-1">{identity.bio}</p>
                      </div>
                  )}
              </div>
              
              {/* Settings Button */}
              <button 
                onClick={onOpenSettings}
                className="mb-4 p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-slate-400 hover:text-white transition-all backdrop-blur-md"
              >
                  <Settings size={20} />
              </button>
          </div>
      </div>

      {/* Edit Form */}
      {isEditing && (
          <div className="bg-[#0f172a]/50 border border-white/10 rounded-2xl p-6 mb-8 backdrop-blur-sm animate-fadeIn mx-6">
              <div className="grid gap-4">
                  <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Nickname</label>
                      <input 
                        type="text" 
                        value={identity.nickname}
                        onChange={e => setIdentity({...identity, nickname: e.target.value})}
                        className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white focus:border-indigo-500 outline-none"
                      />
                  </div>
                  <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Bio</label>
                      <textarea 
                        value={identity.bio}
                        onChange={e => setIdentity({...identity, bio: e.target.value})}
                        className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white focus:border-indigo-500 outline-none resize-none"
                        rows={2}
                      />
                  </div>
                  <div className="flex justify-end gap-2 mt-2">
                      <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">取消</button>
                      <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm flex items-center gap-2">
                          <Save size={14} /> 保存
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-6">
          
          {/* Left: Stats Column */}
          <div className="space-y-6">
              {/* Level Card */}
              <div className="bg-[#0f172a]/40 border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/20 transition-colors"></div>
                  
                  <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Current Level</span>
                          <Sparkles size={16} className="text-indigo-400" />
                      </div>
                      <div className="text-4xl font-black text-white mb-1">LV.{stats.level}</div>
                      <div className="text-xs text-slate-500 mb-4">Explorer Class</div>
                      
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${stats.progress}%` }}></div>
                      </div>
                      <div className="flex justify-between mt-1 text-[10px] text-slate-500 font-mono">
                          <span>EXP</span>
                          <span>{stats.progress}/100</span>
                      </div>
                  </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#0f172a]/40 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:bg-[#0f172a]/60 transition-colors">
                      <Database size={20} className="text-emerald-400 mb-2" />
                      <div className="text-2xl font-bold text-white">{stats.totalEntries}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">Memories</div>
                  </div>
                  <div className="bg-[#0f172a]/40 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:bg-[#0f172a]/60 transition-colors">
                      <Calendar size={20} className="text-blue-400 mb-2" />
                      <div className="text-2xl font-bold text-white">{stats.totalDays}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">Active Days</div>
                  </div>
                  <div className="bg-[#0f172a]/40 border border-white/5 rounded-2xl p-4 col-span-2 flex items-center justify-between px-6 hover:bg-[#0f172a]/60 transition-colors">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-rose-500/10 rounded-full text-rose-400">
                              <Activity size={18} />
                          </div>
                          <div className="text-left">
                              <div className="text-xs text-slate-500 uppercase tracking-wider">Avg Mood</div>
                              <div className="text-lg font-bold text-white">{stats.avgMood}/100</div>
                          </div>
                      </div>
                      <div className="h-10 w-24">
                          {/* Mini Sparkline Simulation */}
                          <div className="h-full w-full flex items-end gap-1">
                              {[40, 60, 45, 70, 80, 60, stats.avgMood].map((h, i) => (
                                  <div key={i} className="flex-1 bg-rose-500/20 rounded-sm" style={{ height: `${h}%` }}></div>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          {/* Right: Info / Badges (Placeholder for future) */}
          <div className="md:col-span-2 space-y-6">
              <div className="bg-[#0f172a]/40 border border-white/5 rounded-2xl p-6 min-h-[300px]">
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <MapPin size={16} className="text-slate-500" /> 
                      Journey Map
                  </h3>
                  
                  {/* Simple placeholder for journey map or achievements */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {['初次记录', '连续打卡7天', '记录100条', '首个里程碑', '深度思考者'].map((badge, idx) => {
                          const unlocked = idx < 3; // Mock unlock status
                          return (
                              <div key={idx} className={`p-4 rounded-xl border flex items-center gap-4 transition-all
                                  ${unlocked 
                                      ? 'bg-indigo-500/5 border-indigo-500/20 text-indigo-100' 
                                      : 'bg-black/20 border-white/5 text-slate-600 grayscale'}`}>
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg
                                      ${unlocked ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-800'}`}>
                                      {unlocked ? '🏆' : '🔒'}
                                  </div>
                                  <div>
                                      <div className="font-bold text-sm">{badge}</div>
                                      <div className="text-[10px] opacity-60 uppercase">{unlocked ? 'Unlocked' : 'Locked'}</div>
                                  </div>
                              </div>
                          )
                      })}
                  </div>
              </div>
          </div>

      </div>
    </div>
  );
};
