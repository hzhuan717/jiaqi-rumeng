# 佳期如梦 · 时光之书

小果果写给小佳 · 小乖的互动故事书网页。打开这本书，一起读完一个会自己长大的故事。

纯原生 HTML/CSS/JavaScript 实现，零依赖，可直接部署到 GitHub Pages / Netlify / Vercel。

## 运行方式

```bash
npm run dev      # 本地开发（http://localhost:5173）
npm run build    # 打包到 dist/
npm run preview  # 预览构建产物
```

手机或浏览器直接打开页面即可体验。PC 打开会居中显示为手机卡片效果。

## 这本书有什么

故事书式浏览，共 9 页：封面 → 7 个章节 → 终章。

- **会自己长大的日期**：首次见面 / 在一起天数 / 一周年倒计时全部实时计算，每天自动 +1，不用手动改。
- **节日感应**：今天是 520、情人节、七夕、圣诞时，页面自动亮起节日标签。
- **时光碎片**：共 5 枚（序章之约 / 初见之页 / 在一起之门 / 记忆小屋 / 相册星光），集齐才能翻开终章。
- **密码门**：输入"在一起"的日期（0107）才能继续翻书。
- **时光相册**：把照片放进 `assets/photos/01.jpg ~ 06.jpg` 自动展示；没照片时点星星也能集碎片。
- **记忆小屋**：三个小游戏——翻牌配对、接爱心、戳泡泡，通关任一即得碎片。
- **每日心签**：每天自动换一签（按日期取，不重样），也可以手动重抽。
- **祝福生成器**：访客写下名字，书会生成一句专属祝福。
- **每日书摘**：序章每日一句，隔天自动更换。
- **终极情书**：集齐碎片后长按爱心 2 秒解锁，可复制全文。
- **声音与震动**：提示音（Web Audio）、背景音乐（放入 `assets/music/music.mp3` 即启用）、手机震动反馈。
- **进度保存**：localStorage 自动保存解锁、页码、碎片，刷新可继续。

## 修改内容的位置

所有文案集中在 `src/data/loveData.ts`：

- 昵称、解锁关键词：`recipientNicknames` / `acceptedUnlockNames` / `sender`
- 纪念日（改这里，全站天数自动重算）：`dates.firstMeet` / `dates.start` / `dates.anniversary`
- 章节故事：`storyPages[].paragraphs`
- 每日一句：`dailyLines`
- 抽签签文：`lotterySigns`
- 终极情书：`finalLetter`
- 道具：`gadgets`

## 素材放置

| 用途 | 路径 | 说明 |
| --- | --- | --- |
| 照片 | `assets/photos/01.jpg ~ 06.jpg` | 相册页自动展示，无图显示星星占位 |
| 背景音乐 | `assets/music/music.mp3` | 右上角音符按钮播放，无文件则自动隐藏 |

## 部署

GitHub Pages：`npm run build` 后将 `dist/` 发布到 Pages（或直接推整个仓库，用 Actions 构建）。

## 技术说明

- 零依赖静态站点，`scripts/build.mjs` 生成 `dist/`（含 src 与 assets 的完整副本）。
- 移动端优先（375/390/414/430 适配），动画尊重 `prefers-reduced-motion`。
- 全部视觉元素由代码原创绘制（水豚、时光书、星星、爱心粒子），无第三方素材。
