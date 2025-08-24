# 部署指南

本指南说明如何将转换后的 WASM 库部署到 CDN，使其可以通过 `@require` 在油猴脚本中使用。

## 📋 文件清单

本项目包含以下文件：

```
├── vector-math-wasm-lib.js      # 主库文件（完整版）
├── simple-wasm-math.js          # 简化版API库
├── example-usage.js             # 完整版使用示例
├── simple-demo.js               # 简化版使用示例
├── webgpu_wasm_core_bg.wasm     # WASM二进制文件（需要从原项目获取）
├── README.md                    # 用户文档
└── DEPLOYMENT.md                # 本部署指南
```

## 🚀 部署步骤

### 步骤 1：准备 WASM 文件

首先需要获取 `webgpu_wasm_core_bg.wasm` 文件：

```bash
# 从原 Rust 项目构建
cd your-rust-project
wasm-pack build --target web --release

# 复制生成的 WASM 文件
cp pkg/webgpu_wasm_core_bg.wasm ./
```

### 步骤 2：选择 CDN 服务

推荐的免费 CDN 选项：

#### 选项 A：GitHub Pages + jsDelivr

```bash
# 1. 创建 GitHub 仓库并上传文件
git init
git add .
git commit -m "Initial commit"
git push origin main

# 2. 启用 GitHub Pages
# 在仓库设置中启用 Pages，选择 main 分支

# 3. 文件将可通过以下URL访问：
# https://cdn.jsdelivr.net/gh/用户名/仓库名@main/vector-math-wasm-lib.js
# https://cdn.jsdelivr.net/gh/用户名/仓库名@main/webgpu_wasm_core_bg.wasm
```

#### 选项 B：GitHub Releases + jsDelivr

```bash
# 1. 创建 Release
gh release create v1.0.0 \
  vector-math-wasm-lib.js \
  simple-wasm-math.js \
  webgpu_wasm_core_bg.wasm \
  --title "Vector Math WASM Library v1.0.0"

# 2. 文件将可通过以下URL访问：
# https://cdn.jsdelivr.net/gh/用户名/仓库名@v1.0.0/vector-math-wasm-lib.js
```

#### 选项 C：Cloudflare R2 + 自定义域名

```bash
# 1. 上传到 Cloudflare R2
wrangler r2 object put your-bucket/vector-math-wasm-lib.js --file vector-math-wasm-lib.js
wrangler r2 object put your-bucket/webgpu_wasm_core_bg.wasm --file webgpu_wasm_core_bg.wasm

# 2. 配置自定义域名
# 在 Cloudflare Dashboard 中设置自定义域名
```

#### 选项 D：Vercel 静态部署

```bash
# 1. 创建 vercel.json
cat > vercel.json << 'EOF'
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        }
      ]
    },
    {
      "source": "*.wasm",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/wasm"
        }
      ]
    }
  ]
}
EOF

# 2. 部署
vercel --prod
```

### 步骤 3：更新 WASM URL

部署完成后，需要更新库文件中的 WASM URL：

```javascript
// 在 vector-math-wasm-lib.js 中找到这一行：
const WASM_URL =
  "https://raw.githubusercontent.com/kiwifruit13/wasm/refs/heads/main/webgpu_wasm_core_bg.wasm";

// 替换为你的实际URL：
const WASM_URL =
  "https://cdn.jsdelivr.net/gh/kiwifruit13/wasm@main/webgpu_wasm_core_bg.wasm";
```

### 步骤 4：验证部署

创建测试脚本验证部署是否成功：

```javascript
// ==UserScript==
// @name         WASM Library Test
// @require      https://cdn.jsdelivr.net/gh/kiwifruit13/wasm@main/vector-math-wasm-lib.js
// @grant        none
// ==/UserScript==

(async function () {
  try {
    await VectorMathWasmLib.ready;
    console.log("✅ WASM 库加载成功！");
  } catch (error) {
    console.error("❌ WASM 库加载失败:", error);
  }
})();
```

## 🔧 配置示例

### GitHub Pages 完整配置

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Pages
        uses: actions/configure-pages@v3

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2
        with:
          path: "."

      - name: Deploy to GitHub Pages
        uses: actions/deploy-pages@v2
```

### Cloudflare Workers 配置

```javascript
// worker.js
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 设置 CORS 头
    const headers = new Headers({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });

    // 处理 OPTIONS 请求
    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    // 从 R2 获取文件
    const object = await env.WASM_BUCKET.get(url.pathname.slice(1));

    if (object === null) {
      return new Response("File not found", { status: 404, headers });
    }

    // 设置正确的 Content-Type
    if (url.pathname.endsWith(".wasm")) {
      headers.set("Content-Type", "application/wasm");
    } else if (url.pathname.endsWith(".js")) {
      headers.set("Content-Type", "application/javascript");
    }

    return new Response(object.body, { headers });
  },
};
```

## 📝 油猴脚本模板

### 完整版使用模板

```javascript
// ==UserScript==
// @name         Your Script Name
// @namespace    https://github.com/kiwifruit13
// @version      1.0.0
// @description  使用 WASM 向量数学库
// @author       kiwifruit13
// @match        *://*/*
// @require      https://cdn.jsdelivr.net/gh/kiwifruit13/wasm@main/vector-math-wasm-lib.js
// @grant        none
// ==/UserScript==

(async function () {
  "use strict";

  try {
    // 等待库初始化
    await VectorMathWasmLib.ready;

    // 使用库功能
    const wasm = VectorMathWasmLib.utils.getWasm();
    // ... 你的代码 ...
  } catch (error) {
    console.error("脚本执行失败:", error);
  }
})();
```

### 简化版使用模板

```javascript
// ==UserScript==
// @name         Your Script Name (Simple)
// @namespace    https://github.com/kiwifruit13
// @version      1.0.0
// @description  使用简化版 WASM 向量数学库
// @author       kiwifruit13
// @match        *://*/*
// @require      https://cdn.jsdelivr.net/gh/kiwifruit13/wasm@main/vector-math-wasm-lib.js
// @require      https://cdn.jsdelivr.net/gh/kiwifruit13/wasm@main/simple-wasm-math.js
// @grant        none
// ==/UserScript==

(async function () {
  "use strict";

  try {
    // 等待库初始化
    await SimpleWasmMath.ready;

    // 使用简化API
    const v1 = vec3(1, 2, 3);
    const v2 = vec3(4, 5, 6);
    const sum = await SimpleWasmMath.vector.add(v1, v2);

    console.log("向量加法结果:", SimpleWasmMath.utils.toArray(sum));
  } catch (error) {
    console.error("脚本执行失败:", error);
  }
})();
```

## ⚠️ 注意事项

### CORS 配置

确保您的 CDN 正确配置了 CORS 头：

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

### WASM MIME 类型

确保 `.wasm` 文件的 MIME 类型设置为 `application/wasm`：

```nginx
# Nginx 配置
location ~* \.wasm$ {
    add_header Content-Type application/wasm;
    add_header Access-Control-Allow-Origin *;
}
```

### 缓存策略

建议设置适当的缓存头以提高性能：

```
Cache-Control: public, max-age=31536000
ETag: "version-hash"
```

### 版本管理

使用版本化的 URL 以确保稳定性：

```javascript
// 推荐：版本化URL
@require https://cdn.jsdelivr.net/gh/kiwifruit13/wasm@v1.0.0/vector-math-wasm-lib.js

// 不推荐：最新版本URL（可能不稳定）
@require https://cdn.jsdelivr.net/gh/kiwifruit13/wasm@main/vector-math-wasm-lib.js
```

## 🔍 故障排除

### 常见问题

1. **WASM 文件加载失败**

   - 检查 WASM 文件 URL 是否正确
   - 确认服务器设置了正确的 MIME 类型
   - 检查 CORS 配置

2. **库初始化超时**

   - 检查网络连接
   - 尝试使用不同的 CDN
   - 检查浏览器控制台的错误信息

3. **函数调用失败**
   - 确保在 `await VectorMathWasmLib.ready` 之后调用
   - 检查传入参数的类型和格式
   - 查看内存是否正确释放

### 调试技巧

```javascript
// 启用详细日志
window.VectorMathWasmLib.debug = true;

// 检查初始化状态
console.log("初始化状态:", VectorMathWasmLib.utils.isInitialized());

// 检查 WASM 对象
console.log("WASM 对象:", VectorMathWasmLib.utils.getWasm());
```

## 📈 性能优化

1. **使用 CDN 加速**：选择离用户较近的 CDN 节点
2. **启用压缩**：在服务器端启用 gzip/brotli 压缩
3. **预加载**：在页面加载时提前初始化库
4. **内存复用**：重复使用相同大小的内存块
5. **批量操作**：尽量减少 JS⟷WASM 的调用次数

---

完成部署后，您的 WASM 库就可以在任何支持油猴脚本的浏览器中使用了！
