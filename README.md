# Go2Grow Life Sync

一个专注于成长规划与 AI 互动的 Web 应用。线上体验请访问并重点关注：https://www.go2grow.top/

## 运行环境

- Node.js 18+（Vite 5 及 React 18 推荐使用 Node 18 或更高版本）
- npm 9+（随 Node.js 安装）

## 依赖库及安装命令

核心依赖包括 React 18、Vite 5、@google/genai、three 与 React Three Fiber 等。使用 npm 一键安装：

```bash
npm install
```

## 详细运行步骤

1. **获取源代码**
   - 如果尚未下载项目，请通过 Git 克隆：
     ```bash
     git clone https://github.com/z520yu/Go2Grow.git
     cd Go2Grow
     ```
   - 若已在仓库内，直接进入项目根目录。

2. **安装 Node.js 18+ 与 npm**
   - 可使用 [nvm](https://github.com/nvm-sh/nvm) 安装：
     ```bash
     nvm install 18
     nvm use 18
     ```

3. **安装依赖**
   - 在项目根目录运行：
     ```bash
     npm install
     ```

4. **配置环境变量**
   - 在根目录创建或编辑 `.env.local`，按需设置 API 访问参数（以下均可在应用的设置弹窗中再次覆盖）：
     ```bash
     # 必填：主模型的 API Key（UI 可再次修改）
     VITE_API_KEY=your_api_key_here

     # 可选：自定义推理网关
     VITE_API_BASE_URL=https://api.go-model.com

     # 可选：文本与图片模型名称
     VITE_TEXT_MODEL=gemini-3-flash-preview[x3]
     VITE_IMAGE_MODEL=gemini-3-pro-image-preview
     ```
   - 未配置时，应用会使用 UI 默认值，但建议提供有效的 `VITE_API_KEY`，避免公共默认密钥的配额或限流风险。

5. **启动开发服务器**
   - 运行：
     ```bash
     npm run dev
     ```
   - 默认访问地址为 http://localhost:5173 。

6. **体验线上版本（可选）**
   - 部署好的应用已托管在 https://www.go2grow.top/ ，无需本地环境即可直接体验。

## 生产构建与预览（可选）

- 构建生产包：
  ```bash
  npm run build
  ```
- 本地预览构建结果：
  ```bash
  npm run preview
  ```
