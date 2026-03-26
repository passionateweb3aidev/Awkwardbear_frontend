# Twitter/X 授权登录配置指南

本项目已集成 NextAuth.js 来实现 Twitter/X 授权登录功能。

## 环境变量配置

在项目根目录创建 `.env.local` 文件（如果还没有），并添加以下环境变量：

```bash
# Twitter OAuth 2.0 配置
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret

# NextAuth.js 配置（生产环境必需）
# 重要：NEXTAUTH_URL 必须包含完整的路径 /bff/auth，不能只设置 origin
NEXTAUTH_URL=http://localhost:3000/bff/auth  # 开发环境
# NEXTAUTH_URL=https://yourdomain.com/bff/auth  # 生产环境
NEXTAUTH_SECRET=your_random_secret_string  # 用于加密 JWT，可以使用 openssl rand -base64 32 生成
```

## 获取 Twitter API 凭证

1. 访问 [Twitter Developer Portal](https://developer.twitter.com/)
2. 创建应用或选择现有应用
3. 在应用设置中：
   - 启用 **OAuth 2.0**
   - 设置 **Callback URL / Redirect URL**：
     - 开发环境：`http://localhost:3000/bff/auth/callback/twitter`
     - 生产环境：`https://yourdomain.com/bff/auth/callback/twitter`
   - 设置 **App permissions**：至少需要 `Read` 权限
4. 获取 **Client ID** 和 **Client Secret**

## 工作流程

1. **用户点击登录**：在 `PetStatus.tsx` 中点击 "Connect" 按钮
2. **NextAuth 处理 OAuth**：
   - 跳转到 Twitter 授权页面
   - 用户授权后，Twitter 回调到 `/bff/auth/callback/twitter`
   - NextAuth 自动处理 code 交换，获取 access_token
3. **同步到后端**：
   - `TwitterAuthSync` 组件检测到 Twitter 登录成功
   - 调用后端 `/auth/x` API，传递 access_token
   - 后端返回应用的 JWT token
   - 保存 token 到本地存储

## 文件结构

- `src/app/bff/auth/[...nextauth]/route.ts` - NextAuth 配置和 Twitter Provider
- `src/providers/NextAuthProvider.tsx` - NextAuth Session Provider 和 Twitter 登录同步逻辑
- `src/app/[locale]/home/PetStatus.tsx` - Twitter 登录触发按钮
- `src/components/ConnectXGuideDialog.tsx` - Twitter 登录引导对话框

## 注意事项

1. **生产环境部署**：
   - 确保设置正确的 `NEXTAUTH_URL` 环境变量
   - 在 Twitter Developer Portal 中配置生产环境的 Callback URL
   - 使用强随机字符串作为 `NEXTAUTH_SECRET`

2. **后端 API 兼容性**：
   - 当前实现使用 NextAuth 获取的 `access_token` 作为 `code` 参数调用后端 API
   - 如果后端需要原始的 OAuth `code`，可能需要修改后端 API 或使用自定义 OAuth 流程

3. **国际化支持**：
   - Callback URL 会自动保留当前 locale 路径
   - 登录成功后跳转回原页面

## 测试

1. 确保环境变量已正确配置
2. 启动开发服务器：`pnpm dev`
3. 访问首页，点击 "Feed" 按钮
4. 点击 "Connect" 按钮
5. 应该会跳转到 Twitter 授权页面
6. 授权后会自动回调并完成登录

## 参考文档

- [NextAuth.js 官方文档](https://next-auth.js.org/)
- [NextAuth.js Twitter Provider](https://next-auth.js.org/providers/twitter)
- [Twitter API OAuth 2.0 文档](https://developer.twitter.com/en/docs/authentication/oauth-2-0)
