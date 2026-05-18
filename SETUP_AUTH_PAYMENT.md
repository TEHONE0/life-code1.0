# 账号系统 + Shopify支付 上线前配置

## 1. Supabase 控制台

### 1.1 数据库迁移（Project → SQL Editor）

```sql
-- 给 submissions 表加新字段
alter table public.submissions add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.submissions add column if not exists email text;
alter table public.submissions add column if not exists lang text default 'en';
alter table public.submissions add column if not exists paid boolean default false;
alter table public.submissions add column if not exists shopify_order_id text;

create index if not exists submissions_user_id_idx on public.submissions(user_id);
create index if not exists submissions_paid_idx on public.submissions(paid);
```

### 1.2 启用 Google OAuth

Authentication → Providers → Google：
- 打开 Google Cloud Console，创建 OAuth Client ID（Web application）
- 授权回调 URL：`https://<你的supabase域名>.supabase.co/auth/v1/callback`
- 把 Client ID / Client Secret 填回 Supabase

### 1.3 邮箱注册设置

Authentication → Providers → Email：
- Confirm email：建议**关闭**（否则 QQ邮箱用户可能收不到验证邮件）
- 或保持开启，但需要在 Authentication → Email Templates 配置 SMTP

### 1.4 取 ANON KEY

Project Settings → API → `anon public` 那栏，复制 KEY

---

## 2. 环境变量

### 2.1 本地 `.env.local` 追加

```
NEXT_PUBLIC_SUPABASE_URL=https://czfokeskhbtiirtrrpsr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<上面复制的 anon key>

# 留空时跳过支付直接出报告（测试模式）
SHOPIFY_CHECKOUT_URL=https://theone-ai-studio.myshopify.com/cart/<VARIANT_ID>:1
SHOPIFY_WEBHOOK_SECRET=<Shopify webhook 配置时生成>
```

### 2.2 Vercel 上同样的变量都加一份

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SHOPIFY_CHECKOUT_URL production
vercel env add SHOPIFY_WEBHOOK_SECRET production
```

---

## 3. Shopify 后台

### 3.1 创建商品

Products → Add product：
- Title：`Life Code Report`
- Price：`$8.9`
- 隐藏库存（数字类商品）
- 复制 Variant ID（URL 里的数字）

### 3.2 拼出 Checkout URL

```
https://theone-ai-studio.myshopify.com/cart/<VARIANT_ID>:1
```

填到 `SHOPIFY_CHECKOUT_URL`

### 3.3 配置 Webhook

Settings → Notifications → Webhooks → Create webhook：
- Event：`Order payment` (`orders/paid`)
- Format：JSON
- URL：`https://<你的域名>/api/shopify-webhook`
- 复制顶部的 secret 填到 `SHOPIFY_WEBHOOK_SECRET`

### 3.4 配置支付成功跳回

Settings → Checkout → Order processing：
- 勾选 "Show a link to return to the store"，或自定义跳回 URL：
  - 跳回 `https://<你的域名>/{lang}/result?sid=<submission_id>`
- 用户付款成功后会被引导回我的网站

---

## 4. 用户流程

```
首页 → 点击"解析我的生命代码"
  ↓
变量采集（填问卷）→ 提交
  ↓
[未登录] → 登录/注册（Google 或 邮箱+密码）→ 登录后回到下一步
  ↓
支付页 → 显示价格 + 当前邮箱 → 点击"解锁我的报告"
  ↓
[SHOPIFY_CHECKOUT_URL 未设] → 直接生成报告（测试模式）
[已设置] → 跳 Shopify 商品页 → 用户付款 → Shopify webhook 标记 paid=true
  ↓
跳回 /[lang]/result?sid=xxx → 查询submission → 已付款则流式生成报告
  ↓
报告显示 + 自动保存到数据库
  ↓
用户右上角下拉菜单 → "我的报告" → 查看所有历史报告
```

---

## 5. 已知限制 / 后续优化

- ⚠️ 邮箱注册需要在 Supabase 后台关闭 "Confirm email"，否则部分邮箱（QQ/163）会收不到验证邮件
- ⚠️ Shopify webhook 偶尔会延迟到达，用户付款后跳回时 `paid` 可能还是 false，需要后续加轮询/手动刷新
- 🔮 后续：分享报告链接、邀请好友、报告导出 PDF
