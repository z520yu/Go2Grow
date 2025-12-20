import React, { useState, useRef } from 'react';
import { Loader2, Image as ImageIcon, Send, X, Mic, Smile, Frown, Meh, Palette, Cat, Dog, Sword } from 'lucide-react';
import { analyzeInput } from '../services/geminiService';
import { MemoryEntry, Goal } from '../types';

interface InputModuleProps {
  onEntryCreated: (entry: MemoryEntry) => void;
  goals: Goal[]; // Receive goals to pass to AI context
}

const STYLES = [
  { id: 'chiikawa', label: '吉伊', icon: <Cat size={14} />, color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
  { id: 'maltese', label: '线条小狗', icon: <Dog size={14} />, color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { id: 'naruto', label: '火影', icon: <Sword size={14} />, color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  { id: 'custom', label: '自定义', icon: <Palette size={14} />, color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
];

export const InputModule: React.FC<InputModuleProps> = ({ onEntryCreated, goals }) => {
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mood, setMood] = useState<number>(50); // Default mood 50 (Neutral)
  
  // Style State
  const [selectedStyle, setSelectedStyle] = useState<string>('chiikawa');
  const [customStyleText, setCustomStyleText] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setSelectedImage(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageRemove = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!text && !selectedImage) return;

    setIsAnalyzing(true);
    try {
      const base64Data = selectedImage ? selectedImage.split(',')[1] : undefined;
      
      // Filter for active goals to provide relevant context
      const activeGoals = goals.filter(g => g.status === 'active');

      // Determine final style string
      const finalStyle = selectedStyle === 'custom' ? (customStyleText || 'Artistic') : selectedStyle;

      // Pass the mood, goals AND STYLE to the analysis service
      const analysis = await analyzeInput(text, activeGoals, base64Data, mood, finalStyle);
      
      const newEntry: MemoryEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        originalText: text,
        imageUrl: selectedImage || undefined,
        generatedCardUrl: analysis.generatedCardUrl, 
        userMood: analysis.userMood,
        visualStyle: analysis.visualStyle, // Store the style
        title: analysis.title || "未命名记录",
        summary: analysis.summary || text,
        tags: analysis.tags || [],
        rating: analysis.rating || 3,
        importance: (analysis.importance as any) || 'low',
        actionItems: analysis.actionItems || []
      };

      onEntryCreated(newEntry);
      setText('');
      setSelectedImage(null);
      setMood(50); // Reset mood
      // Don't reset style, user might want to reuse it
      if (fileInputRef.current) fileInputRef.current.value = '';
      
    } catch (error) {
      console.error("Analysis failed", error);
      alert("分析中断，请检查网络连接。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Helper to determine mood color and icon
  const getMoodVisuals = (val: number) => {
    if (val < 30) return { color: 'text-blue-400', bg: 'bg-blue-500', icon: <Frown size={20} />, label: 'Emo' };
    if (val < 70) return { color: 'text-emerald-400', bg: 'bg-emerald-500', icon: <Meh size={20} />, label: 'Chill' };
    return { color: 'text-rose-400', bg: 'bg-rose-500', icon: <Smile size={20} />, label: 'Happy' };
  };

  const moodVisuals = getMoodVisuals(mood);

  return (
    <div className="bg-[#0f172a]/40 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] p-6 mb-8 border border-white/10 relative overflow-hidden group transition-all duration-500 hover:border-indigo-500/30">
      {/* Subtle Glow Effect - Focused on top border */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
      
      {/* Background ambient light inside card */}
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="space-y-5 relative z-10">
        <textarea
          className="w-full p-5 rounded-xl bg-black/30 border border-white/5 text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:outline-none resize-none transition-all duration-300 text-base leading-relaxed backdrop-blur-sm"
          rows={4}
          placeholder="记录当下... (AI 将用毒舌风格吐槽并绘制卡片)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isAnalyzing}
        />

        <div className="flex flex-col md:flex-row gap-4">
            {/* Mood Slider Section */}
            <div className="bg-black/20 rounded-xl p-4 border border-white/5 flex-1">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Mood Sync</span>
                    <div className={`flex items-center gap-2 ${moodVisuals.color} font-mono text-xs font-bold uppercase transition-colors duration-300`}>
                        {moodVisuals.label} {moodVisuals.icon}
                    </div>
                </div>
                
                <div className="relative h-6 w-full flex items-center">
                    <input
                    type="range"
                    min="0"
                    max="100"
                    value={mood}
                    onChange={(e) => setMood(Number(e.target.value))}
                    disabled={isAnalyzing}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer z-10 focus:outline-none focus:ring-0"
                    style={{
                        backgroundImage: `linear-gradient(to right, #60a5fa 0%, #34d399 50%, #fb7185 100%)`
                    }}
                    />
                </div>
            </div>

            {/* Style Selector Section */}
            <div className="bg-black/20 rounded-xl p-4 border border-white/5 flex-1 flex flex-col justify-center">
               <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3">Art Style</span>
               <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {STYLES.map(style => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all whitespace-nowrap
                            ${selectedStyle === style.id 
                                ? style.color 
                                : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'}`}
                      >
                         {style.icon}
                         {style.label}
                      </button>
                  ))}
               </div>
               {selectedStyle === 'custom' && (
                   <input 
                      type="text"
                      placeholder="输入自定义风格 (如: 赛博朋克, 水墨画...)"
                      className="mt-2 w-full bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
                      value={customStyleText}
                      onChange={(e) => setCustomStyleText(e.target.value)}
                   />
               )}
            </div>
        </div>


        {selectedImage && (
          <div className="relative inline-block animate-fadeIn">
            <div className="relative rounded-lg overflow-hidden border border-white/10 group/img shadow-lg">
                <img 
                src={selectedImage} 
                alt="Preview" 
                className="h-40 w-auto object-cover opacity-90" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            </div>
            <button
              onClick={handleImageRemove}
              className="absolute -top-2 -right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-red-900/80 border border-white/10 transition-colors backdrop-blur-md"
            >
              <X size={12} />
            </button>
          </div>
        )}

        <div className="flex justify-between items-center pt-2">
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzing}
              className="flex items-center gap-2 text-slate-400 hover:text-indigo-400 transition-colors px-3 py-2 rounded-lg hover:bg-white/5"
            >
              <ImageIcon size={18} />
              <span className="text-xs font-medium tracking-wide uppercase">添加图片</span>
            </button>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isAnalyzing || (!text && !selectedImage)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm tracking-wide text-white transition-all duration-300
              ${isAnalyzing || (!text && !selectedImage)
                ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed border border-transparent'
                : 'bg-indigo-600/90 hover:bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.3)] border border-indigo-400/20 active:scale-[0.98]'
              }`}
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={16} className="animate-spin text-indigo-300" />
                <span className="text-indigo-200">生成中...</span>
              </>
            ) : (
              <>
                <span>记录并生成</span>
                <Send size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};