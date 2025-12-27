import { MemoryEntry, Goal, UserProfile } from "../types";
import { storage } from "./storage";

// --- Configuration Helper ---
const getAIConfig = () => {
  const saved = typeof window !== 'undefined' ? localStorage.getItem('app_api_config') : null;
  
  // Hardcoded defaults per user request
  const defaults = {
    apiKey: "sk-ZMkKgOfZjrxLlVN7Iu5Z6NxHMBvoXJm8E2ntgRvUUvhmWzRm", 
    baseUrl: "https://api.go-model.com", 
    imageModel: 'gemini-3-pro-image-preview', 
    textModel: 'gemini-3-flash-preview[x3]' 
  };

  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        apiKey: parsed.apiKey || defaults.apiKey,
        baseUrl: parsed.baseUrl || defaults.baseUrl,
        imageModel: parsed.imageModel || defaults.imageModel,
        textModel: parsed.textModel || defaults.textModel
      };
    } catch (e) {
      return defaults;
    }
  }
  return defaults;
};

// Helper: Robust JSON Cleaner
const cleanJsonString = (str: string): string => {
  if (!str) return "{}";
  // 1. Remove Markdown code blocks
  let cleaned = str.replace(/```json\n?|```/g, "").trim();
  
  // 2. Find the first '{' and last '}' to ignore conversational preamble/postscript
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  
  return cleaned;
};

// Helper: Common Text Generation via Fetch (Bypassing SDK for Proxy Compatibility)
const generateTextViaFetch = async (
  prompt: string, 
  jsonMode: boolean = false, 
  imageBase64?: string
): Promise<string> => {
  const config = getAIConfig();
  if (!config.apiKey) throw new Error("API Key not configured");

  let baseUrl = config.baseUrl || "https://generativelanguage.googleapis.com";
  // Ensure no trailing slash
  if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
  
  // Use the configured text model
  const model = config.textModel || 'gemini-3-flash-preview[x3]';
  const url = `${baseUrl}/v1beta/models/${model}:generateContent?key=${config.apiKey}`;

  const parts: any[] = [{ text: prompt }];
  if (imageBase64) {
      parts.push({
           inlineData: {
               mimeType: "image/jpeg",
               data: imageBase64
           }
      });
  }

  const payload: any = {
      contents: [{ parts: parts }]
  };

  if (jsonMode) {
      payload.generationConfig = {
          responseMimeType: "application/json"
      };
  }

  const response = await fetch(url, {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
  });

  if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini Text API Error:", errText);
      throw new Error(`API Error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
};

// --- Image Generation (Raw Fetch Implementation) ---
export const generateCustomImage = async (
    summary: string, 
    mood: number, 
    tags: string[], 
    isPoster: boolean = false, 
    visualStyle: string = "chiikawa",
    throwOnError: boolean = false // New param to control error bubbling
): Promise<string | undefined> => {
  const config = getAIConfig();
  
  // Prompt Mapping based on Visual Style
  let styleKeywords = "";
  
  if (isPoster) {
      styleKeywords = "cinematic poster design, highly detailed, 8k resolution, minimalist typography aesthetics, surreal atmosphere";
  } else {
      switch (visualStyle) {
          case 'maltese':
              styleKeywords = "Line Puppy style, Maltese dog character, white fluffy puppy, simple minimalist strokes, funny cute expression, white background, meme style";
              break;
          case 'naruto':
              styleKeywords = "Naruto Shippuden anime style, Masashi Kishimoto art style, cel shaded, dynamic ninja action, manga aesthetics, dramatic lighting, anime screenshot";
              break;
          case 'custom':
              // If custom, we rely more on the subject description or generic nice style
              styleKeywords = "High quality digital illustration, unique art style, expressive, detailed";
              break;
          case 'chiikawa':
          default:
              // Default Chiikawa logic
              styleKeywords = "Chiikawa style illustration, cute small creatures, soft pastel colors, simple thick outlines, minimalist, flat colored, kawaii, hand-drawn feel, white background";
              break;
      }
      
      // If it's a custom style provided by user input
      if (!['chiikawa', 'maltese', 'naruto', 'custom'].includes(visualStyle)) {
          styleKeywords = `${visualStyle} style illustration, high quality, artistic`;
      }
  }

  let moodKeywords = "";
  if (mood < 30) moodKeywords = "crying, tears, rainy, gloomy blue tones, sad expression";
  else if (mood < 60) moodKeywords = "relaxing, peaceful, drinking tea, soft bubbles, calm expression";
  else moodKeywords = "happy, jumping, sparkles, warm lighting, cheerful expression, flowers";

  const safeSubject = summary.substring(0, 100).replace(/\n/g, " ");
  const promptText = `Style: ${styleKeywords}. Subject: ${safeSubject}. Mood context: ${moodKeywords}. Tags: ${tags.slice(0, 2).join(", ")}.`;

  // Fallback Logic (Pollinations)
  const getFallbackImage = () => {
    const seed = Math.floor(Math.random() * 10000);
    let fallbackStyle = "Chiikawa style";
    if (visualStyle === 'maltese') fallbackStyle = "cute white maltese puppy line drawing";
    if (visualStyle === 'naruto') fallbackStyle = "anime ninja style";
    if (!['chiikawa', 'maltese', 'naruto', 'custom'].includes(visualStyle)) fallbackStyle = `${visualStyle} style`;
    
    const fallbackPrompt = `${fallbackStyle} illustration of ${safeSubject}, ${moodKeywords}, thick outlines, minimalist wallpaper`;
    // Using flux model for better prompt adherence
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(fallbackPrompt)}?width=1024&height=1024&nologo=true&seed=${seed}&model=flux`;
  };

  // If no API Key provided, skip directly to fallback
  if (!config.apiKey) {
      console.log("[Image] No API Key configured, using fallback.");
      return getFallbackImage();
  }

  try {
    console.log(`[Image] Generating (${visualStyle}) via API...`);

    // Clean URL
    let baseUrl = config.baseUrl;
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
    
    // Using synchronous endpoint.
    const url = `${baseUrl}/v1beta/models/${config.imageModel}:generateContent?key=${config.apiKey}`;

    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: promptText }]
        }
      ],
      generationConfig: {
        responseModalities: ["IMAGE", "TEXT"],
        imageConfig: {
          aspectRatio: "1:1", 
          imageSize: "1K" 
        }
      }
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn("[Image] API Error:", response.status, errText);
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0]?.content?.parts) {
      for (const part of data.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          return `data:${mime};base64,${part.inlineData.data}`;
        }
      }
    }
    
    // If we got a 200 OK but no image data, it might be a safety block or text response
    throw new Error("No image data in response");

  } catch (e) {
    if (throwOnError) {
        throw e; // Let the caller decide whether to retry or use fallback
    }
    console.warn("Image Gen Failed (Using Fallback):", e);
    return getFallbackImage();
  }
};


// --- Text Analysis ---
export const analyzeInput = async (
  text: string, 
  goals: Goal[] = [],
  imageBase64?: string,
  userMood: number = 50,
  visualStyle: string = "chiikawa"
): Promise<Partial<MemoryEntry>> => {
  const config = getAIConfig();
  
  if (!config.apiKey) {
      // Offline/No-Key Fallback
      return {
          title: "记录",
          summary: text,
          tags: ["未连接AI"],
          rating: 3,
          importance: 'medium',
          actionItems: ["请在设置中配置 API Key 以获取 AI 分析"],
          userMood,
          visualStyle,
          generatedCardUrl: await generateCustomImage(text, userMood, [], false, visualStyle)
      };
  }

  const activeGoalsText = goals.length > 0 ? goals.map(g => ` - ${g.text}`).join('\n') : "暂无设定目标";

  const systemPrompt = `你是一个嘴巴很毒、眼光犀利、喜欢吐槽的生活观察员。请分析用户输入。
  
  风格要求：
  1. **摘要(summary)**：必须使用“毒舌”、“吐槽”、“幽默”的语气。不要一本正经。要一针见血地指出用户的矫情、懒惰或可爱之处。
  2. **标题(title)**：简短、有趣、带点梗。

  Strict JSON Output format (Values MUST be in Chinese):
  {
    "title": "简短标题(中文, 10字内)",
    "summary": "毒舌犀利的吐槽摘要(中文, 50字内)",
    "tags": ["标签1", "标签2"],
    "rating": 1-5,
    "importance": "low"|"medium"|"high",
    "actionItems": ["行动建议1", "行动建议2"]
  }`;

  const userPromptContent = `
    用户心情: ${userMood}/100。
    活跃目标: ${activeGoalsText}
    输入: "${text}"
  `;

  let analysisResult: any = {};

  try {
    const fullPrompt = systemPrompt + "\n" + userPromptContent;
    const responseText = await generateTextViaFetch(fullPrompt, true, imageBase64);
    
    analysisResult = JSON.parse(cleanJsonString(responseText));

  } catch (e) {
    console.error("Text Analysis Failed:", e);
    // Graceful degradation
    analysisResult = {
        title: "分析失败",
        summary: text,
        tags: ["Error"],
        rating: 3,
        importance: "low",
        actionItems: []
    };
  }

  // Generate Image (Non-blocking)
  let cardUrl = undefined;
  try {
     cardUrl = await generateCustomImage(
        analysisResult.summary || text, 
        userMood, 
        analysisResult.tags || [],
        false,
        visualStyle
     );
  } catch (e) {
     console.error("Image generation critical fail:", e);
  }

  return {
    ...analysisResult,
    userMood,
    visualStyle,
    generatedCardUrl: cardUrl
  };
};

export const generateDailySummary = async (entries: MemoryEntry[]): Promise<Partial<MemoryEntry>> => {
    const config = getAIConfig();
    if (!config.apiKey) throw new Error("请先在设置中配置 API Key");

    const combinedText = entries.map(e => `- ${e.originalText}`).join('\n');
    const avgMood = Math.round(entries.reduce((acc, curr) => acc + (curr.userMood || 50), 0) / entries.length);

    const prompt = `
    你是一位视觉笔记设计师。请分析今日的所有碎片记录，策划一张“每日生活海报”。
    
    任务：
    1. 总结今天的 3-4 个核心关键词（英文）。
    2. 设计一个具体的画面描述（英文）。
    3. 生成中文标题。
    
    Input Records:
    ${combinedText}

    Strict JSON Output format:
    {
      "title": "今日海报 (中文标题)",
      "visual_description": "Detailed visual description in English for image prompt",
      "keywords": ["Keyword1", "Keyword2", "Keyword3"], 
      "summary": "简短的中文总结 (50字内)"
    }`;

    let result: any = {};

    try {
        const responseText = await generateTextViaFetch(prompt, true);
        result = JSON.parse(cleanJsonString(responseText));
    } catch (e) {
        console.error("Daily Summary Text Failed:", e);
        throw e;
    }

    let cardUrl = undefined;
    try {
        cardUrl = await generateCustomImage(
            result.visual_description,
            avgMood,
            result.keywords || [],
            true 
        );
    } catch (e) {
        console.error("Daily Summary Image Failed:", e);
    }

    return {
        ...result,
        summary: result.summary || "今日总结", 
        tags: result.keywords,
        userMood: avgMood,
        generatedCardUrl: cardUrl,
        type: 'daily_report'
    };
};

export const generateUserProfile = async (entries: MemoryEntry[], mode: 'witty' | 'formal' = 'witty'): Promise<UserProfile> => {
  const config = getAIConfig();
  if (!config.apiKey) return { 
      archetype: "未知路人", 
      summary: "请配置 API Key 以解锁您的画像。", 
      strengths: [], 
      areasForImprovement: [], 
      recentMood: "迷雾重重", 
      detailedAnalysis: "数据不足，无法生成深度分析。"
  };
  
  let systemInstruction = "";

  if (mode === 'formal') {
      systemInstruction = `
      你是一位资深心理咨询师和职业发展教练。请基于用户的日记记录，生成一份专业、客观且具有建设性的人物画像。

      要求：
      1. **语气**：专业、温暖、客观、富有洞察力。不要使用网络用语，保持稳重。
      2. **archetype (人物称号)**：使用心理学或职业发展领域的专业术语（如：坚韧的探索者、深思熟虑的实干家）。
      3. **summary (摘要)**：简练地概括用户近期的核心状态和心理能量（50字内）。
      4. **strengths (核心优势)**：识别用户性格中的闪光点和潜在能力（如：具备高度的自我反思能力）。
      5. **areasForImprovement (发展建议)**：温和地指出可以优化的方向（如：建议加强时间管理的颗粒度）。
      6. **detailedAnalysis (深度解析)**：放在卡片背面的详细分析。100-150字，运用心理学视角（如认知行为模式、情绪调节机制）深入剖析。
      `;
  } else {
      systemInstruction = `
      你是一个毒舌、幽默、眼光犀利的AI心理侧写师。请基于用户的日记记录，生成一份有趣的人物画像。
      
      要求：
      1. **语气**：必须毒舌、幽默、有梗。不要一本正经。要一针见血。
      2. **archetype (人物称号)**：给用户起一个好笑的绰号（如：间歇性踌躇满志者、熬夜冠军、退堂鼓一级演奏家）。
      3. **summary (毒舌摘要)**：用一句话吐槽用户的近期状态（50字内）。
      4. **strengths (核心成分)**：看似优点的幽默标签（如：睡得很香、擅长发呆）。
      5. **areasForImprovement (副作用)**：扎心的缺点标签（如：钱包由于太瘦而报警、Flag倒下速度过快）。
      6. **detailedAnalysis (深度解析)**：这是放在卡片背面的详细分析。100-150字，深入剖析用户的心理模式，虽然语言犀利但要言之有物，指出其行为背后的逻辑。
      `;
  }

  const prompt = `
  ${systemInstruction}

  Input Records:
  ${entries.slice(0, 30).map(e => `[Mood:${e.userMood}] ${e.title}: ${e.summary}`).join("\n")}

  Strict JSON Output format (All Values in Chinese):
  {
    "archetype": "string",
    "summary": "string",
    "strengths": ["string", "string", "string"],
    "areasForImprovement": ["string", "string", "string"],
    "recentMood": "string (用一个成语或词语描述)",
    "detailedAnalysis": "string"
  }`;

  try {
    const responseText = await generateTextViaFetch(prompt, true);
    return JSON.parse(cleanJsonString(responseText));
  } catch (e) {
    return { 
        archetype: "连接失败者", 
        summary: "分析服务暂时罢工了。", 
        strengths: ["耐心等待"], 
        areasForImprovement: ["网络连接"], 
        recentMood: "掉线", 
        detailedAnalysis: "请检查您的 API 配置或网络连接是否正常。" 
    };
  }
};

export const checkGoals = async (goals: Goal[], entries: MemoryEntry[]): Promise<string> => {
  const config = getAIConfig();
  if (!config.apiKey) return "请配置 API Key";

  const activeGoals = goals.filter(g => g.status === 'active');
  if (activeGoals.length === 0) return "无活跃的战略目标。";

  const recent = entries.slice(0, 15).map(e => ({ t: e.title, s: e.summary }));
  const prompt = `你是魔鬼教练。用户的【战略目标】:${JSON.stringify(activeGoals.map(g=>g.text))}。近期行为记录:${JSON.stringify(recent)}。请分析用户是否在为这些目标付出努力，并给出一段简短、犀利的中文反馈和行动建议(100字内)。`;

  try {
    return await generateTextViaFetch(prompt, false);
  } catch (e) {
    return "连接错误。";
  }
};

// --- Batch Operation: Upgrade Mock Images ---
export const regenerateRecentMockImages = async (
  days: number = 30, // Increased default scan range
  targetStyle: string | null = null,
  onProgress: (current: number, total: number, currentItemTitle?: string) => void
): Promise<void> => {
    // 1. Initial State
    onProgress(0, 0, "正在扫描数据...");

    const allEntries = await storage.getEntries();
    const now = Date.now();
    const cutoff = now - (days * 24 * 60 * 60 * 1000);

    // Filter candidates
    const candidates = allEntries.filter(e => 
        e.timestamp > cutoff && 
        e.generatedCardUrl && 
        e.generatedCardUrl.includes('unsplash')
    );

    if (candidates.length === 0) {
        console.log("No candidates found for optimization.");
        throw new Error("没有找到可优化的模拟数据 (未检测到 Unsplash 图片)");
    }

    console.log(`Found ${candidates.length} mock entries to upgrade.`);
    onProgress(0, candidates.length, "准备开始...");

    // Tiny delay to let UI render the start state
    await new Promise(r => setTimeout(r, 500));

    for (let i = 0; i < candidates.length; i++) {
        const entry = candidates[i];
        
        // 3. Update Progress with Title
        onProgress(i + 1, candidates.length, entry.title || "未命名记录");

        const isPoster = entry.type === 'daily_report';
        const mood = entry.userMood || 50;
        const summary = entry.summary || entry.title;
        const tags = entry.tags || [];
        const style = targetStyle || entry.visualStyle || "chiikawa";

        let newImageUrl: string | undefined = undefined;
        let attempt = 0;
        let success = false;
        
        // Retry Loop (Max 3 attempts)
        while(attempt < 3 && !success) {
            try {
                // Try to generate with throwOnError = true
                newImageUrl = await generateCustomImage(summary, mood, tags, isPoster, style, true);
                success = true;
            } catch (err: any) {
                attempt++;
                console.warn(`Attempt ${attempt} failed for entry ${entry.id}:`, err.message);
                
                if (attempt >= 3) {
                    console.error("Max retries reached. Using fallback.");
                    // Final attempt: allow fallback (throwOnError = false)
                    newImageUrl = await generateCustomImage(summary, mood, tags, isPoster, style, false);
                } else {
                    // Backoff delay: 2s, 4s
                    const backoff = attempt * 2000;
                    await new Promise(r => setTimeout(r, backoff));
                }
            }
        }

        if (newImageUrl) {
            const updatedEntry = { 
              ...entry, 
              generatedCardUrl: newImageUrl,
              visualStyle: style 
            };
            await storage.saveEntry(updatedEntry);
        }
        
        // Standard delay between items to avoid 429
        await new Promise(r => setTimeout(r, 2000));
    }
};