# HyperGPU Engine - 用户使用指南

## 🚀 方式 1：直接安装油猴脚本（推荐，无需等待）

### 步骤 1：安装脚本

1. 复制文件 `src/engine/hypergpu-engine.js` 的全部内容
2. 打开油猴脚本管理器（如 Tampermonkey）
3. 点击 "创建新脚本"
4. 删除默认内容，粘贴复制的代码
5. 保存脚本（Ctrl+S）

### 步骤 2：验证安装

1. 打开任意网页（如 https://example.com）
2. 按 F12 打开开发者工具
3. 在控制台中应该看到：
   ```
   🚀 HyperGPU Engine starting...
   ✅ HyperGPU Engine ready! Use window.HyperGpu to access the API.
   ```

### 步骤 3：使用 API

在任意网页的控制台中测试：

```javascript
// 获取 API
const api = await window.HyperGpu.get();

// 测试向量归一化
const result = await api.normalizeVector([3, 4, 5]);
console.log("归一化结果:", result);

// 测试矩阵乘法
const matA = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
const matB = [2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1];
const matResult = await api.multiplyMat4(matA, matB);
console.log("矩阵乘法结果:", matResult);

// 性能基准测试
const benchmark = await api.benchmark(
  "vector_normalize",
  async () => {
    await api.normalizeVector([1, 2, 3, 4, 5]);
  },
  100
);
console.log("性能测试:", benchmark);
```

## 🌐 方式 2：通过 CDN 引用（需要等待上传）

### 文件上传后，用户可以这样使用：

```javascript
// ==UserScript==
// @name         My HyperGPU App
// @version      1.0.0
// @description  使用 HyperGPU 的应用
// @match        *://*/*
// @require      https://cdn.jsdelivr.net/gh/kiwifruit13/wasm@main/core/hypergpu-engine.js?v=2.0.0
// ==/UserScript==

// 等待引擎就绪
window.addEventListener("HyperGpuEngineReady", async (event) => {
  console.log("HyperGPU Engine 就绪!", event.detail);

  // 获取 API
  const api = await window.HyperGpu.get();

  // 业务逻辑
  const result = await api.normalizeVector([1, 2, 3]);
  console.log("计算结果:", result);
});
```

## 🧪 在线测试页面

用户还可以通过在线测试页面体验功能：

### 本地测试（当前可用）

- 完整测试环境：打开 `test-environment.html`
- 性能基准测试：打开 `performance-benchmark.html`
- 回退模式验证：打开 `verify-fallback-fix.html`

### CDN 测试（上传后可用）

- 完整测试：`https://cdn.jsdelivr.net/gh/kiwifruit13/wasm@main/examples/test-environment.html`
- 性能测试：`https://cdn.jsdelivr.net/gh/kiwifruit13/wasm@main/examples/performance-benchmark.html`

## ⚡ 特性说明

### 自动环境适配

引擎会自动检测浏览器能力并选择最佳运行模式：

- `webgpu+wasm`: WebGPU + WebAssembly（最高性能）
- `webgl+wasm`: WebGL + WebAssembly（兼容性好）
- `cpu+wasm`: 纯 WebAssembly（CPU 计算）
- `pure-js`: 纯 JavaScript（兜底方案）

### 可用的 API 方法

- `normalizeVector(array)` - 向量归一化
- `multiplyMat4(matA, matB)` - 4x4 矩阵乘法
- `superResolution(imageData, width, height, newWidth, newHeight)` - 超分辨率
- `benchmark(name, testFn, iterations)` - 性能基准测试
- `batchNormalizeVectors(vectors)` - 批量向量归一化
- `getMemoryStats()` - 内存使用统计
- `getEnvironment()` - 环境信息
- `getStatus()` - 引擎状态

### 错误处理

如果某些功能不可用（如 WebGPU），引擎会自动降级到可用的实现，确保基本功能正常工作。

---

**推荐**：先使用方式 1 立即体验，方式 2 适合需要在多个项目中复用的场景。
