#!/bin/bash

# 打包源代码文件脚本（用于服务器直接构建）
# 使用方法: ./scripts/package-source.sh [version]
# 示例: ./scripts/package-source.sh v1.0.0

set -e

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 获取版本标签，默认为当前时间戳
VERSION=${1:-$(date +%Y%m%d-%H%M%S)}
PACKAGE_NAME="ab-pet-source-${VERSION}"
PACKAGE_FILE="${PACKAGE_NAME}.tar.gz"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}📦 打包源代码文件${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "版本: ${VERSION}"
echo "打包文件: ${PACKAGE_FILE}"
echo ""

# 创建临时打包目录
TEMP_DIR=$(mktemp -d)
PACKAGE_DIR="${TEMP_DIR}/${PACKAGE_NAME}"

echo -e "${BLUE}📦 步骤 1/4: 准备打包目录${NC}"
mkdir -p "${PACKAGE_DIR}"

echo -e "${BLUE}📦 步骤 2/4: 复制源代码文件${NC}"

# 复制源代码目录
if [ -d "src" ]; then
    echo "  复制 src/ 目录..."
    cp -r src "${PACKAGE_DIR}/"
else
    echo -e "${RED}❌ 错误: 未找到 src/ 目录${NC}"
    exit 1
fi

# 复制 public 目录
if [ -d "public" ]; then
    echo "  复制 public/ 目录..."
    cp -r public "${PACKAGE_DIR}/"
else
    echo -e "${YELLOW}⚠️  警告: 未找到 public/ 目录${NC}"
fi

# 复制 message 目录（国际化文件）
if [ -d "message" ]; then
    echo "  复制 message/ 目录..."
    cp -r message "${PACKAGE_DIR}/"
else
    echo -e "${YELLOW}⚠️  警告: 未找到 message/ 目录${NC}"
fi

echo -e "${BLUE}📦 步骤 3/4: 复制配置文件${NC}"

# 复制必需的配置文件
CONFIG_FILES=(
    "package.json"
    "pnpm-lock.yaml"
    "next.config.ts"
    "tsconfig.json"
    "tailwind.config.js"
    "postcss.config.mjs"
    "components.json"
    "eslint.config.mjs"
    "prettier.config.mjs"
    "ecosystem.config.js"
)

for file in "${CONFIG_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  复制 $file..."
        cp "$file" "${PACKAGE_DIR}/"
    else
        echo -e "${YELLOW}  ⚠️  警告: 未找到 $file${NC}"
    fi
done

# 复制 .env.example（如果存在）
if [ -f ".env.example" ]; then
    echo "  复制 .env.example..."
    cp .env.example "${PACKAGE_DIR}/"
fi

echo -e "${BLUE}📦 步骤 4/4: 创建部署说明和脚本${NC}"

# 创建部署说明文件
cat > "${PACKAGE_DIR}/DEPLOY.md" << 'EOF'
# 服务器部署指南

## 前置要求

- Node.js >= 20.x
- pnpm >= 8.0（或 npm/yarn）
- 8GB+ 可用内存（构建时需要）

## 部署步骤

### 1. 解压文件

```bash
tar -xzf ab-pet-source-*.tar.gz
cd ab-pet-source-*
```

### 2. 安装依赖

```bash
# 使用 pnpm（推荐）
pnpm install --prod=false

# 或使用 npm
npm install
```

### 3. 配置环境变量

```bash
# 从示例文件创建
cp .env.example .env

# 编辑环境变量
nano .env
# 或
vi .env
```

必需的环境变量：
- `NEXTAUTH_SECRET` - NextAuth 加密密钥（使用 `openssl rand -base64 32` 生成）
- `NEXTAUTH_URL` - 应用完整 URL（例如：`https://yourdomain.com`）
- `TWITTER_CLIENT_ID` - Twitter OAuth Client ID
- `TWITTER_CLIENT_SECRET` - Twitter OAuth Secret

可选的环境变量：
- `NEXT_PUBLIC_GA4_ID` - Google Analytics 4 ID
- `NEXT_PUBLIC_BSC_TESTNET_RPC` - BSC 测试网 RPC URL

### 4. 构建项目

```bash
pnpm run build
# 或
npm run build
```

### 5. 启动应用

```bash
# 方式 1: 直接启动
pnpm start
# 或
npm start

# 方式 2: 使用 PM2（推荐）
pm2 start pnpm --name ab-pet -- start
# 或
pm2 start npm --name ab-pet -- start

# 方式 3: 使用 systemd（见下方）
```

## 使用 PM2 管理（推荐）

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start pnpm --name ab-pet -- start

# 查看状态
pm2 status
pm2 logs ab-pet

# 重启应用
pm2 restart ab-pet

# 停止应用
pm2 stop ab-pet

# 设置开机自启
pm2 startup
pm2 save
```

## 使用 systemd 管理

创建服务文件 `/etc/systemd/system/ab-pet.service`:

```ini
[Unit]
Description=AB-DAO Pet Application
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/opt/front/ab-pet
Environment="NODE_ENV=production"
EnvironmentFile=/opt/front/ab-pet/.env
ExecStart=/usr/bin/pnpm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启动服务:
```bash
sudo systemctl daemon-reload
sudo systemctl enable ab-pet
sudo systemctl start ab-pet
sudo systemctl status ab-pet
```

## 配置反向代理（Nginx）

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

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
    }
}
```

## 更新部署

```bash
# 1. 停止应用
pm2 stop ab-pet
# 或
sudo systemctl stop ab-pet

# 2. 备份当前版本
mv /opt/front/ab-pet /opt/front/ab-pet-backup-$(date +%Y%m%d-%H%M%S)

# 3. 解压新版本
tar -xzf ab-pet-source-*.tar.gz
mv ab-pet-source-* /opt/front/ab-pet

# 4. 安装依赖
cd /opt/front/ab-pet
pnpm install --prod=false

# 5. 构建项目
pnpm run build

# 6. 启动应用（使用 ecosystem.config.js）
pm2 restart ecosystem.config.js --env production
# 或
pm2 delete ab-pet
pm2 start ecosystem.config.js --env production
# 或使用 systemd
sudo systemctl start ab-pet
```

## 故障排查

### 构建失败

```bash
# 检查 Node.js 版本
node --version  # 应该是 >= 20.x

# 检查内存
free -h

# 清理并重新安装
rm -rf node_modules .next
pnpm install --prod=false
pnpm run build
```

### 应用无法启动

```bash
# 检查端口占用
lsof -i :3000
netstat -tunlp | grep 3000

# 查看日志
pm2 logs ab-pet
# 或
sudo journalctl -u ab-pet -f
```

### 环境变量问题

```bash
# 检查环境变量
cat .env

# 测试环境变量加载
node -e "require('dotenv').config(); console.log(process.env.NEXTAUTH_SECRET)"
```
EOF

# 创建快速部署脚本
cat > "${PACKAGE_DIR}/deploy.sh" << 'EOF'
#!/bin/bash

# 快速部署脚本
set -e

echo "🚀 开始部署..."

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js >= 20.x"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ 错误: Node.js 版本过低，需要 >= 20.x，当前版本: $(node --version)"
    exit 1
fi

# 检查 pnpm
if command -v pnpm &> /dev/null; then
    PACKAGE_MANAGER="pnpm"
elif command -v npm &> /dev/null; then
    PACKAGE_MANAGER="npm"
else
    echo "❌ 错误: 未找到 pnpm 或 npm，请先安装"
    exit 1
fi

echo "✅ 使用包管理器: $PACKAGE_MANAGER"

# 安装依赖
echo ""
echo "📦 安装依赖..."
if [ "$PACKAGE_MANAGER" = "pnpm" ]; then
    pnpm install --prod=false
else
    npm install
fi

# 检查 .env 文件
if [ ! -f .env ]; then
    echo ""
    echo "⚠️  未找到 .env 文件"
    if [ -f .env.example ]; then
        echo "从 .env.example 创建..."
        cp .env.example .env
        echo "✅ 已创建 .env 文件，请编辑后填入实际的环境变量"
        echo "📝 编辑命令: nano .env 或 vi .env"
        echo ""
        echo "⚠️  请先配置 .env 文件后再构建！"
        exit 1
    else
        echo "❌ 错误: 未找到 .env.example 文件"
        exit 1
    fi
fi

# 创建 logs 目录（PM2 需要）
mkdir -p logs

# 构建项目
echo ""
echo "🔨 构建项目..."
if [ "$PACKAGE_MANAGER" = "pnpm" ]; then
    pnpm run build
else
    npm run build
fi

# 创建 logs 目录（PM2 需要）
mkdir -p logs

# 检查 PM2 是否安装
if command -v pm2 &> /dev/null; then
    echo ""
    echo "✅ 检测到 PM2，可以使用 ecosystem.config.js 启动"
    echo ""
    echo "启动应用（推荐）:"
    echo "  pm2 start ecosystem.config.js --env production"
    echo ""
    echo "其他 PM2 命令:"
    echo "  pm2 status              # 查看状态"
    echo "  pm2 logs ab-pet         # 查看日志"
    echo "  pm2 restart ab-pet       # 重启应用"
    echo "  pm2 stop ab-pet          # 停止应用"
    echo "  pm2 delete ab-pet        # 删除应用"
    echo "  pm2 startup              # 设置开机自启"
    echo "  pm2 save                 # 保存当前配置"
else
    echo ""
    echo "⚠️  未检测到 PM2，可以安装: npm install -g pm2"
    echo ""
    echo "启动应用:"
    echo "  $PACKAGE_MANAGER start"
    echo ""
fi

echo "✅ 部署完成！"
echo ""
EOF

chmod +x "${PACKAGE_DIR}/deploy.sh"

# 打包
echo -e "${BLUE}📦 打包中...${NC}"
cd "${TEMP_DIR}"
tar -czf "${PACKAGE_FILE}" "${PACKAGE_NAME}"
mv "${PACKAGE_FILE}" "${OLDPWD}/"

# 清理临时目录
rm -rf "${TEMP_DIR}"

# 获取文件信息
FILE_SIZE=$(du -h "${OLDPWD}/${PACKAGE_FILE}" | cut -f1)
FILE_SIZE_BYTES=$(stat -f%z "${OLDPWD}/${PACKAGE_FILE}" 2>/dev/null || stat -c%s "${OLDPWD}/${PACKAGE_FILE}")
FILE_SIZE_MB=$((FILE_SIZE_BYTES / 1024 / 1024))

echo ""
echo -e "${GREEN}✅ 打包完成！${NC}"
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}📊 文件信息${NC}"
echo -e "${BLUE}========================================${NC}"
echo "文件名称: ${PACKAGE_FILE}"
echo "文件路径: $(pwd)/${PACKAGE_FILE}"
echo "文件大小: ${FILE_SIZE} (${FILE_SIZE_MB} MB)"
echo "MD5校验: $(md5sum "${OLDPWD}/${PACKAGE_FILE}" 2>/dev/null || md5 "${OLDPWD}/${PACKAGE_FILE}" | awk '{print $4}')"
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}📦 打包内容${NC}"
echo -e "${BLUE}========================================${NC}"
echo "✓ src/ - 源代码目录"
echo "✓ public/ - 静态资源目录"
echo "✓ message/ - 国际化文件"
echo "✓ package.json - 依赖配置"
echo "✓ pnpm-lock.yaml - 依赖锁定文件"
echo "✓ next.config.ts - Next.js 配置"
echo "✓ tsconfig.json - TypeScript 配置"
echo "✓ tailwind.config.js - Tailwind 配置"
echo "✓ postcss.config.mjs - PostCSS 配置"
echo "✓ components.json - UI 组件配置"
echo "✓ ecosystem.config.js - PM2 配置文件"
echo "✓ deploy.sh - 快速部署脚本"
echo "✓ DEPLOY.md - 部署说明文档"
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}🚀 使用方式${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "1️⃣  传输到服务器:"
echo "   scp ${PACKAGE_FILE} user@server:/opt/front/ab-pet/"
echo ""
echo "2️⃣  在服务器上解压:"
echo "   tar -xzf ${PACKAGE_FILE}"
echo "   cd ${PACKAGE_NAME}"
echo ""
echo "3️⃣  运行快速部署脚本:"
echo "   ./deploy.sh"
echo ""
echo "4️⃣  或手动部署:"
echo "   pnpm install --prod=false"
echo "   cp .env.example .env"
echo "   # 编辑 .env 文件"
echo "   pnpm run build"
echo "   mkdir -p logs"
echo "   pm2 start ecosystem.config.js --env production"
echo ""
