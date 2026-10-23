# NestJS API Starter

一套可直接落地业务的生产级 NestJS 后端脚手架。开箱即用地提供 **JWT 双令牌认证**、**邮箱验证码**、**Redis 限流与分布式锁**、**统一响应结构**、**基于 Zod 的入参校验与 Swagger 文档**、**结构化日志**、**邮件异步队列** 与 **一键打包部署**。

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
- [Redis 客户端](#redis-客户端)
- [限流](#限流)
- [分布式锁](#分布式锁)
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
| 缓存 / 会话 | Redis 7（`@nestjs-redisx/core` + `cache` + `rate-limit` + `locks`，业务 / 缓存 / 队列分库） |
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
- **分布式限流**：`@nestjs-redisx/rate-limit` 插件，Redis 滑动窗口 + Lua 脚本，可按路由覆盖阈值
- **缓存**：`@nestjs-redisx/cache`，`@Cached` / `@InvalidateTags` 声明式缓存与标签失效
- **分布式锁**：`@nestjs-redisx/locks`，注入 `LOCK_SERVICE` 或使用 `@WithLock` 装饰器，`SET NX PX` 加锁、Lua 校验持有者后释放、自动续期与退避重试
- **Redis 分库**：三个命名客户端共用一个 `REDIS_URL`（不带 db 序号），库号由代码固定分配，业务 / 缓存 / 队列键空间互不干扰
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
│   │   ├── bullmq/            # BullMQ 全局连接（队列库）
│   │   ├── cache/             # redisx 装配：三客户端 + 缓存 / 限流 / 分布式锁插件
│   │   ├── config/            # 分域配置：app / auth / database / doc / email / lock / redis
│   │   ├── database/          # Prisma Client（PrismaPg 适配器 + pg Pool）
│   │   ├── doc/               # Zod → Swagger 响应文档装饰器
│   │   ├── email/             # 邮件服务、队列、消费者、发信流水、HTML 模板
│   │   ├── logger/            # pino 日志配置与脱敏规则
│   │   ├── request/           # 全局守卫、请求装饰器、常量
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

> 两个 JWT 密钥为**必填项**，缺失时启动即抛 `环境变量 xxx 未配置`。
> `DATABASE_URL` 与 `REDIS_URL` 不做启动期校验：缺失或不合法时应用仍能启动，报错发生在首次建连。

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

`db:seed` 读取 `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_USERNAME`，账号已存在时自动跳过。

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
| `NODE_ENV` | 否 | `production` | 为 `production` 时启用 JSON 日志、文件落盘、关闭 Swagger；`.env.example` 默认给的是 `development` |
| `HTTP_HOST` | 否 | `localhost` | 监听地址（`.env.example` 示例值为 `0.0.0.0`，容器 / 局域网部署用后者） |
| `HTTP_PORT` | 否 | `3000` | 监听端口（`.env.example` 示例值为 `3001`） |
| `AUTH_ACCESS_TOKEN_SECRET` | **是** | — | 访问令牌签名密钥 |
| `AUTH_REFRESH_TOKEN_SECRET` | **是** | — | 刷新令牌签名密钥 |
| `AUTH_ACCESS_TOKEN_EXP` | 否 | `15m` | 访问令牌有效期，支持 `s/m/h/d/w` |
| `AUTH_REFRESH_TOKEN_EXP` | 否 | `7d` | 刷新令牌有效期，支持 `s/m/h/d/w` |
| `DATABASE_URL` | **是** | — | PostgreSQL 连接串，`?schema=` 会被取出传给 PrismaPg（缺省 `public`） |
| `REDIS_URL` | **是** | — | Redis 连接串，形如 `redis://:password@host:6379`，**不要带 db 序号**：库号由应用固定分配（业务 0 / 缓存 1 / 队列 2），带了 db 段会被 URL 优先级覆盖，三个客户端会挤到同一个库 |
| `SEED_ADMIN_EMAIL` | 种子时必填 | — | 管理员邮箱 |
| `SEED_ADMIN_PASSWORD` | 种子时必填 | — | 管理员初始密码 |
| `SEED_ADMIN_USERNAME` | 种子时必填 | — | 管理员用户名 |
| `EMAIL_HOST` | 否 | 空 | SMTP 主机；未配置时应用仍可启动，但发信返回 503 |
| `EMAIL_PORT` | 否 | `587` | SMTP 端口，`465` 时自动启用 TLS |
| `EMAIL_USER` | 否 | 空 | SMTP 账号（Gmail 需使用应用专用密码） |
| `EMAIL_PASS` | 否 | 空 | SMTP 密码 |
| `EMAIL_FROM` | 否 | 回退到 `EMAIL_USER` | 发件人 |
| `EMAIL_TEMPLATE_DIR` | 否 | `dist/common/email/templates` | 邮件模板目录（未列入 `.env.example`） |
| `DATABASE_POOL_MAX` | 否 | `10` | pg 连接池上限；PM2 启动时按 CPU 核数自动均分 |

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
| `npm run format` | Prettier 格式化 `src/**/*.ts` |
| `npm run knip` | 扫描未使用的文件、依赖与导出 |
| `npm run docker` | 启动 PostgreSQL 与 Redis 容器 |
| `npm run db:push` | `prisma generate` + `prisma db push`（同步表结构） |
| `npm run db:seed` | 执行 `prisma/seed.js` |
| `npm run pack` | 构建并生成 `release/` 发布包 |
| `npm run pm2:start` | 以 cluster 模式启动 PM2 进程 |
| `npm run pm2:reload` / `pm2:stop` / `pm2:delete` / `pm2:logs` | PM2 运维命令 |
| `npm run update:packages` | 升级依赖版本 |

> `db:push` 与 `db:seed` 通过 `dotenv run --` 加载 `.env`。直接执行 `npx prisma ...` 不会自动读取 `.env`，此时需自行导出环境变量或改用 `npm run` 脚本。

---

## API 一览

全局前缀为 `/api`，完整定义见 Swagger：`http://localhost:3001/docs`（非生产环境）。

| 方法 | 路径 | 权限 | 限流 | 说明 |
| --- | --- | --- | --- | --- |
| `POST` | `/api/auth/login` | 公开 | 5 次 / 分钟 | 邮箱密码登录，返回双令牌 + 用户信息 |
| `POST` | `/api/auth/send-code` | 公开 | 1 次 / 分钟 | 下发邮箱验证码（`SIGNUP` / `PASSWORD_RESET`） |
| `POST` | `/api/auth/signup` | 公开 | 5 次 / 分钟 | 凭验证码注册，成功返回 201 |
| `POST` | `/api/auth/reset-password` | 公开 | 5 次 / 分钟 | 凭验证码重置密码，成功即吊销该用户全部令牌 |
| `POST` | `/api/auth/refresh-token` | 刷新令牌 | 5 次 / 分钟 | 用刷新令牌换取新的双令牌（轮换旧会话） |
| `POST` | `/api/auth/logout` | 登录用户 | 全局 1000 次 / 分钟 | 吊销该用户全部令牌 |
| `GET` | `/api/health` | 公开 | 全局 1000 次 / 分钟 | 探测 PostgreSQL 与 Redis |
| `GET` | `/api/user/profile` | 登录用户 | 全局 1000 次 / 分钟 | 获取当前用户资料 |
| `GET` | `/api/user/list` | `ADMIN` | 全局 1000 次 / 分钟 | 分页搜索用户（`page` / `limit` / `keyword` / `role`） |
| `PUT` | `/api/user/:id` | `ADMIN` | 全局 1000 次 / 分钟 | 更新用户（`userName` / `avatar`），`id` 为 UUID v4 |
| `DELETE` | `/api/user/:id` | `ADMIN` | 全局 1000 次 / 分钟 | 删除用户并吊销其令牌 |

认证方式：

```http
Authorization: Bearer <accessToken>    # 普通受保护接口
Authorization: Bearer <refreshToken>   # 仅 /api/auth/refresh-token
```

`POST /api/auth/send-code` 请求体示例：

```json
{ "email": "user@example.com", "scene": "SIGNUP" }
```

`POST /api/auth/signup` 请求体示例（密码至少 8 位，需同时包含大小写字母、数字与 `@$!%*?&` 之一）：

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
  "data": {}
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
- Prisma 已知错误码（`P2002` 唯一约束、`P2025` 记录不存在、`P1001` 连接失败等）会映射为对应的 HTTP 状态码与中文提示
- 响应体会按 `@DocEndpoint({ serialization })` 声明的 Schema 校验，不符时抛 `Serialization failed at ...`，便于在上线前发现契约漂移

---

## 认证机制

- **口令哈希**：Argon2（`argon2.hash` / `argon2.verify`），数据库不存明文
- **双令牌**：访问令牌默认 15 分钟，刷新令牌默认 7 天，分别使用独立密钥签发；JWT 载荷含 `userId`、`role`、`jti`
- **服务端会话**：登录 / 注册 / 刷新时写入以下键（均在业务库 `default` 客户端）
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

1. 下发验证码时把验证码 **SHA-256 哈希**写入 Redis（`verification:{scene}:{email}`），明文只出现在邮件正文
2. 不同场景（注册 / 重置密码）的验证码互不通用
3. 校验通过即删除；错误累加尝试次数，超过 5 次直接作废
4. 重置密码时若邮箱未注册，接口返回与正常流程一致的计时信息（不泄露账号是否存在）
5. 邮件通过 BullMQ 队列异步投递，`email_history` 表记录 `PENDING → RETRYING → SENT/FAILED` 全生命周期与失败原因
6. 邮件模板为 `src/common/email/templates/email-code.html`，构建时作为资源复制到 `dist/`；模板变量会被 HTML 转义

---

## Redis 客户端

`src/common/cache/cache.module.ts` 里的 `RedisModule` 注册了三个命名客户端，共用一个 `REDIS_URL`、按 db 序号隔离，各自独立连接：

| 客户端 | 用途 | 使用者 | db 序号 |
| --- | --- | --- | --- |
| `default` | 业务库 | `RedisService`（`@nestjs-redisx/core`）—— 验证码、令牌会话等业务数据 | 0 |
| `cache` | 缓存库 | `@nestjs-redisx/cache` 的 L2、限流、分布式锁 | 1 |
| `queue` | 队列库 | BullMQ（`src/common/bullmq/bullmq.module.ts`） | 2 |

- 客户端名直接写在 `src/common/cache/cache.module.ts`（`default` / `cache` / `queue`），各插件通过自己的 `client` 选项按名字指定
- 库号固定写在 `src/common/config/redis.config.ts` 的 `db` 常量里，不开放为环境变量，避免各环境库号漂移导致键串库
- `REDIS_URL` **不要带 db 序号**（写成 `redis://host:6379`）：ioredis 解析 `new Redis(url, options)` 时 URL 优先、只补充缺失字段，带 `/0` 会让 `db` 选项整体失效，三个客户端会全部挤到 db 0
- 限流与分布式锁属于可丢弃的基础设施数据，与缓存同库；业务数据单独放在 `default`，互不影响
- Redis 客户端**按需建连**：未被使用的客户端不会占用连接

---

## 限流

- 实现：`@nestjs-redisx/rate-limit` 插件（在 `src/common/cache/cache.module.ts` 中随 `RedisModule` 装配，使用 `cache` 客户端），滑动窗口 + Lua 脚本计数，多实例部署下计数一致
- 全局默认：**1000 次 / 60 秒**，按「控制器 + 方法 + 客户端 IP」分桶（阈值来源 `src/common/config/app.config.ts`）
- 超限返回 `429` 与提示「请求过于频繁，请稍后再试」，响应带 `X-RateLimit-Limit` / `X-RateLimit-Remaining` / `X-RateLimit-Reset`，被拒时附 `Retry-After`
- 单路由覆盖示例：`@RateLimit({ points: 5, duration: 60 })`（见 `src/modules/auth/controllers/auth.public.controller.ts`）
- 故障策略为 `fail-closed`：Redis 不可用时直接拒绝请求

---

## 分布式锁

基于 `@nestjs-redisx/locks`，复用缓存客户端（`cache`，与缓存 / 限流同库，装配位于 `src/common/cache/cache.module.ts`），不额外建连。插件由 `LocksPlugin.getExports()` 直接导出 `LOCK_SERVICE`（类型 `ILockService`），项目不再额外封装一层，需要加锁时注入该 token 或直接用 `@WithLock`。

| 项 | 取值 | 来源 |
| --- | --- | --- |
| 键前缀 | `_lock:` | `src/common/config/lock.config.ts` |
| 默认 TTL | 30 秒 | 同上 |
| TTL 上限 | 300 秒（业务传更大值会被截断） | 同上 |
| 重试 | 最多 3 次，首次 100 ms，×2 退避，单次不超过 3000 ms | 同上 |
| 自动续期 | 开启，间隔为 `ttl × 0.5` | 同上 |

### 用法一：注入 `LOCK_SERVICE`（推荐）

插件已导出 `LOCK_SERVICE` token，直接注入 `ILockService`，业务键不含 `_lock:` 前缀：

```ts
import { type ILockService, LOCK_SERVICE } from '@nestjs-redisx/locks';

constructor(
    @Inject(LOCK_SERVICE) private readonly lockService: ILockService
) {}

const result = await this.lockService.withLock(
    `auth:code:${scene}:${email}`,
    async () => {
        return await this.doSomething();
    },
    { ttl: 10000, waitTimeout: 3000 }
);
```

其他方法：

- `acquire(key, options?)` —— 拿到锁句柄，自行 `release()` / `extend(ttl)`，长任务可配合 `autoRenew`
- `tryAcquire(key, options?)` —— 单次尝试，失败返回 `null`，适合防重复提交
- `isLocked(key)` / `forceRelease(key)` —— 查询与运维兜底（`forceRelease` 不校验持有者）

### 用法二：`@WithLock` 装饰器

```ts
@WithLock({ key: 'user:{0.id}', ttl: 10000, onLockFailed: 'skip' })
async updateProfile(dto: UpdateProfileDto) { ... }
```

`key` 支持 `{0}` / `{0.id}` 占位符插值。装饰器通过模块初始化时注册的全局 getter 取 `LOCK_SERVICE`，若在 `LocksPlugin` 装配完成前被调用，会**降级为不加锁直接执行**并打印 warn 日志，因此对正确性要求高的临界区建议显式注入调用。

### 约束

- `withLock` / `acquire` 抢锁超时抛 `LockAcquisitionError`（`RedisXError` 子类，**不是** `HttpException`），全局异常过滤器不识别它，会按未知异常返回 `500`；需要 `409` 语义请在业务侧 `catch` 后转成 `ConflictException`
- 锁的释放与续期用 Lua 脚本先比对持有者 token，不会误删他人持有的锁
- 同一业务不要嵌套持有多把锁；确需多资源加锁时对 key 排序后依次获取，避免死锁

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

连接池由 `DatabaseService` 创建（`pg.Pool`，上限取 `DATABASE_POOL_MAX`，建连超时 5 秒），空闲连接异常只记录日志，不会导致进程退出。

常用命令：

```bash
npm run db:push                        # 同步表结构（无迁移文件）
npx dotenv run -- prisma studio        # 图形化查看数据
npm run db:seed                        # 创建管理员
```

> 本项目用 `prisma db push` 而非迁移文件管理结构。如需版本化迁移，可在 `prisma.config.js` 已声明的 `prisma/migrations` 路径下改用 `prisma migrate dev`。

---

## 开发约定

新增业务模块时，按现有模式组织：

1. **DTO 用 Zod**：`z.strictObject({...})`，字段通过 `.meta({ description, examples })` 补充文档信息，类型用 `z.infer<>` 导出
2. **控制器装饰器**：
   - `@DocEndpoint({ summary, message, serialization, paginated?, httpStatus? })` —— 一次声明接口摘要、成功提示、响应校验 Schema 与 Swagger 响应体
   - `@PublicRoute()` —— 跳过 JWT 守卫
   - `@AllowRoles([UserRole.ADMIN])` —— 角色限制（仍需通过 JWT 守卫）
   - 入参绑定：`@Body({ schema: XxxSchema })`、`@Query({ schema: XxxSchema })`
3. **全局守卫**：JWT 访问守卫、角色守卫、限流守卫已在 `RequestModule` 注册为 `APP_GUARD`，默认全站受保护，公开接口需显式标注
4. **数据库访问**：注入 `DatabaseService`（继承 `PrismaClient`），不要重复建连
5. **Redis 访问**：业务缓存直接用 `@Cached({ key, tags })` / `@InvalidateTags({ tags })` 装饰器（`@nestjs-redisx/cache`）；需要原子操作或自定义键布局时注入 `RedisService`（`@nestjs-redisx/core`）调 `get` / `set` / `eval`，不要再自己建连。业务数据走 `default` 客户端，缓存 / 限流 / 分布式锁走 `cache` 客户端，队列走 `queue`，不要跨库复用一个客户端
6. **分布式锁**：临界区注入 `LOCK_SERVICE`（`ILockService`，`@nestjs-redisx/locks`）调 `withLock(key, fn, options?)`，或用 `@WithLock` 装饰器，不要在业务里手写 `SET NX`；默认 TTL 30 秒，长任务务必显式传 `ttl` 或开启自动续期
7. **导入别名**：统一使用 `src/...` 绝对路径，ESLint 会强制分组排序与首行空行
8. **代码风格**：4 空格缩进、单引号、语句带分号、行宽 80，统一交给 Prettier（`npm run format`）
9. **源码不写注释**：逻辑靠命名、类型与目录结构自解释，说明性内容统一沉淀到本 README

---

## 构建与部署

### 打包

```bash
npm run pack
```

脚本依次执行 `build` → `prisma generate` → 收集产物到 `release/`，并把 `package.json` 裁剪为仅保留生产依赖与运维脚本。`release/` 内容：

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

PM2 配置（`ecosystem.config.cjs`）：应用名 `nestjs-api-starter`、`cluster` 模式、实例数取 CPU 核数、内存超过 512M 自动重启、`NODE_ENV=production`，并按核数均分 `DATABASE_POOL_MAX`。

> 生产环境需自行准备 PostgreSQL 与 Redis（或复用 `docker-compose.yml`），并正确设置 `DATABASE_URL`、`REDIS_URL`（**不带 db 序号**）与两个 JWT 密钥。生产模式下 Swagger 不会挂载。
