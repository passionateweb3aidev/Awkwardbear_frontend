# Docker 部署指南

本指南介绍如何使用 Docker 构建、导出和部署 AB-DAO Pet 应用。

## 📋 目录

- [快速开始](#快速开始)
- [本地构建](#本地构建)
- [导出和分发](#导出和分发)
- [生产环境部署](#生产环境部署)
- [环境变量配置](#环境变量配置)
- [常见问题](#常见问题)

## 🚀 快速开始

### 前置要求

- Docker >= 20.10
- pnpm >= 8.0 (仅用于本地开发)
- 8GB+ 可用内存（构建时需要）

### 一键构建和运行

```bash
# 1. 构建镜像
./scripts/build-docker.sh

# 2. 运行容器（需要先配置环境变量）
docker run -d -p 3000:3000 --name abdao-pet \
  -e NEXTAUTH_SECRET=your-secret \
  -e NEXTAUTH_URL=http://localhost:3000 \
  -e TWITTER_CLIENT_ID=your-client-id \
  -e TWITTER_CLIENT_SECRET=your-client-secret \
  abdao-pet:latest

# 3. 查看日志
docker logs -f abdao-pet

# 4. 访问应用
open http://localhost:3000
```

## 🔨 本地构建

### 方式 1: 使用构建脚本（推荐）

```bash
# 构建 latest 标签
./scripts/build-docker.sh

# 构建指定标签
./scripts/build-docker.sh v1.0.0
```

### 方式 2: 直接使用 Docker 命令

```bash
docker build -t abdao-pet:latest .
```

### 方式 3: 使用 Docker Compose

```bash
# 构建并启动
docker-compose up -d --build

# 查看日志
docker-compose logs -f

# 停止
docker-compose down
```

## 📦 导出和分发

### 导出镜像文件

```bash
# 导出为 tar.gz 文件
./scripts/export-docker.sh

# 导出指定标签
./scripts/export-docker.sh v1.0.0

# 指定输出文件名
./scripts/export-docker.sh v1.0.0 my-custom-name.tar.gz
```

### 传输到服务器

```bash
# 使用 scp
scp abdao-pet-latest.tar.gz user@server:/tmp/

# 使用 rsync（更快，支持断点续传）
rsync -avz --progress abdao-pet-latest.tar.gz user@server:/tmp/

# 使用云存储（阿里云 OSS 示例）
ossutil cp abdao-pet-latest.tar.gz oss://your-bucket/
```

## 🌐 生产环境部署

### 步骤 1: 准备环境变量

在服务器上创建 `.env.production` 文件：

```bash
# 创建环境变量文件
cat > .env.production << 'EOF'
NODE_ENV=production
PORT=3000
NEXTAUTH_SECRET=<使用 openssl rand -base64 32 生成>
NEXTAUTH_URL=https://yourdomain.com
TWITTER_CLIENT_ID=your-twitter-client-id
TWITTER_CLIENT_SECRET=your-twitter-client-secret
NEXT_PUBLIC_GA4_ID=your-ga4-id
EOF

# 设置文件权限（重要！防止泄露）
chmod 600 .env.production
```

### 步骤 2: 导入镜像

```bash
# 解压并导入
gunzip -c abdao-pet-latest.tar.gz | docker load

# 或者直接导入（如果文件未压缩）
docker load < abdao-pet-latest.tar

# 验证镜像
docker images | grep abdao-pet
```

### 步骤 3: 运行容器

#### 方式 1: 直接运行

```bash
docker run -d \
  --name abdao-pet \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file .env.production \
  abdao-pet:latest
```

#### 方式 2: 使用 Docker Compose（推荐）

创建 `docker-compose.prod.yml`：

```yaml
version: "3.8"

services:
  abdao-pet:
    image: abdao-pet:latest
    container_name: abdao-pet
    ports:
      - "3000:3000"
    env_file:
      - .env.production
    restart: unless-stopped
    healthcheck:
      test:
        [
          "CMD",
          "node",
          "-e",
          "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})",
        ]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 60s
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 512M
```

启动：

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 步骤 4: 配置反向代理（推荐）

#### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL 证书配置
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

#### Caddy 配置示例（更简单）

```caddy
yourdomain.com {
    reverse_proxy localhost:3000
    encode gzip
}
```

## 🔐 环境变量配置

### 必需的环境变量

| 变量                    | 说明                    | 示例                             |
| ----------------------- | ----------------------- | -------------------------------- |
| `NEXTAUTH_SECRET`       | NextAuth 加密密钥       | `openssl rand -base64 32`        |
| `NEXTAUTH_URL`          | 应用完整 URL            | `https://yourdomain.com`         |
| `TWITTER_CLIENT_ID`     | Twitter OAuth Client ID | 从 Twitter Developer Portal 获取 |
| `TWITTER_CLIENT_SECRET` | Twitter OAuth Secret    | 从 Twitter Developer Portal 获取 |

### 可选的环境变量

| 变量                          | 说明                  | 默认值       |
| ----------------------------- | --------------------- | ------------ |
| `NODE_ENV`                    | 运行环境              | `production` |
| `PORT`                        | 应用端口              | `3000`       |
| `NEXT_PUBLIC_GA4_ID`          | Google Analytics 4 ID | 无           |
| `NEXT_PUBLIC_BSC_TESTNET_RPC` | BSC 测试网 RPC        | 有默认值     |

### 生成密钥

```bash
# 生成 NEXTAUTH_SECRET
openssl rand -base64 32

# 或使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 🛠️ 常用命令

### 容器管理

```bash
# 查看运行状态
docker ps | grep abdao-pet

# 查看日志
docker logs -f abdao-pet

# 查看最近 100 行日志
docker logs --tail 100 abdao-pet

# 进入容器
docker exec -it abdao-pet sh

# 重启容器
docker restart abdao-pet

# 停止容器
docker stop abdao-pet

# 删除容器
docker rm abdao-pet

# 查看资源使用
docker stats abdao-pet
```

### 镜像管理

```bash
# 查看镜像列表
docker images | grep abdao-pet

# 删除旧镜像
docker rmi abdao-pet:old-tag

# 清理未使用的镜像
docker image prune

# 查看镜像详情
docker inspect abdao-pet:latest
```

### 健康检查

```bash
# 查看健康状态
docker inspect --format='{{.State.Health.Status}}' abdao-pet

# 查看健康检查日志
docker inspect --format='{{json .State.Health}}' abdao-pet | jq
```

## 🔄 更新部署

### 滚动更新（零停机）

```bash
# 1. 导入新版本镜像
gunzip -c abdao-pet-v2.0.0.tar.gz | docker load

# 2. 启动新容器（使用不同名称）
docker run -d \
  --name abdao-pet-new \
  --restart unless-stopped \
  -p 3001:3000 \
  --env-file .env.production \
  abdao-pet:v2.0.0

# 3. 等待健康检查通过
docker inspect --format='{{.State.Health.Status}}' abdao-pet-new

# 4. 切换流量（修改 Nginx 配置或更改端口映射）
# 5. 停止并删除旧容器
docker stop abdao-pet
docker rm abdao-pet

# 6. 重命名新容器
docker rename abdao-pet-new abdao-pet
```

### 快速更新（会有短暂停机）

```bash
# 1. 导入新版本
gunzip -c abdao-pet-v2.0.0.tar.gz | docker load

# 2. 停止并删除旧容器
docker-compose -f docker-compose.prod.yml down

# 3. 更新镜像标签并启动
export IMAGE_TAG=v2.0.0
docker-compose -f docker-compose.prod.yml up -d
```

## ❓ 常见问题

### 1. 构建失败：内存不足

```bash
# 临时增加 Docker 内存限制（Docker Desktop）
# Settings -> Resources -> Memory -> 8GB+

# 或使用 --memory 参数
docker build --memory 4g -t abdao-pet:latest .
```

### 2. 容器启动失败

```bash
# 查看详细日志
docker logs abdao-pet

# 检查环境变量
docker exec abdao-pet env | grep -E 'NEXTAUTH|TWITTER'

# 检查端口占用
lsof -i :3000
netstat -tunlp | grep 3000
```

### 3. 健康检查失败

```bash
# 手动测试健康检查
docker exec abdao-pet node -e "require('http').get('http://localhost:3000', (r) => console.log(r.statusCode))"

# 检查应用是否真正在监听
docker exec abdao-pet netstat -tlnp | grep 3000
```

### 4. 镜像文件过大

```bash
# 查看镜像层大小
docker history abdao-pet:latest --human

# 当前优化措施：
# ✅ 使用 Alpine Linux（小基础镜像）
# ✅ 多阶段构建（只保留运行时文件）
# ✅ Next.js standalone 模式（最小化依赖）
# ✅ .dockerignore 排除不必要文件

# 预期大小：150-250MB（压缩后 80-120MB）
```

### 5. Twitter 登录失败

检查以下配置：

```bash
# 1. 环境变量是否正确
docker exec abdao-pet env | grep TWITTER

# 2. NEXTAUTH_URL 是否匹配实际访问的域名
# 3. Twitter Developer Portal 中的回调 URL 是否配置正确
#    格式：https://yourdomain.com/api/auth/callback/twitter
```

## 📊 监控和日志

### 集成日志系统

```bash
# 使用 Docker 日志驱动
docker run -d \
  --name abdao-pet \
  --log-driver=json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  abdao-pet:latest
```

### 导出日志

```bash
# 导出到文件
docker logs abdao-pet > app.log 2>&1

# 实时监控
docker logs -f --tail 50 abdao-pet
```

## 🔒 安全建议

1. **不要在镜像中包含敏感信息**
   - ❌ 不要在 Dockerfile 中硬编码密钥
   - ✅ 使用环境变量或 secrets 管理

2. **保护环境变量文件**

   ```bash
   chmod 600 .env.production
   chown root:root .env.production
   ```

3. **定期更新基础镜像**

   ```bash
   docker pull node:20-alpine
   ./scripts/build-docker.sh
   ```

4. **使用非 root 用户运行**
   - ✅ Dockerfile 已配置 nextjs 用户

5. **启用 HTTPS**
   - 使用 Let's Encrypt 免费证书
   - 配置 Nginx/Caddy 反向代理

## 📚 参考资料

- [Next.js Docker 官方文档](https://nextjs.org/docs/deployment#docker-image)
- [Docker 最佳实践](https://docs.docker.com/develop/dev-best-practices/)
- [Next.js Standalone 模式](https://nextjs.org/docs/advanced-features/output-file-tracing)
- [Twitter OAuth 设置](./TWITTER_AUTH_SETUP.md)
