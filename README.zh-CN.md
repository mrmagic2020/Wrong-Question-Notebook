# Wrong Question Notebook

[English](README.md) | [简体中文](README.zh-CN.md)

Wrong Question Notebook（WQN）是一个 Web 应用，旨在帮助学生系统性地追踪、整理和复习自己做错的题目。它能够帮助学生在多个笔记本中管理题目、通过详细统计跟踪学习进度、在结构化的复习会话中提升复习效率。

**在线体验：** [wqn.magicworks.app](https://wqn.magicworks.app/)

## 功能特性

### 错题整理

- 创建带有自定义颜色和图标标识的笔记本来组织题目
- **支持三种题目类型**：选择题、简答题、问答题
- **富文本编辑器**（TipTap），支持 LaTeX 数学公式、表格、列表、图片等
- **更好的答案展示方法**：选择题提供选择按钮、简答题支持多个答案
- **自动判分**：对支持的题目类型进行自动答案验证
- **状态跟踪**：可将题目标记为“错误”、“需要复习”或“已掌握”
- **文件附件**：可上传图片 以及 PDF 作为题目或解析附件
- 支持排序、筛选，并带有分面搜索功能

### 标签系统

- 在笔记本中创建和管理标签
- 为题目添加多个标签，实现灵活分类
- 支持按标签筛选题目
- 支持跨所有笔记本的全局标签总览

### 错题题集&复习

- 创建手动题集或 **Smart Sets**（通过保存的筛选配置自动填充）
- **共享级别**：私有、受限共享（通过邮箱与指定用户共享）或公开
- **基于会话的复习**：开始、暂停和继续复习会话
- 每道题都可单独提交答案，并支持自动判分或自我评估
- **会话总结**：复习结束后的统计与结果拆分
- 作答后可查看题目解析

### 统计仪表板

- 类似 GitHub 的 **活跃度热力图**
- **状态环形图**：错误 / 需要复习 / 已掌握 的分布
- **进度折线图**：随时间变化的累计掌握情况
- **科目柱状图与雷达图**：按笔记本进行对比
- 重点统计卡片（连续学习天数、总数、会话统计）
- 最近活动动态流

### 使用AI提取题目

- 使用 **Google Gemini 2.5 Flash** 从图片中提取题目
- 具有每日使用配额，并支持管理员为用户单独调整额度
- 支持自动识别题目类型、选项和正确答案

### 用户资料

- 可自定义个人资料（头像、用户名、简介、人口统计信息）

### 身份验证与安全

- 基于邮箱的注册与登录，集成 **Cloudflare Turnstile** CAPTCHA
- 带邮箱确认的密码重置流程
- 安全响应头（HSTS、CSP、X-Frame-Options、X-Content-Type-Options、Referrer-Policy、Permissions-Policy）
- HTML 内容清洗（DOMPurify + sanitize-html），并支持数学内容
- 对敏感接口进行速率限制
- 使用 Zod schema 进行请求校验

### 隐私

- **符合 GDPR 标准的 Cookie 隐私偏好设置**，支持精细的偏好设置
- 隐私政策页

## 技术栈

| 层级 | 技术 |
| ---- | ---- |
| 框架 | Next.js 16（App Router、Turbopack） |
| 语言 | TypeScript（严格模式） |
| 样式 | Tailwind CSS 3、tailwindcss-animate |
| 组件 | shadcn/ui（Radix UI + CVA） |
| 富文本 | TipTap（数学、表格、图片、链接、排版） |
| 数学渲染 | KaTeX |
| 认证与数据库 | Supabase（PostgreSQL、Auth、Storage） |
| AI | Google Gemini 2.5 Flash（@google/genai） |
| CAPTCHA | Cloudflare Turnstile |
| 图表 | Chart.js + react-chartjs-2 |
| 数据表格 | TanStack Table |
| 校验 | Zod |
| 主题 | next-themes（class 策略） |
| 分析 | Vercel Analytics + Speed Insights |
| 部署 | Vercel |
| 测试 | Vitest + @vitest/coverage-v8 |
| 代码质量 | ESLint、Prettier |

## 快速开始

### 环境要求

- Node.js 18+
- 一个 [Supabase](https://supabase.com) 项目
- （可选）用于 AI 题目提取的 [Gemini API key](https://aistudio.google.com/)
- （可选）[Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/) site key

### 安装

```bash
git clone https://github.com/mrmagic2020/Wrong-Question-Notebook.git
cd Wrong-Question-Notebook/web
npm install
```

### 环境变量

复制示例文件并填写你的配置：

```bash
cp env.example .env.local
```

| 变量 | 说明 | 必需 |
| ---- | ---- | ---- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | 是 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` | Supabase anon / public key | 是 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key（服务端使用） | 是 |
| `SITE_URL` | 已部署站点的 URL（用于 sitemap） | 否 |
| `GEMINI_API_KEY` | Google Gemini API key（用于 AI 提取） | 否 |

### 开发

```bash
npm run dev
```

### 常用命令

请在 `web/` 目录下运行：

| 命令 | 用途 |
| ---- | ---- |
| `npm run dev` | 启动开发服务器（Turbopack） |
| `npm run build` | 生产环境构建 |
| `npm run type-check` | TypeScript 检查（`tsc --noEmit`） |
| `npm run lint` | ESLint 检查 |
| `npm run test` | 运行测试（Vitest） |
| `npm run test:watch` | 以监听模式运行测试 |
| `npm run fix-all` | 自动修复 lint 问题并格式化代码 |
| `npm run prepush` | 完整检查：fix-all、type-check、lint、format-check、test、build |

提交前请始终运行 `npm run prepush`。

## 项目结构

```t
web/
  app/
    (app)/            # 需要登录的页面（笔记本、题目、题集、统计、管理后台）
    auth/             # 认证页面（登录、注册、忘记密码等）
    api/              # API 路由处理器
    privacy/          # 隐私政策页面
    page.tsx          # 公开主页
    layout.tsx        # 根布局
    globals.css       # 全局样式、CSS 工具类、动画
  components/
    ui/               # shadcn/ui 基础组件
    landing/          # 落地页组件
    subjects/         # 笔记本卡片与对话框
    review/           # 复习会话组件
    statistics/       # 仪表板图表与卡片
    admin/            # 管理面板组件
    cookie-consent/   # GDPR 同意横幅与 Provider
    ...               # 其他功能组件
  lib/                # 工具函数、Supabase 客户端、schema、类型、常量
  public/             # 静态资源（robots.txt、sitemap.xml）
  middleware.ts       # Supabase 会话刷新
```

## 部署

详细的 Vercel 部署指南请参见 [DEPLOYMENT.md](DEPLOYMENT.md)。

## 文档

- [CHANGELOG.md](CHANGELOG.md) —— 版本历史
- [DEPLOYMENT.md](DEPLOYMENT.md) —— 部署指南
- [Proposal.md](Proposal.md) —— 初始项目提案

## 贡献

本项目使用 ESLint、Prettier 和 TypeScript 来保证代码质量。请在推送代码前运行以下命令：

```bash
npm run prepush
```

## 许可证

本项目基于 GPL-3.0 许可证发布。详情请参见 [LICENSE](LICENSE)。
