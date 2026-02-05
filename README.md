# 体质测试 · 食疗养生

单页面应用：体质图片轮播、体质测试与体质专属农产品推荐。采用 **新中式** 视觉风格（莫兰迪/大地色、衬线标题、无衬线正文），纯 HTML/CSS/JS，通过 CDN 引入 Tailwind CSS 与 Chart.js，无需构建。

## 文件说明

- **index.html**：页面结构、Tailwind 配置、内联样式
- **data.js**：九种体质数据（完整体质画像、食疗推荐语、原则、推荐产品与食谱）、36 道测试题（含逆向计分）
- **app.js**：轮播、分步答题、计分、雷达图、产品推荐逻辑

## 本地运行

用浏览器直接打开 `index.html`，或使用本地服务器：

```bash
# 若已安装 Python
python -m http.server 8080

# 或 npx
npx serve .
```

然后访问 `http://localhost:8080`（或对应端口）。

## 功能概览

1. **顶部导航**：Logo、首页 / 体质测试 / 农产品商城 / 我的档案、登录 / 注册
2. **Hero 轮播**：3 张场景（平衡、困扰、丰收），5 秒自动切换，可点击圆点切换
3. **体质测试**：引导页 → 分步答题（每步 3 题，共 36 题）、进度条 → “计算中”动画 → 结果页（主体质、兼夹倾向、雷达图、体质画像与易患）；计分按《中医体质分类与判定》标准（转化分公式、平和质判定、兼夹体质 30–39 分）
4. **产品推荐**：根据测试结果展示该体质的食疗原则、宜食、商品卡片与推荐食谱
5. **页脚**：免责声明、社交媒体、帮助中心 / 关于我们

## 扩展建议

- **题库**：在 `data.js` 的 `QUESTIONS` 中按 `{ id, constitution, text, options, reverse }` 维护题目；`reverse: true` 表示逆向计分（1→5, 2→4, …）。题目数变化后，引导页的“共 X 道题”由 `app.js` 的 `TOTAL` 自动更新。
- **计分**：已按《中医体质分类与判定》实现：原始分 = 各条目分值之和（含逆向计分），转化分 = [(原始分−条目数)/(条目数×4)]×100；平和质判定为转化分≥60 且其他 8 种均<40；兼夹体质为转化分 30–39 的偏颇体质。
- **商品与食谱**：在 `CONSTITUTION_DATA` 各体质的 `products`、`recipe` 中修改或新增条目即可。
- **后端**：若需登录、保存记录、真实商城，可增加接口并在 `app.js` 中对接。

## 依赖（CDN）

- [Tailwind CSS](https://cdn.tailwindcss.com)（Play CDN）
- [Chart.js](https://cdn.jsdelivr.net/npm/chart.js@4.5.1/dist/chart.umd.min.js)（雷达图）
- [Google Fonts](https://fonts.googleapis.com)：Noto Serif SC、Noto Sans SC
