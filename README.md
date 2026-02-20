# 单词图忆 (WordPicMemo)

> AI-Powered Vocabulary Memorization App — 输入单词，AI 生成详细解释与记忆图片，基于艾宾浩斯遗忘曲线智能复习

## 功能特性

- **AI 单词解释** — 输入单词后自动生成：词根拆解、谐音记忆、核心释义、例句、记忆场景描述
- **AI 图片生成** — 根据记忆场景自动生成辅助记忆图片
- **间隔复习系统** — 基于艾宾浩斯遗忘曲线的 8 阶段复习提醒（5min → 30min → 12h → 1d → 2d → 4d → 7d → 15d）
- **多 AI 适配** — 支持 OpenAI / Claude / 智谱AI / 豆包 / 自定义 OpenAI 兼容端点
- **跨平台移动端** — React Native 构建，支持 Android & iOS

## 技术栈

| 层级 | 技术 |
|------|------|
| **移动端** | React Native 0.76 · TypeScript · Zustand · React Navigation 7 · React Native Paper |
| **后端** | NestJS 10 · TypeORM · PostgreSQL 16 · Redis 7 · Bull Queue |
| **AI 适配** | OpenAI SDK · Anthropic SDK · 智谱/豆包 HTTP · 策略+工厂模式 |
| **认证** | JWT 双令牌（Access 15m + Refresh 7d）· bcrypt · Passport |
| **工程化** | pnpm Workspace Monorepo · ESLint · Prettier · Swagger API 文档 |

## 项目结构

```
WordPicMemo/
├── packages/
│   ├── shared/              # @wordpicmemo/shared — 共享类型、常量、工具
│   │   └── src/
│   │       ├── types/       # User, Word, Review, AIConfig 类型定义
│   │       ├── constants/   # 艾宾浩斯复习间隔、AI 提供商配置
│   │       └── utils/       # 复习计算工具
│   │
│   ├── backend/             # @wordpicmemo/backend — NestJS API 服务
│   │   └── src/
│   │       ├── config/      # 数据库、JWT、存储配置
│   │       ├── common/      # 守卫、拦截器、管道
│   │       └── modules/
│   │           ├── auth/    # 认证（注册/登录/JWT刷新）
│   │           ├── users/   # 用户管理
│   │           ├── words/   # 单词 CRUD + AI 生成调度
│   │           ├── review/  # 复习计划 + Cron 定时任务
│   │           ├── ai/      # AI 适配器（策略+工厂模式）
│   │           ├── storage/ # 云存储（S3 兼容）
│   │           └── notifications/ # 推送通知
│   │
│   └── mobile/              # @wordpicmemo/mobile — React Native 移动端
│       └── src/
│           ├── navigation/  # 栈导航 + 底部标签导航
│           ├── screens/     # auth / home / word / review / settings
│           ├── store/       # Zustand 状态管理
│           ├── services/    # API 客户端 + Axios 拦截器
│           └── theme/       # 主题色彩、字体、间距
│
├── docker-compose.yml       # PostgreSQL + Redis 本地开发环境
├── pnpm-workspace.yaml      # pnpm monorepo 配置
└── tsconfig.base.json       # TypeScript 基础配置
```

## 快速开始

### 环境要求

- **Node.js** >= 20.x
- **pnpm** >= 9.x
- **Docker Desktop**（用于 PostgreSQL + Redis）
- **Android Studio**（Android 开发）
- **JDK 17**（Android 构建）

### 1. 克隆 & 安装依赖

```bash
git clone <repo-url> WordPicMemo
cd WordPicMemo
pnpm install
```

### 2. 启动基础服务（PostgreSQL + Redis）

```bash
docker compose up -d
```

等待服务健康检查通过：
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

### 3. 配置后端环境变量

```bash
cp packages/backend/.env.example packages/backend/.env
```

编辑 `.env` 文件，填入你的 JWT Secret 和 AI 加密密钥：

```env
# 必填
JWT_ACCESS_SECRET=your-access-secret-change-me
JWT_REFRESH_SECRET=your-refresh-secret-change-me
AI_KEY_ENCRYPTION_SECRET=your-32-char-encryption-secret!!

# 可选 — 云存储（S3 兼容）
STORAGE_ENDPOINT=
STORAGE_BUCKET=wordpicmemo
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
```

### 4. 构建共享包 & 启动后端

```bash
# 构建共享类型包
pnpm build:shared

# 启动后端（开发模式，自动热重载）
pnpm dev:backend
```

后端启动后可访问：
- API: `http://localhost:3000/api/v1`
- Swagger 文档: `http://localhost:3000/api/docs`

### 5. 启动移动端

```bash
# 确保 Android 模拟器已启动或真机已连接
adb devices

# 构建并安装 Android APK
cd packages/mobile/android
chmod +x gradlew
./gradlew app:installDebug

# 回到 mobile 目录启动 Metro bundler
cd ..
pnpm start
```

> **Windows 用户注意**：需要设置环境变量
> ```bash
> export JAVA_HOME="/c/Program Files/Eclipse Adoptium/jdk-17.x.x-hotspot"
> export ANDROID_HOME="/c/Users/<你的用户名>/AppData/Local/Android/Sdk"
> ```

### 6. ADB 端口转发（模拟器）

```bash
adb reverse tcp:3000 tcp:3000   # 后端 API
adb reverse tcp:8081 tcp:8081   # Metro bundler
```

## API 概览

| 模块 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 认证 | POST | `/api/v1/auth/register` | 用户注册 |
| | POST | `/api/v1/auth/login` | 登录（返回 JWT 双令牌） |
| | POST | `/api/v1/auth/refresh` | 刷新 Access Token |
| 单词 | POST | `/api/v1/words` | 创建单词 → 异步触发 AI 生成 |
| | GET | `/api/v1/words` | 分页查询单词列表 |
| | GET | `/api/v1/words/:id` | 获取单词详情 + 解释 |
| 复习 | GET | `/api/v1/reviews/due` | 获取到期复习列表 |
| | GET | `/api/v1/reviews/today` | 今日复习概览 |
| | POST | `/api/v1/reviews/:id/complete` | 完成复习 |
| AI 配置 | POST | `/api/v1/ai-configs` | 创建 AI 配置 |
| | PATCH | `/api/v1/ai-configs/:id` | 更新配置 |
| | POST | `/api/v1/ai-configs/:id/test` | 测试 AI 连通性 |

## 艾宾浩斯复习阶段

| 阶段 | 间隔 | 说明 |
|------|------|------|
| 1 | 5 分钟 | 即时巩固 |
| 2 | 30 分钟 | 短期强化 |
| 3 | 12 小时 | 半日回顾 |
| 4 | 1 天 | 次日复习 |
| 5 | 2 天 | 间隔拉长 |
| 6 | 4 天 | 中期巩固 |
| 7 | 7 天 | 一周回顾 |
| 8 | 15 天 | 长期记忆 |

## AI 提供商支持

| 提供商 | 文字生成 | 图片生成 | 默认模型 |
|--------|---------|---------|---------|
| OpenAI | ✅ | ✅ (DALL-E 3) | gpt-4o-mini |
| Claude (Anthropic) | ✅ | ❌ | claude-sonnet-4 |
| 智谱AI | ✅ | ✅ (CogView) | glm-4-flash |
| 豆包 (字节) | ✅ | ❌ | doubao-pro-32k |
| Custom | ✅ | ✅ | 自定义 |

> **Custom** 模式兼容任何 OpenAI 格式的 API 端点，可在 App 设置页面配置 URL。

## 开发命令

```bash
# 启动后端开发服务
pnpm dev:backend

# 启动移动端 Metro bundler
pnpm dev:mobile

# 构建共享包
pnpm build:shared

# 代码检查 & 格式化
pnpm lint
pnpm format

# TypeORM 数据库迁移
cd packages/backend
pnpm migration:generate src/database/migrations/InitialMigration
pnpm migration:run
```

## License

MIT
