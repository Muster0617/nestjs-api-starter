# NestJS API Starter

一套可直接落地业务的生产级 NestJS 后端脚手架。开箱即用地提供 **JWT 双令牌认证**、**邮箱验证码**、**Redis 限流**、**统一响应结构**、**基于 Zod 的入参校验与 Swagger 文档**、**结构化日志**、**邮件异步队列** 与 **一键打包部署**。

- 校验与文档同源：DTO 只写一份 Zod Schema，既用于请求校验，也自动生成 OpenAPI 文档与响应序列化
- 认证不留白：令牌哈希落 Redis、会话单点有效、刷新即轮换、登出即吊销
- 基础设施齐备：PostgreSQL + Redis + BullMQ + PM2 + Docker Compose + 发布包脚本

---

## 目录

- [技术栈](#技术栈)
- [功能特性](#功能特性)
- [目录结构](#目录结构)
- [快速开始](#快速开始)
- [环境变量](#环境变量)
- [可用脚本](#可用脚本)
- [API 一览](#api-一览)
- [响应结构](#响应结构)
- [认证机制](#认证机制)
- [验证码与邮件队列](#验证码与邮件队列)
- [限流](#限流)
- [日志](#日志)
- [数据库](#数据库)
- [开发约定](#开发约定)
- [构建与部署](#构建与部署)

---

## 技术栈

| 分类 | 选型 |
| --- | --- |
| 运行时 | Node.js >= 22.12.0（推荐 22 LTS / 24） |
| 框架 | NestJS 12（Express 适配器，SWC 编译） |
| 语言 | TypeScript 6，`strict` 模式 |
| ORM | Prisma 7 + `@prisma/adapter-pg`（原生 pg 连接池） |
| 数据库 | PostgreSQL 16 |
| 缓存 / 会话 | Redis 7（ioredis） |
| 队列 | BullMQ 6（邮件异步投递） |
| 校验 | Zod 4（Standard Schema 协议） |
| 文档 | Swagger / OpenAPI 3.0（Zod → JSON Schema） |
| 日志 | pino + nestjs-pino（生产按日切分落盘） |
| 鉴权 | Passport JWT（访问令牌 / 刷新令牌双策略）+ Argon2 口令哈希 |
| 进程管理 | PM2（cluster 模式） |

---

## 功能特性

- **认证与授权**：邮箱密码登录、邮箱验证码注册、凭验证码重置密码、双令牌刷新、登出吊销；基于角色的接口保护（`ADMIN` / `MEMBER`）
- **令牌安全**：JWT 仅作为凭据载体，服务端在 Redis 保存令牌哈希与会话 `jti`，支持单会话、轮换与全量吊销；核心操作由 Lua 脚本保证原子性
- **邮箱验证码**：6 位数字、10 分钟有效、60 秒重发冷却、错 5 次作废、单邮箱每日 10 次配额；验证码仅存哈希
- **邮件异步化**：BullMQ 队列 + 指数退避重试，发信流水落库（`email_history`），模板占位符自动 HTML 转义
- **统一响应**：成功与失败共用一套信封结构，生产环境只返回安全信息，开发环境附带调试细节
- **参数校验**：全局 `StandardSchemaValidationPipe` + Zod `strictObject`，多余字段直接拒绝
- **分布式限流**：Redis 存储 + Lua 脚本，支持封禁窗口，可按路由覆盖阈值
- **结构化日志**：请求关联 ID、链路 ID、用户 ID 自动注入，敏感字段自动脱敏，生产环境按日滚动且最多保留 7 个日志文件
- **健康检查**：`/api/health` 同时探测 PostgreSQL 与 Redis
- **工程化**：ESLint + Prettier（导入排序、未使用导入清理）、TypeScript 类型检查、`pack.mjs` 一键生成生产发布包

---

## 目录结构

```
.
├── prisma/
│   ├── schema/
│   │   ├── main.prisma        # generator 与 datasource
│   │   ├── user.prisma        # User 模型、UserRole 枚举
│   │   └── email.prisma       # EmailHistory 模型、EmailType / EmailStatus 枚举
│   └── seed.js                # 种子数据：创建管理员账号（幂等）
├── src/
│   ├── app/
│   │   ├── app.module.ts      # 根模块
│   │   ├── controllers/       # 健康检查
│   │   └── dtos/              # 健康检查响应 Schema
│   ├── common/
│   │   ├── bullmq/            # BullMQ 全局 Redis 连接
│   │   ├── cache/             # Redis 客户端与缓存服务
│   │   ├── config/            # 分域配置：app / auth / database / doc / email / redis
│   │   ├── database/          # Prisma Client（PrismaPg 适配器 + pg Pool）
│   │   ├── doc/               # Zod → Swagger 响应文档装饰器
│   │   ├── email/             # 邮件服务、队列、消费者、发信流水、HTML 模板
│   │   ├── logger/            # pino 日志配置与脱敏规则
│   │   ├── request/           # 全局守卫、限流 Redis 存储、请求装饰器
│   │   └── response/          # 响应拦截器、异常过滤器、序列化服务
│   ├── modules/
│   │   ├── auth/              # 登录 / 注册 / 验证码 / 令牌 / 策略
│   │   └── user/              # 个人资料与管理员用户管理
│   ├── main.ts                # 启动入口
│   └── swagger.ts             # Swagger 装配
├── docker-compose.yml         # PostgreSQL 16 + Redis 7
├── ecosystem.config.cjs       # PM2 生产配置
├── pack.mjs                   # 生成 release/ 发布包
├── prisma.config.js           # Prisma CLI 配置（多 schema 目录 + seed 命令）
├── .env.example               # 环境变量样板
└── .swcrc / tsconfig.json / eslint.config.mjs / .prettierrc / .knip.jsonc
```

---

## 快速开始

### 0. 环境要求

- Node.js `>= 22.12.0`
- npm `>= 10`
- Docker（用于本地拉起 PostgreSQL 与 Redis）

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

生成两个 JWT 密钥并填入 `.env`：

```bash
openssl rand -base64 32   # AUTH_ACCESS_TOKEN_SECRET
openssl rand -base64 32   # AUTH_REFRESH_TOKEN_SECRET
```

> `DATABASE_URL`、`REDIS_URL` 与两个 JWT 密钥均为**必填项**，缺失时应用会在启动阶段直接抛错退出（`环境变量 xxx 未配置` / `缺少环境变量 DATABASE_URL...`）。

### 3. 启动依赖服务

```bash
npm run docker     # docker compose up -d
```

默认会拉起：

| 服务 | 端口 | 账号 |
| --- | --- | --- |
| PostgreSQL 16 | `127.0.0.1:5432` | `postgres` / `master123` |
| Redis 7 | `127.0.0.1:6379` | 密码 `master123` |

查看状态：`docker compose ps`

### 4. 初始化数据库

```bash
npm run db:push    # 生成 Prisma Client 并同步表结构
npm run db:seed    # 可选：创建管理员账号
```

`db:seed` 会读取 `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_USERNAME`，账号已存在时自动跳过。

### 5. 启动应用

```bash
npm run dev
```

| 地址 | 说明 |
| --- | --- |
| http://localhost:3001/api | 业务接口根路径 |
| http://localhost:3001/docs | Swagger 文档（仅非生产环境） |
| http://localhost:3001/api/health | 健康检查 |

---

## 环境变量

| 变量 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `NODE_ENV` | 否 | `production` | 值为 `production` 时启用 JSON 日志、文件落盘、关闭 Swagger；`.env.example` 默认给的是 `development` |
| `HTTP_HOST` | 否 | `localhost` | 监听地址（`.env.example` 示例值为 `0.0.0.0`，容器/局域网部署用后者） |
| `HTTP_PORT` | 否 | `3000` | 监听端口（`.env.example` 示例值为 `3001`） |
| `AUTH_ACCESS_TOKEN_SECRET` | **是** | — | 访问令牌签名密钥 |
| `AUTH_REFRESH_TOKEN_SECRET` | **是** | — | 刷新令牌签名密钥 |
| `AUTH_ACCESS_TOKEN_EXP` | 否 | `15m` | 访问令牌有效期，支持 `s/m/h/d/w` |
| `AUTH_REFRESH_TOKEN_EXP` | 否 | `7d` | 刷新令牌有效期，支持 `s/m/h/d/w` |
| `DATABASE_URL` | **是** | — | PostgreSQL 连接串，`?schema=` 会被取出传给 PrismaPg（缺省 `public`） |
| `REDIS_URL` | **是** | — | Redis 连接串，形如 `redis://:password@host:6379/0` |
| `SEED_ADMIN_EMAIL` | 种子时必填 | — | 管理员邮箱 |
| `SEED_ADMIN_PASSWORD` | 种子时必填 | — | 管理员初始密码 |
| `SEED_ADMIN_USERNAME` | 种子时必填 | — | 管理员用户名 |
| `EMAIL_HOST` | 否 | 空 | SMTP 主机；未配置时应用仍可启动，但发信返回 503 |
| `EMAIL_PORT` | 否 | `587` | SMTP 端口，`465` 时自动启用 TLS |
| `EMAIL_USER` | 否 | 空 | SMTP 账号（Gmail 需使用应用专用密码） |
| `EMAIL_PASS` | 否 | 空 | SMTP 密码 |
| `EMAIL_FROM` | 否 | 回退到 `EMAIL_USER` | 发件人 |
| `EMAIL_TEMPLATE_DIR` | 否 | `dist/common/email/templates` | 邮件模板目录（代码中未列入 `.env.example`） |

> 生产环境请通过密钥管理注入，不要提交真实 `.env`。`.gitignore` 已忽略除 `.env.example` 外的所有 `.env*`。

---

## 可用脚本

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 开发模式启动（SWC 编译 + 热重载） |
| `npm run debug` | 调试模式启动，暴露 Node inspector |
| `npm run build` | 类型检查 + `nest build` 输出到 `dist/` |
| `npm run start` | 运行已构建产物 `dist/main` |
| `npm run typecheck` | 仅执行 `tsc --noEmit` |
| `npm run lint` | ESLint 检查 `src/**/*.ts` |
| `npm run lint:fix` | ESLint 自动修复 |
| `npm run format` | Prettier 格式化 |
| `npm run knip` | 扫描未使用的文件、依赖与导出 |
| `npm run docker` | 启动 PostgreSQL 与 Redis 容器 |
| `npm run db:push` | `prisma generate` + `prisma db push`（同步表结构） |
| `npm run db:seed` | 执行 `prisma/seed.js` |
| `npm run pack` | 构建并生成 `release/` 发布包 |
| `npm run pm2:start` | 以 cluster 模式启动 PM2 进程 |
| `npm run pm2:reload` / `pm2:stop` / `pm2:delete` / `pm2:logs` | PM2 运维命令 |
| `npm run update:packages` | 交互式升级依赖版本 |

> `db:push` 与 `db:seed` 通过 `dotenv run --` 加载 `.env`。直接执行 `npx prisma ...` 时不会自动读取 `.env`，需先 `export $(cat .env | xargs)` 或改用 `npm run` 脚本。

---

## API 一览

全局前缀为 `/api`。完整定义见 Swagger：`http://localhost:3001/docs`（非生产环境）。

| 方法 | 路径 | 权限 | 限流 | 说明 |
| --- | --- | --- | --- | --- |
| `POST` | `/api/auth/login` | 公开 | 5 次 / 分钟 | 邮箱密码登录，返回双令牌 + 用户信息 |
| `POST` | `/api/auth/send-code` | 公开 | 1 次 / 分钟 | 下发邮箱验证码（`SIGNUP` / `PASSWORD_RESET`） |
| `POST` | `/api/auth/signup` | 公开 | 5 次 / 分钟 | 凭验证码注册，成功返回 201 |
| `POST` | `/api/auth/reset-password` | 公开 | 5 次 / 分钟 | 凭验证码重置密码，成功即吊销该用户全部令牌 |
| `POST` | `/api/auth/refresh-token` | 刷新令牌 | 5 次 / 分钟 | 用刷新令牌换取新的双令牌（轮换旧会话） |
| `POST` | `/api/auth/logout` | 登录用户 | 全局 100 次 / 分钟 | 吊销该用户全部令牌 |
| `GET` | `/api/health` | 公开 | 全局 100 次 / 分钟 | 探测 PostgreSQL 与 Redis |
| `GET` | `/api/user/profile` | 登录用户 | 全局 100 次 / 分钟 | 获取当前用户资料 |
| `GET` | `/api/user/list` | `ADMIN` | 全局 100 次 / 分钟 | 分页搜索用户（`page` / `limit` / `keyword` / `role`） |
| `PUT` | `/api/user/:id` | `ADMIN` | 全局 100 次 / 分钟 | 更新用户（`userName` / `avatar`），`id` 为 UUID v4 |
| `DELETE` | `/api/user/:id` | `ADMIN` | 全局 100 次 / 分钟 | 删除用户并吊销其令牌 |

认证方式：

```http
Authorization: Bearer <accessToken>    # 普通受保护接口
Authorization: Bearer <refreshToken>   # 仅 /api/auth/refresh-token
```

`POST /api/auth/send-code` 请求体示例：

```json
{ "email": "user@example.com", "scene": "SIGNUP" }
```

`POST /api/auth/signup` 请求体示例（密码需至少 8 位，含大小写字母、数字与 `@$!%*?&` 之一）：

```json
{
  "email": "user@example.com",
  "password": "Password@123",
  "code": "123456"
}
```

---

## 响应结构

成功响应由 `ResponseInterceptor` 统一包裹，`data` 在无返回值时省略（例如登出）：

```json
{
  "statusCode": 200,
  "message": "请求成功",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "data": { }
}
```

分页接口的 `data` 形如：

```json
{
  "statusCode": 200,
  "message": "用户列表获取成功",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "data": {
    "items": [],
    "metadata": {
      "currentPage": 1,
      "itemsPerPage": 10,
      "totalItems": 0,
      "totalPages": 0
    }
  }
}
```

错误响应由 `ResponseExceptionFilter` 统一处理：

```json
{
  "statusCode": 401,
  "message": "邮箱或密码错误",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "error": "…"
}
```

- `error` 字段**仅在非生产环境**出现：校验失败时为字段错误数组，Prisma 错误时为 `{ "code": "P2002" }`，其它异常时为堆栈
- Prisma 已知错误码（`P2002` 唯一约束、`P2025` 记录不存在、`P1001` 连接失败等）会被映射为对应的 HTTP 状态码与中文提示
- 响应体会按 `@DocEndpoint({ serialization })` 声明的 Schema 校验，不符时抛出 `Serialization failed at ...`，便于在上线前发现契约漂移

---

## 认证机制

- **口令哈希**：Argon2（`argon2.hash` / `argon2.verify`），数据库不存明文
- **双令牌**：访问令牌默认 15 分钟，刷新令牌默认 7 天，分别使用独立密钥签发；JWT 载荷含 `userId`、`role`、`jti`
- **服务端会话**：登录/注册/刷新时写入
  - `auth:access:{sha256}`、`auth:refresh:{sha256}` → 令牌记录（`userId`、`role`）
  - `auth:user:{userId}` → 该用户全部令牌哈希集合
  - `auth:session:{userId}` → 当前有效的 `jti`
- **单会话模型**：每次签发新令牌都会先清空该用户的历史会话，因此**同一账号在新设备登录会使旧设备下线**
- **校验链路**：JWT 签名有效 → Redis 中存在该令牌哈希 → `jti` 与当前会话一致，任一不满足即 401
- **吊销**：登出、重置密码、管理员删除用户时清理该用户全部令牌；Lua 脚本保证清空与写入的原子性

> 令牌有效期只接受 `<数字><s|m|h|d|w>` 格式，格式非法会在启动时报错。

---

## 验证码与邮件队列

| 参数 | 值 | 位置 |
| --- | --- | --- |
| 验证码长度 | 6 位数字 | `src/common/email/constants/email.constant.ts` |
| 有效期 | 600 秒 | `src/common/config/email.config.ts` |
| 重发冷却 | 60 秒 | 同上 |
| 最大尝试次数 | 5 次 | 同上 |
| 单邮箱每日配额 | 10 次 | 同上 |
| 队列重试 | 3 次，指数退避 2 秒起 | 同上 |

流程要点：

1. 下发验证码时把验证码 **SHA-256 哈希**写入 Redis（`verification:{scene}:{email}`），明文只出现在邮件正文中
2. 不同场景（注册 / 重置密码）的验证码互不通用
3. 校验通过即删除；错误累加尝试次数，超过 5 次直接作废
4. 重置密码时若邮箱未注册，接口返回与正常流程一致的计时信息（不泄露账号是否存在）
5. 邮件通过 BullMQ 队列异步投递，`email_history` 表记录 `PENDING → RETRYING → SENT/FAILED` 全生命周期与失败原因
6. 邮件模板为 `src/common/email/templates/email-code.html`，构建时作为资源复制到 `dist/`；模板变量会被 HTML 转义

---

## 限流

- 全局默认：**100 次 / 60 秒**，按客户端 IP 计数（`src/common/config/app.config.ts`）
- 存储：Redis + Lua 脚本（`src/common/request/services/throttler-redis.storage.ts`），多实例部署下计数一致
- 命中上限后进入封禁窗口，超限返回 `429` 与提示「请求过于频繁，请稍后再试」
- 单路由覆盖示例：`@Throttle({ default: { ttl: 60000, limit: 5 } })`（见 `auth.public.controller.ts`）

---

## 日志

基于 pino，随 `NODE_ENV` 切换行为：

| 环境 | 输出 | 格式 | 落盘 |
| --- | --- | --- | --- |
| 开发 | 控制台 | `pino-pretty` 彩色单行 | 否 |
| 生产 | 标准输出 + 文件 | JSON | `logs/app.{yyyy-MM-dd}.{序号}.log`，保留最近 7 个 |

每条请求日志会自动附加：

- `correlationId`：`x-request-id` / `x-correlation-id` 或自动生成的 UUID
- `traceId`：`x-trace-id` / B3 / W3C `traceparent`
- `userId`：认证用户 ID
- `body`：经过统一信封包装后的响应体

`authorization`、`cookie`、`password`、`token` 等敏感字段已在 `redact` 规则中移除；Nest 启动期的冗余日志在生产环境被过滤。

---

## 数据库

Prisma 采用多文件 Schema（`prisma/schema/*.prisma`），CLI 配置见 `prisma.config.js`。

**User**（表 `users`）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `String` | UUID 主键 |
| `userName` | `String` | 用户名，全局唯一 |
| `email` | `String` | 登录邮箱，全局唯一 |
| `passwordHash` | `String` | Argon2 哈希 |
| `role` | `UserRole` | `ADMIN` / `MEMBER`，默认 `MEMBER` |
| `avatar` | `String?` | 头像地址 |
| `createdAt` / `updatedAt` | `DateTime` | 创建 / 更新时间 |

**EmailHistory**（表 `email_history`）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `String` | UUID 主键 |
| `userId` | `String?` | 关联用户，未注册邮箱的重置流程可为空 |
| `emailTo` | `String` | 收件人 |
| `type` | `EmailType` | `SIGNUP` / `PASSWORD_RESET` |
| `subject` | `String` | 邮件主题 |
| `status` | `EmailStatus` | `PENDING` / `RETRYING` / `SENT` / `FAILED` |
| `messageId` | `String?` | SMTP 返回的 messageId |
| `retryCount` | `Int` | 已尝试次数 |
| `errorMessage` | `String?` | 最近一次失败原因（截断 500 字符） |
| `createdAt` / `sentAt` | `DateTime` | 创建 / 成功时间 |

索引：`userId`、`emailTo`、`status`、`createdAt`。

常用命令：

```bash
npm run db:push            # 同步表结构（无迁移文件）
npx dotenv run -- prisma studio   # 图形化查看数据
npm run db:seed            # 创建管理员
```

> 本项目使用 `prisma db push` 而非迁移文件管理结构；如需版本化迁移，可在 `prisma.config.js` 已声明的 `prisma/migrations` 路径下改用 `prisma migrate dev`。

---

## 开发约定

新增一个业务模块时，按现有模式组织：

1. **DTO 用 Zod**：`z.strictObject({...})`，字段通过 `.meta({ description, examples })` 补充文档信息；类型用 `z.infer<>` 导出
2. **控制器装饰器**：
   - `@DocEndpoint({ summary, message, serialization, paginated?, httpStatus? })` —— 一次声明接口摘要、成功提示、响应校验 Schema 与 Swagger 响应体
   - `@PublicRoute()` —— 跳过 JWT 守卫
   - `@AllowRoles([UserRole.ADMIN])` —— 角色限制（需同时通过 JWT 守卫）
   - 入参绑定：`@Body({ schema: XxxSchema })`、`@Query({ schema: XxxSchema })`
3. **全局守卫**：JWT 访问守卫、角色守卫、限流守卫已在 `RequestModule` 注册为 `APP_GUARD`，默认全站受保护，公开接口需显式标注
4. **数据库访问**：注入 `DatabaseService`（继承 `PrismaClient`），不要重复建连
5. **Redis 访问**：注入 `CacheService`；需要原子操作时通过 `getClient()` 执行 Lua
6. **导入别名**：统一使用 `src/...` 绝对路径，ESLint 会强制分组排序与首行空行
7. **代码风格**：4 空格缩进、单引号、语句带分号、行宽 80，统一由 Prettier 处理（`npm run format`）

---

## 构建与部署

### 打包

```bash
npm run pack
```

脚本会依次执行 `build` → `prisma generate` → 收集产物到 `release/`，并将 `package.json` 裁剪为仅保留生产依赖与运维脚本。`release/` 内容：

```
release/
├── dist/                  # 编译产物（含邮件 HTML 模板）
├── prisma/                # Schema 与 seed
├── package.json           # 已移除 devDependencies
├── package-lock.json
├── prisma.config.js
├── ecosystem.config.cjs
└── .env.example
```

### 部署

```bash
# 1. 上传 release/ 到服务器
# 2. 安装生产依赖
npm ci --omit=dev
# 3. 生成 Prisma Client
npx prisma generate
# 4. 同步数据库结构
npm run db:push
# 5. 可选：初始化管理员
npm run db:seed
# 6. 以 PM2 cluster 模式启动
npm run pm2:start
```

PM2 配置（`ecosystem.config.cjs`）：应用名 `nestjs-api-starter`、`cluster` 模式、实例数取 CPU 核数、内存超过 512M 自动重启、`NODE_ENV=production`。

> 生产环境需自行准备 PostgreSQL 与 Redis（或复用 `docker-compose.yml`），并正确设置 `DATABASE_URL`、`REDIS_URL` 与两个 JWT 密钥。生产模式下 Swagger 不会挂载。
