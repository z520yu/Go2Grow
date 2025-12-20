import { MemoryEntry, Goal } from '../types';

// Curated Unsplash images that match the "Life/Tech/Mood" aesthetic
// Using specific IDs to ensure fast loading and reliability
const MOCK_IMAGES = [
  "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800", // Tech/Code
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=800", // Nature/Mist
  "https://images.unsplash.com/photo-1518066000714-58c45f1a2c0a?auto=format&fit=crop&q=80&w=800", // Dark/Mood (Replaced)
  "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=800", // Office/Work
  "https://images.unsplash.com/photo-1587620962725-abab7fe55159?auto=format&fit=crop&q=80&w=800", // Coding
  "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800", // Yoga/Meditation
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800", // Event/Crowd
  "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=800", // Coffee
  "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=800", // Learning/Book
  "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&q=80&w=800", // Rain/Mood
  "https://images.unsplash.com/photo-1493934558415-9d19f0b2b4d2?auto=format&fit=crop&q=80&w=800", // Desk/Minimal
  "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&q=80&w=800", // Party/City (Replaced)
];

const TOPICS = [
  // 工作 & 编程
  { text: "今天修复了一个非常棘手的并发 Bug，感觉自己像个侦探。虽然很累，但解决问题的那一刻多巴胺爆棚。", title: "代码侦探", tag: "工作", mood: 85, imgIdx: 0 },
  { text: "重构了遗留代码库，删掉了 500 行废弃代码。清爽！", title: "代码大扫除", tag: "工作", mood: 75, imgIdx: 4 },
  { text: "产品经理的需求又变了，在这个最后期限... 深呼吸，保持专业。", title: "需求变更", tag: "压力", mood: 30, imgIdx: 10 },
  { text: "和团队进行了一场高效的头脑风暴，确定了 Q4 的路线图。", title: "思维碰撞", tag: "会议", mood: 80, imgIdx: 3 },
  { text: "服务器在半夜挂了，紧急上线抢修。运维的生活就是这样朴实无华。", title: "午夜运维", tag: "工作", mood: 45, imgIdx: 0 },

  // 生活 & 自然
  { text: "下班路上的夕阳太美了，紫红色的天空笼罩着城市。", title: "紫霞满天", tag: "自然", mood: 95, imgIdx: 1 },
  { text: "路边遇到一只流浪猫，给它买了根火腿肠。它蹭了蹭我的裤脚。", title: "偶遇", tag: "生活", mood: 90, imgIdx: 2 },
  { text: "终于打卡了那家排队很久的咖啡店，手冲耶加雪菲味道很正。", title: "咖啡时间", tag: "探店", mood: 85, imgIdx: 7 },
  { text: "周末的大扫除，扔掉了很多不需要的东西，断舍离。", title: "断舍离", tag: "生活", mood: 70, imgIdx: 10 },
  { text: "下雨天，窝在沙发上听着雨声发呆，什么都不想做。", title: "雨日", tag: "放空", mood: 60, imgIdx: 9 },

  // 学习 & 成长
  { text: "读完了《纳瓦尔宝典》，对财富和幸福有了新的理解。", title: "阅读时刻", tag: "学习", mood: 80, imgIdx: 8 },
  { text: "开始学习 Three.js，3D 图形的世界太迷人了，虽然数学有点难。", title: "新技能", tag: "学习", mood: 75, imgIdx: 0 },
  { text: "健身房练腿日，感觉明天要下不了楼了。", title: "酸爽", tag: "健康", mood: 80, imgIdx: 6 },
  { text: "尝试冥想了 10 分钟，杂念很多，但稍微平静了一些。", title: "向内探索", tag: "冥想", mood: 65, imgIdx: 5 },
  
  // 情绪 & 思考
  { text: "有时候会怀疑自己现在的方向是否正确，迷茫期。", title: "迷茫", tag: "思考", mood: 40, imgIdx: 2 },
  { text: "深夜的灵感爆发，写下了一段很棒的旋律。", title: "Flow State", tag: "创造", mood: 90, imgIdx: 11 },
  { text: "和老朋友通了两个小时电话，聊聊近况，仿佛回到了大学时光。", title: "叙旧", tag: "情感", mood: 88, imgIdx: 11 },
];

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const generateHistoricalData = (daysBack: number = 30): MemoryEntry[] => {
  const entries: MemoryEntry[] = [];
  const now = Date.now();

  for (let i = 0; i < daysBack; i++) {
    const dateTimestamp = now - (i * ONE_DAY_MS);
    const dateObj = new Date(dateTimestamp);
    
    // 1. Generate 1-2 Regular Entries per day
    const entriesCount = 1 + Math.floor(Math.random() * 2); // 1 or 2 entries
    const dayTags: Set<string> = new Set();
    let dayMoodSum = 0;

    for (let j = 0; j < entriesCount; j++) {
      // Pick a random template but loosely based on a cycle to ensure variety
      const templateIndex = (i * 2 + j + Math.floor(Math.random() * 5)) % TOPICS.length;
      const template = TOPICS[templateIndex];
      
      const entryTime = dateTimestamp - Math.floor(Math.random() * (12 * 60 * 60 * 1000)); // Random time during day

      dayTags.add(template.tag);
      dayMoodSum += template.mood;

      // Use a consistent random image from the set based on topic
      const imageIndex = (template.imgIdx + j) % MOCK_IMAGES.length;

      entries.push({
        id: `mock-entry-${i}-${j}`,
        timestamp: entryTime,
        originalText: template.text,
        title: template.title,
        summary: template.text, 
        tags: [template.tag],
        rating: 3 + Math.floor(Math.random() * 2), // 3-5
        importance: Math.random() > 0.7 ? 'high' : 'medium',
        actionItems: [],
        userMood: template.mood,
        type: 'entry',
        // USE STABLE UNSPLASH URL for mock data
        generatedCardUrl: MOCK_IMAGES[imageIndex]
      });
    }

    // 2. Generate Daily Report (The Poster) - Every 3 days or random
    if (i % 3 === 0) { 
        const avgMood = Math.round(dayMoodSum / entriesCount);
        const keywords = Array.from(dayTags).join(" ");
        // Use abstract/artistic images for "Posters"
        const posterUrl = MOCK_IMAGES[(i + 99) % MOCK_IMAGES.length];
        
        entries.push({
        id: `mock-report-${i}`,
        timestamp: dateTimestamp, 
        originalText: "Daily Summary Auto-Gen",
        title: `日报 · ${dateObj.getMonth() + 1}月${dateObj.getDate()}日`,
        summary: `今日关键词: ${keywords}。`,
        tags: Array.from(dayTags),
        rating: 5,
        importance: 'high',
        type: 'daily_report',
        actionItems: [],
        userMood: avgMood,
        generatedCardUrl: posterUrl
        });
    }
  }

  return entries;
};

// NEW: Generate Mock Goals based on the journal themes
export const generateMockGoals = (): Goal[] => {
  const now = Date.now();
  const DAY = ONE_DAY_MS;

  return [
    {
      id: 'mock-goal-1',
      text: '掌握 Three.js 3D 渲染技术',
      deadline: new Date(now + 14 * DAY).toISOString().split('T')[0], // Active, Future
      status: 'active'
    },
    {
      id: 'mock-goal-2',
      text: '完成《纳瓦尔宝典》阅读笔记',
      deadline: new Date(now + 2 * DAY).toISOString().split('T')[0], // Active, Near Future
      status: 'active'
    },
    {
      id: 'mock-goal-3',
      text: '每周健身房练腿 1 次',
      deadline: new Date(now).toISOString().split('T')[0], // Today
      status: 'active'
    },
    {
      id: 'mock-goal-4',
      text: '整理 Q4 产品路线图',
      deadline: new Date(now - 3 * DAY).toISOString().split('T')[0], // Past Completed
      status: 'completed'
    },
    {
      id: 'mock-goal-5',
      text: '进行一次家庭断舍离',
      deadline: new Date(now - 10 * DAY).toISOString().split('T')[0], // Past Completed
      status: 'completed'
    },
    {
      id: 'mock-goal-6',
      text: '每天冥想 10 分钟 (连续7天)',
      deadline: new Date(now + 7 * DAY).toISOString().split('T')[0], // Future
      status: 'active'
    }
  ];
};
