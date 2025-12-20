import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, Sparkles, User, RefreshCw, Plus, CheckCircle2 } from 'lucide-react';
import { MemoryEntry, Goal, UserProfile } from '../types';
import { generateUserProfile, checkGoals } from '../services/geminiService';

interface CoachViewProps {
  entries: MemoryEntry[];
  goals: Goal[];
  onAddGoal: (text: string, deadline: string) => void;
  onUpdateGoalStatus: (id: string, status: Goal['status']) => void;
}

export const CoachView: React.FC<CoachViewProps> = ({ entries, goals, onAddGoal, onUpdateGoalStatus }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [goalFeedback, setGoalFeedback] = useState<string>('');
  const [isCheckingGoals, setIsCheckingGoals] = useState(false);
  
  // New Goal Input State
  const [newGoalText, setNewGoalText] = useState('');
  const [newGoalDate, setNewGoalDate] = useState('');

  const refreshProfile = async () => {
    if (entries.length === 0) return;
    setIsLoadingProfile(true);
    try {
      const data = await generateUserProfile(entries);
      setProfile(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const getFeedback = async () => {
    if (goals.length === 0) return;
    setIsCheckingGoals(true);
    try {
      const text = await checkGoals(goals, entries);
      setGoalFeedback(text);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCheckingGoals(false);
    }
  };

  useEffect(() => {
    // Initial load checks if we have enough data
    if (entries.length > 0 && !profile) refreshProfile();
    if (goals.length > 0 && !goalFeedback) getFeedback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount if data exists

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGoalText && newGoalDate) {
      onAddGoal(newGoalText, newGoalDate);
      setNewGoalText('');
      setNewGoalDate('');
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* User Profile Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-32 bg-white opacity-5 rounded-full transform translate-x-10 -translate-y-10"></div>
          
          <div className="flex justify-between items-start relative z-10">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <User className="text-indigo-200" />
              AI Persona Profile
            </h2>
            <button 
              onClick={refreshProfile}
              disabled={isLoadingProfile}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <RefreshCw size={18} className={isLoadingProfile ? "animate-spin" : ""} />
            </button>
          </div>

          {isLoadingProfile ? (
            <div className="h-40 flex items-center justify-center">
              <span className="text-indigo-100">Analyzing your history...</span>
            </div>
          ) : profile ? (
            <div className="mt-6 space-y-4 relative z-10">
              <p className="text-lg text-indigo-50 font-light leading-relaxed">
                "{profile.summary}"
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="bg-white/10 rounded-xl p-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-200 mb-2">Strengths</h4>
                  <ul className="list-disc list-inside text-sm text-white/90 space-y-1">
                    {profile.strengths.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
                <div className="bg-white/10 rounded-xl p-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-200 mb-2">Growth Areas</h4>
                  <ul className="list-disc list-inside text-sm text-white/90 space-y-1">
                    {profile.areasForImprovement.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
             <div className="h-40 flex items-center justify-center">
              <span className="text-indigo-100">Add entries to generate your profile.</span>
            </div>
          )}
        </div>

        {/* Quick Stats / Mood */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 flex flex-col justify-center items-center">
             <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                <Sparkles className="text-amber-500" size={32} />
             </div>
             <h3 className="text-slate-500 font-medium uppercase tracking-wide text-xs">Current Mood</h3>
             <p className="text-2xl font-bold text-slate-800 mt-1 text-center">
               {profile?.recentMood || "Neutral"}
             </p>
             <p className="text-xs text-slate-400 mt-2 text-center">Based on language analysis</p>
        </div>
      </div>

      {/* Goal Setting Section */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Target className="text-rose-500" />
            Strategic Goals
          </h2>
          <button 
            onClick={getFeedback}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <TrendingUp size={16} />
            {isCheckingGoals ? "Analyzing..." : "Get AI Feedback"}
          </button>
        </div>

        {/* Goal Input */}
        <form onSubmit={handleAddGoal} className="flex flex-col sm:flex-row gap-3 mb-8 bg-slate-50 p-4 rounded-xl">
          <input 
            type="text" 
            placeholder="Set a new goal (e.g., 'Read 5 books')" 
            className="flex-1 bg-white border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            value={newGoalText}
            onChange={(e) => setNewGoalText(e.target.value)}
          />
          <input 
            type="date" 
            className="bg-white border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            value={newGoalDate}
            onChange={(e) => setNewGoalDate(e.target.value)}
          />
          <button 
            type="submit"
            className="bg-indigo-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Add
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-700 mb-2">Active Targets</h3>
            {goals.length === 0 && <p className="text-slate-400 italic text-sm">No goals set yet.</p>}
            {goals.map(goal => (
              <div key={goal.id} className="flex items-center gap-3 p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors group">
                <button 
                  onClick={() => onUpdateGoalStatus(goal.id, goal.status === 'completed' ? 'active' : 'completed')}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                    ${goal.status === 'completed' ? 'bg-green-500 border-green-500' : 'border-slate-300'}`}
                >
                  {goal.status === 'completed' && <CheckCircle2 size={12} className="text-white" />}
                </button>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${goal.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                    {goal.text}
                  </p>
                  <p className="text-xs text-slate-400">Due: {new Date(goal.deadline).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-rose-50 rounded-xl p-5 border border-rose-100">
            <h3 className="font-bold text-rose-700 mb-3 flex items-center gap-2">
              <Sparkles size={16} />
              Coach's Feedback
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed italic">
              {goalFeedback || "Add goals and journal entries to receive personalized coaching advice from the AI."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};