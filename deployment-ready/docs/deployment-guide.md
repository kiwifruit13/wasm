# HyperGPU Engine 部署指南

## 📦 文件结构

这个 `deployment-ready` 文件夹包含了所有需要上传到 GitHub 仓库 `kiwifruit13/wasm` 的文件：

```
deployment-ready/
├── core/                     # 核心库文件
│   └── hypergpu-engine.js   # 主引擎文件（完整油猴脚本）
│
├── examples/                 # 示例和测试页面
│   ├── test-environment.html
│   ├── performance-benchmark.html
│   └── verify-fallback-fix.html
│
└── docs/                     # 文档
    └── deployment-guide.md   # 本文档
```

## 🚀 上传步骤

### 步骤 1：上传到 GitHub

1. 进入您的 GitHub 仓库：`https://github.com/kiwifruit13/wasm`
2. 将 `deployment-ready` 文件夹内的所有内容上传到仓库
3. 保持文件夹结构不变

### 步骤 2：等待 CDN 生效

上传后等待 5-10 分钟，文件将通过以下 CDN 地址访问：

- **主引擎**：`https://cdn.jsdelivr.net/gh/kiwifruit13/wasm@main/core/hypergpu-engine.js`
- **测试环境**：`https://cdn.jsdelivr.net/gh/kiwifruit13/wasm@main/examples/test-environment.html`
- **性能测试**：`https://cdn.jsdelivr.net/gh/kiwifruit13/wasm@main/examples/performance-benchmark.html`

## 📋 用户使用方法

### 方法 1：直接作为油猴脚本

用户可以直接复制 `core/hypergpu-engine.js` 的内容到油猴脚本管理器中使用。

### 方法 2：通过 CDN 引用

```javascript
// ==UserScript==
// @name         My HyperGPU App
// @require      https://cdn.jsdelivr.net/gh/kiwifruit13/wasm@main/core/hypergpu-engine.js?v=2.0.0
// ==/UserScript==

window.addEventListener("HyperGpuEngineReady", async () => {
  const api = await window.HyperGpu.get();
  // 使用 API...
});
```

### 方法 3：在线测试

用户可以直接访问在线测试页面：

- `https://cdn.jsdelivr.net/gh/kiwifruit13/wasm@main/examples/test-environment.html`

## ✅ 验证部署

上传完成后，可以通过以下方式验证：

1. 访问 CDN 地址检查文件是否可访问
2. 在浏览器控制台测试 HyperGPU API
3. 运行在线测试页面验证功能

---

部署完成后，HyperGPU Engine 就可以在全球范围内通过 CDN 访问了！
