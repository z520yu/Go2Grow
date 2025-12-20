import React, { useState, useEffect } from 'react';
import { Star, Tag, Calendar, Maximize2, Heart, Quote, CheckCircle2, ImageOff, Download } from 'lucide-react';
import { MemoryEntry } from '../types';

interface MemoryCardProps {
  entry: MemoryEntry;
  onClick?: () => void;
  variant?: 'compact' | 'full';
}

export const MemoryCard: React.FC<MemoryCardProps> = ({ entry, onClick, variant = 'compact' }) => {
  // Image State
  const [imgSrc, setImgSrc] = useState<string | undefined>(entry.generatedCardUrl);
  const [hasError, setHasError] = useState(false);

  // Sync prop changes to state, but respect local error state
  useEffect(() => {
    setImgSrc(entry.generatedCardUrl);
    setHasError(false);
  }, [entry.generatedCardUrl]);

  // Construct a fallback URL based on tags or summary using Pollinations.ai
  // Pollinations is free, requires no key, and is reliable for generated art
  const getFallbackUrl = () => {
    // UPDATED: Use the specific visual style from the entry for fallback
    const style = entry.visualStyle || "chiikawa";
    let stylePrompt = "Chiikawa style, cute creature";
    
    if (style === 'maltese') stylePrompt = "cute white maltese puppy, simple line drawing";
    else if (style === 'naruto') stylePrompt = "anime ninja style, naruto art style";
    else if (style !== 'chiikawa') stylePrompt = `${style} style illustration`;

    const prompt = entry.summary 
       ? `${stylePrompt}, illustration of ${entry.summary}, soft pastel colors, thick outlines, minimalist` 
       : `${stylePrompt}, pastel colors, thick outlines`;
    
    // Use ID as seed to keep it consistent per card
    const seed = entry.id.charCodeAt(0) + entry.id.charCodeAt(entry.id.length - 1);
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=800&nologo=true&seed=${seed}&model=flux`;
  };

  const handleImgError = () => {
    if (!hasError) {
      // First failure: Try fallback
      console.warn("AI Image failed to load, switching to Pollinations fallback:", imgSrc);
      setImgSrc(getFallbackUrl());
      setHasError(true);
    } else {
      // Second failure (Fallback failed): Give up
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!imgSrc) return;
    
    const link = document.createElement('a');
    link.href = imgSrc;
    // Handle Data URL or External URL naming
    link.download = `lifesync-${entry.title || 'memory'}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const dateStr = new Date(entry.timestamp).toLocaleDateString("zh-CN", {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const moodColor = entry.userMood && entry.userMood > 60 ? 'text-rose-400' : (entry.userMood && entry.userMood < 40 ? 'text-blue-400' : 'text-emerald-400');
  const ratingCount = Math.max(0, Math.min(5, Math.floor(Number(entry.rating) || 0)));

  // === COMPACT MODE (For Grid View) ===
  if (variant === 'compact') {
    return (
      <div 
        onClick={onClick}
        className="group relative bg-[#0f172a]/60 backdrop-blur-md border border-white/5 rounded-xl overflow-hidden cursor-pointer hover:border-indigo-500/30 hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] transition-all duration-300 hover:-translate-y-1 flex flex-col h-full"
      >
        {/* Image Section */}
        <div className="relative aspect-square w-full overflow-hidden bg-slate-900">
          {imgSrc ? (
            <img 
              src={imgSrc} 
              alt={entry.title} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              referrerPolicy="no-referrer"
              onError={handleImgError}
              loading="lazy"
            />
          ) : (
             <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-slate-600 gap-2">
                <span className="text-4xl">💭</span>
                <span className="text-[10px] uppercase tracking-widest">Memory</span>
             </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity pointer-events-none"></div>
          
          <div className="absolute top-3 right-3 z-10">
             <div className={`w-2 h-2 rounded-full ${moodColor.replace('text-', 'bg-')} shadow-[0_0_8px_currentColor]`}></div>
          </div>
        </div>

        {/* Text Section */}
        <div className="p-3 flex flex-col flex-1">
          <div className="flex justify-between items-start mb-1">
             <span className="text-[10px] text-slate-400 font-mono">{dateStr.split(' ')[0]}</span>
             <div className="flex text-amber-500/80">
                {[...Array(ratingCount)].map((_,i) => <Star key={i} size={8} fill="currentColor" />)}
             </div>
          </div>
          <h3 className="text-sm font-medium text-slate-200 line-clamp-1 mb-1 group-hover:text-indigo-300 transition-colors">
            {entry.title}
          </h3>
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed flex-1">
            {entry.summary}
          </p>
          
          <div className="flex gap-1 mt-3 flex-wrap">
            {entry.tags.slice(0, 2).map(tag => (
              <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/5">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // === FULL MODE (For Modal Detail View) ===
  return (
    <div className="bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden w-full max-w-4xl mx-auto shadow-2xl flex flex-col md:flex-row max-h-[85vh]">
      
      {/* Left: Visual Section */}
      <div className="w-full md:w-5/12 bg-black relative flex-shrink-0 min-h-[300px] md:min-h-0 flex items-center justify-center bg-slate-900 group">
        {imgSrc ? (
          <>
            <img 
                src={imgSrc} 
                alt="Generated Memory" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
                onError={handleImgError}
            />
            {/* Download Button Overlay */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button 
                  onClick={handleDownload}
                  className="p-2.5 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-md border border-white/10 hover:border-white/30 transition-all active:scale-95 shadow-lg"
                  title="保存原图"
                >
                  <Download size={20} />
                </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 text-slate-600">
             <ImageOff size={32} />
             <span className="text-xs uppercase tracking-widest">No Visual Data</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent md:hidden pointer-events-none"></div>
      </div>

      {/* Right: Detail Content Section */}
      <div className="w-full md:w-7/12 p-6 md:p-8 overflow-y-auto custom-scrollbar bg-[#0f172a]">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-indigo-400 tracking-widest uppercase">{dateStr}</span>
            <div className="flex gap-1">
              {[...Array(ratingCount)].map((_, i) => (
                <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
              ))}
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white leading-tight">{entry.title}</h2>
          <div className="flex flex-wrap gap-2 mt-3">
             {entry.tags.map(t => (
               <span key={t} className="px-2 py-1 rounded-md bg-white/5 text-xs text-slate-300 border border-white/10">#{t}</span>
             ))}
             {entry.userMood !== undefined && (
               <span className={`px-2 py-1 rounded-md bg-white/5 text-xs border border-white/10 ${moodColor}`}>
                 Mood: {entry.userMood}%
               </span>
             )}
          </div>
        </div>

        {/* AI Summary */}
        <div className="mb-8">
           <p className="text-slate-300 leading-relaxed text-sm md:text-base font-light">
             {entry.summary}
           </p>
        </div>

        {/* Original Input Section */}
        <div className="mb-8 p-4 rounded-xl bg-black/30 border border-white/5 relative group">
          <div className="absolute -top-3 left-3 bg-[#0f172a] px-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
             <Quote size={10} /> 原始输入
          </div>
          <p className="text-slate-400 text-sm italic leading-relaxed whitespace-pre-wrap">
            "{entry.originalText}"
          </p>
          {entry.imageUrl && (
            <div className="mt-3 rounded-lg overflow-hidden border border-white/10 w-24 h-24">
              <img src={entry.imageUrl} alt="Original upload" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* Action Items */}
        {entry.actionItems && entry.actionItems.length > 0 && (
          <div>
             <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-2">
               <CheckCircle2 size={14} /> 建议行动
             </h4>
             <ul className="space-y-2">
               {entry.actionItems.map((item, idx) => (
                 <li key={idx} className="flex items-start gap-3 text-sm text-slate-300 bg-emerald-900/10 p-2 rounded-lg border border-emerald-500/10">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
                    {item}
                 </li>
               ))}
             </ul>
          </div>
        )}

      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
};