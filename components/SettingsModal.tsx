import React, { useState, useEffect } from 'react';
import { Save, RotateCcw, X, Settings, Link, Box, Key, MessageSquare, Trash2, AlertTriangle, Wand2, Loader2, Database, Network, Cat, Dog, Sword, Palette } from 'lucide-react';
import { storage } from '../services/storage';
import { regenerateRecentMockImages } from '../services/geminiService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdate: () => void;
}

const STYLES = [
  { id: 'chiikawa', label: '吉伊', icon: <Cat size={14} />, color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
  { id: 'maltese', label: '线条小狗', icon: <Dog size={14} />, color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { id: 'naruto', label: '火影', icon: <Sword size={14} />, color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  { id: 'custom', label: '自定义', icon: <Palette size={14} />, color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onConfigUpdate }) => {
  const [activeTab, setActiveTab] = useState<'api' | 'data'>('api');
  
  // Config State
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [imageModel, setImageModel] = useState('');
  const [textModel, setTextModel] = useState('');
  
  // Data State
  const [isClearing, setIsClearing] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeProgress, setUpgradeProgress] = useState<{current: number, total: number} | null>(null);
  const [currentProcessingTitle, setCurrentProcessingTitle] = useState<string>('');
  const [mockImageCount, setMockImageCount] = useState(0);

  // Style Selection for Upgrade
  const [selectedStyle, setSelectedStyle] = useState<string>('chiikawa');
  const [customStyleText, setCustomStyleText] = useState('');

  // Safe Env Helper
  const getEnv = (key: string, fallback: string) => {
    try {
      // @ts-ignore
      return (import.meta.env && import.meta.env[key]) || fallback;
    } catch (e) {
      return fallback;
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Load Config from LocalStorage
      const savedConfig = localStorage.getItem('app_api_config');
      
      // Get Environment Defaults (Fallback)
      const envApiKey = getEnv("VITE_API_KEY", "sk-ZMkKgOfZjrxLlVN7Iu5Z6NxHMBvoXJm8E2ntgRvUUvhmWzRm");
      const envBaseUrl = getEnv("VITE_API_BASE_URL", "https://api.go-model.com");
      const envTextModel = getEnv("VITE_TEXT_MODEL", "gemini-3-flash-preview[x3]");
      const envImageModel = getEnv("VITE_IMAGE_MODEL", "gemini-3-pro-image-preview");

      if (savedConfig) {
        try {
          const config = JSON.parse(savedConfig);
          setBaseUrl(config.baseUrl || envBaseUrl);
          setApiKey(config.apiKey || envApiKey);
          setImageModel(config.imageModel || envImageModel); 
          setTextModel(config.textModel || envTextModel);
        } catch (e) {
          console.error("Error parsing config", e);
          // Fallback to env
          setBaseUrl(envBaseUrl);
          setApiKey(envApiKey);
          setImageModel(envImageModel);
          setTextModel(envTextModel);
        }
      } else {
        // No local config? Load Defaults from ENV
        setBaseUrl(envBaseUrl);
        setApiKey(envApiKey);
        setImageModel(envImageModel);
        setTextModel(envTextModel);
      }

      // Check for mock images (SCAN LAST 30 DAYS)
      const checkMockImages = async () => {
         try {
             const entries = await storage.getEntries();
             const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 Days Check
             const count = entries.filter(e => 
                e.timestamp > cutoff && 
                e.generatedCardUrl && 
                e.generatedCardUrl.includes('unsplash')
             ).length;
             setMockImageCount(count);
         } catch(e) {
             console.error("Failed to check mock images", e);
         }
      };
      checkMockImages();
    }
  }, [isOpen]);

  const saveConfigInternal = () => {
    let finalBaseUrl = baseUrl.trim();
    if (finalBaseUrl && !finalBaseUrl.startsWith('http')) {
      finalBaseUrl = 'https://' + finalBaseUrl;
    }
    finalBaseUrl = finalBaseUrl.replace(/\/$/, "");

    const config = { 
      baseUrl: finalBaseUrl, 
      apiKey: apiKey.trim(), 
      imageModel: imageModel.trim(),
      textModel: textModel.trim() 
    };
    localStorage.setItem('app_api_config', JSON.stringify(config));
    
    // Compatibility
    localStorage.setItem('image_gen_config', JSON.stringify({
        baseUrl: finalBaseUrl,
        apiKey: apiKey.trim(),
        model: imageModel.trim()
    }));
    
    onConfigUpdate();
    return config;
  };

  const handleSave = () => {
    saveConfigInternal();
    onClose();
  };

  const handleResetConfig = () => {
    // Reset to ENV vars
    const envApiKey = getEnv("VITE_API_KEY", "sk-ZMkKgOfZjrxLlVN7Iu5Z6NxHMBvoXJm8E2ntgRvUUvhmWzRm");
    const envBaseUrl = getEnv("VITE_API_BASE_URL", "https://api.go-model.com");
    const envTextModel = getEnv("VITE_TEXT_MODEL", "gemini-3-flash-preview[x3]");
    const envImageModel = getEnv("VITE_IMAGE_MODEL", "gemini-3-pro-image-preview");

    setBaseUrl(envBaseUrl);
    setApiKey(envApiKey);
    setImageModel(envImageModel);
    setTextModel(envTextModel);
    
    // Clear Local Storage
    localStorage.removeItem('app_api_config');
    localStorage.removeItem('image_gen_config');
    
    onConfigUpdate();
    // onClose(); // Optional: Keep open to show reset values
  };

  const handleClearData = async () => {
    if (confirm("确定要清空所有数据（包括模拟数据和您的记录）吗？\n\n清空后，刷新页面将重新生成新的模拟数据。")) {
      setIsClearing(true);
      try {
        await storage.clearDatabase();
        alert("数据已清空。页面将刷新以重新生成基础数据。");
        window.location.reload();
      } catch (e) {
        alert("清空失败");
        setIsClearing(false);
      }
    }
  };

  const handleUpgradeImages = async () => {
      // FORCE SAVE CURRENT CONFIG FIRST to ensure service uses latest inputs
      saveConfigInternal();

      const finalStyle = selectedStyle === 'custom' ? (customStyleText || 'Artistic') : selectedStyle;
      const styleLabel = STYLES.find(s => s.id === selectedStyle)?.label || finalStyle;

      // 1. Pre-check API Key status
      if (!apiKey) {
          const proceed = confirm(
              "⚠️ 未检测到 API Key\n\n系统将使用【简易绘图引擎 (Pollinations)】进行重绘。\n它不需要 Key，但风格控制能力较弱，偶尔可能生成失败。\n\n是否继续？"
          );
          if (!proceed) return;
      } else {
          const proceed = confirm(
              `🎨 准备优化 ${mockImageCount} 条记录\n\n目标风格：【${styleLabel}】\n预计耗时：${Math.ceil(mockImageCount * 3)} 秒\n(为保证生成质量，增加了间隔时间)\n\n请保持页面开启，确定开始吗？`
          );
          if (!proceed) return;
      }

      // 2. Immediate UI Update
      setIsUpgrading(true);
      setUpgradeProgress({ current: 0, total: mockImageCount }); 
      setCurrentProcessingTitle("正在初始化引擎...");

      try {
          // Give UI a moment to render the progress bar before main thread gets busy
          await new Promise(r => setTimeout(r, 100));

          // 3. Start Process
          await regenerateRecentMockImages(30, finalStyle, (current, total, currentTitle) => {
              setUpgradeProgress({ current, total });
              if (currentTitle) setCurrentProcessingTitle(currentTitle);
          });

          // 4. Success Handling
          // Add a small delay so user sees the bar hit 100%
          await new Promise(r => setTimeout(r, 600));
          
          if (confirm("✨ 优化完成！\n\n所有的模拟图片已更新。点击【确定】刷新页面以查看效果。")) {
              window.location.reload();
          }

      } catch (e: any) {
          console.error(e);
          if (e.message && e.message.includes("没有找到")) {
              alert(e.message);
          } else {
              alert("升级过程中遇到意外错误，请检查网络或控制台日志。");
          }
      } finally {
          setIsUpgrading(false);
          setUpgradeProgress(null);
          setCurrentProcessingTitle('');
      }
  };

  if (!isOpen) return null;

  const progressPercentage = upgradeProgress && upgradeProgress.total > 0
      ? Math.round((upgradeProgress.current / upgradeProgress.total) * 100) 
      : 0;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={isUpgrading ? undefined : onClose}></div>
      <div className="relative bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-shutter max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 px-2">
          <h2 className="text-lg font-light text-white flex items-center gap-2">
            <Settings size={20} className="text-indigo-500" />
            <span>设置面板</span>
          </h2>
          <button onClick={onClose} disabled={isUpgrading} className="text-slate-500 hover:text-white transition-colors bg-white/5 p-1.5 rounded-full disabled:opacity-50"><X size={18}/></button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 mb-6 mx-2">
           <button 
             onClick={() => !isUpgrading && setActiveTab('api')} 
             disabled={isUpgrading}
             className={`flex-1 pb-3 text-xs font-bold uppercase tracking-widest transition-all relative
                ${activeTab === 'api' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'} disabled:opacity-50`}
           >
             <div className="flex items-center justify-center gap-2">
               <Network size={14} /> API 连接
             </div>
             {activeTab === 'api' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-indigo-500 rounded-full"></span>}
           </button>
           <button 
             onClick={() => !isUpgrading && setActiveTab('data')}
             disabled={isUpgrading} 
             className={`flex-1 pb-3 text-xs font-bold uppercase tracking-widest transition-all relative
                ${activeTab === 'data' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'} disabled:opacity-50`}
           >
             <div className="flex items-center justify-center gap-2">
               <Database size={14} /> 数据管理
               {mockImageCount > 0 && <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse"></span>}
             </div>
             {activeTab === 'data' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-indigo-500 rounded-full"></span>}
           </button>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto px-2 pb-2 custom-scrollbar flex-1">
          
          {/* === API TAB === */}
          {activeTab === 'api' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="bg-indigo-900/10 rounded-lg p-3 border border-indigo-500/10">
                <p className="text-[10px] text-indigo-300 leading-relaxed">
                  配置 AI 代理服务 (如 OneAPI/Go-Model)。默认配置已通过环境变量加载，您也可以在此覆盖。
                </p>
              </div>

              <div className="space-y-4">
                <div className="group">
                  <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 group-focus-within:text-indigo-400 transition-colors">
                    <Link size={12} /> Base URL
                  </label>
                  <input 
                    type="text" 
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono placeholder-slate-700"
                    placeholder="https://api.example.com"
                  />
                </div>

                <div className="group">
                  <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 group-focus-within:text-indigo-400 transition-colors">
                    <Key size={12} /> API Key
                  </label>
                  <input 
                    type="password" 
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono tracking-tight"
                    placeholder="sk-..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="group">
                    <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 group-focus-within:text-pink-400 transition-colors">
                      <Box size={12} /> 绘图模型
                    </label>
                    <input 
                      type="text" 
                      value={imageModel}
                      onChange={(e) => setImageModel(e.target.value)}
                      className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/50 transition-all font-mono placeholder-slate-700"
                      placeholder="gemini-3-pro-image-preview"
                    />
                  </div>
                  <div className="group">
                    <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 group-focus-within:text-emerald-400 transition-colors">
                      <MessageSquare size={12} /> 文本模型
                    </label>
                    <input 
                      type="text" 
                      value={textModel}
                      onChange={(e) => setTextModel(e.target.value)}
                      className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all font-mono placeholder-slate-700"
                      placeholder="gemini-3-flash-preview[x3]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/5">
                <button 
                  onClick={handleResetConfig}
                  className="px-4 py-2 rounded-xl border border-white/10 text-slate-500 hover:text-white text-xs font-medium transition-colors flex items-center gap-2 hover:bg-white/5"
                >
                  <RotateCcw size={12} /> 恢复默认 (Env)
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-2.5 text-sm font-medium transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <Save size={16} /> 保存配置
                </button>
              </div>
            </div>
          )}

          {/* === DATA TAB === */}
          {activeTab === 'data' && (
             <div className="space-y-6 animate-fadeIn">
                
                {/* Upgrade Section */}
                <div className="bg-[#0f172a] rounded-xl border border-white/10 p-5 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-16 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:bg-indigo-500/20 transition-colors"></div>
                   
                   <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                     <Wand2 size={16} className="text-purple-400" />
                     图片资产优化
                   </h3>
                   <p className="text-xs text-slate-400 mb-4 leading-relaxed relative z-10">
                     检测并升级使用临时占位符(Unsplash)的记录。系统将根据文本内容，重绘为指定风格的记忆卡片。
                   </p>
                   
                   <div className="flex items-center justify-between bg-black/20 rounded-lg p-3 mb-4 border border-white/5 relative z-10">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">可优化项目 (30天内)</span>
                      <span className={`text-sm font-mono font-bold ${mockImageCount > 0 ? 'text-indigo-400' : 'text-slate-600'}`}>
                        {mockImageCount} ITEMS
                      </span>
                   </div>

                   {/* Style Selector for Optimization */}
                   {!isUpgrading && (
                       <div className="mb-4 relative z-10 animate-fadeIn">
                          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 block">选择重绘风格</span>
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
                                  placeholder="输入自定义风格..."
                                  className="mt-2 w-full bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
                                  value={customStyleText}
                                  onChange={(e) => setCustomStyleText(e.target.value)}
                              />
                          )}
                       </div>
                   )}

                   {isUpgrading ? (
                       <div className="relative z-10 space-y-2 bg-black/30 p-3 rounded-xl border border-white/5">
                           <div className="flex justify-between items-center text-xs">
                               <span className="text-indigo-300 font-medium">重绘进度</span>
                               <span className="font-mono text-slate-400">{upgradeProgress?.current}/{upgradeProgress?.total}</span>
                           </div>
                           <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                               <div 
                                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                                  style={{ width: `${progressPercentage}%` }}
                               ></div>
                           </div>
                           <p className="text-[10px] text-slate-500 truncate mt-1">
                               正在生成: <span className="text-slate-300">{currentProcessingTitle}</span>
                           </p>
                       </div>
                   ) : (
                       <button 
                          onClick={handleUpgradeImages}
                          disabled={mockImageCount === 0}
                          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all relative z-10
                            ${mockImageCount > 0 
                               ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30 hover:border-indigo-500/50 hover:text-white'
                               : 'bg-slate-800/50 border-white/5 text-slate-600 cursor-not-allowed'}`}
                       >
                           <Wand2 size={14} />
                           <span>开始优化</span>
                       </button>
                   )}
                </div>

                {/* Danger Zone */}
                <div className="bg-red-900/5 rounded-xl border border-red-500/10 p-5">
                   <h3 className="text-sm font-bold text-red-200/80 mb-2 flex items-center gap-2">
                     <AlertTriangle size={16} className="text-red-400" />
                     危险区域
                   </h3>
                   <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                     清空本地数据库中的所有记录、目标和缓存。此操作不可逆。
                   </p>
                   <button 
                      onClick={handleClearData}
                      disabled={isClearing || isUpgrading}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all text-xs font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                       <Trash2 size={14} />
                       {isClearing ? "Clearing..." : "清空所有数据"}
                   </button>
                </div>

             </div>
          )}

        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};