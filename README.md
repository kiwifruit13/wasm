# Vector Math WASM Library

一个专为油猴脚本设计的 WebAssembly 向量数学库，基于 Rust + wasm-bindgen 构建，支持高性能的向量运算、矩阵计算、图像处理和粒子模拟。

## 🚀 特性

- **向量运算**：归一化、加法、减法、数乘、点积、叉积
- **矩阵计算**：乘法、转置、行列式、逆矩阵、二次型
- **图像处理**：超分辨率、视频帧增强
- **粒子模拟**：粒子预处理和物理计算
- **内存管理**：自动内存回收和手动释放
- **油猴兼容**：完全兼容 @require 导入方式

## 📦 安装使用

### 在油猴脚本中使用

```javascript
// ==UserScript==
// @name         Your Script Name
// @require      https://cdn.jsdelivr.net/gh/kiwifruit13/wasm@main/vector-math-wasm-lib.js
// @grant        none
// ==/UserScript==

(async function () {
  "use strict";

  // 等待 WASM 库初始化
  await VectorMathWasmLib.ready;

  // 现在可以使用所有功能了！
  console.log("WASM 库已就绪");
})();
```

### 自定义 WASM 文件 URL

```javascript
// 在初始化前设置自定义 URL
VectorMathWasmLib.setWasmUrl(
  "https://cdn.jsdelivr.net/gh/kiwifruit13/wasm@main/webgpu_wasm_core_bg.wasm"
);
await VectorMathWasmLib.init();
```

## 📖 API 文档

### 初始化

```javascript
// 自动初始化（推荐）
await VectorMathWasmLib.ready;

// 手动初始化
await VectorMathWasmLib.init(
  "https://cdn.jsdelivr.net/gh/kiwifruit13/wasm@main/webgpu_wasm_core_bg.wasm"
);

// 检查初始化状态
if (VectorMathWasmLib.utils.isInitialized()) {
  console.log("库已初始化");
}
```

### 向量运算

```javascript
// 获取 WASM 内存访问
const wasm = VectorMathWasmLib.utils.getWasm();

// 创建向量数据
const vec1 = new Float32Array([1.0, 2.0, 3.0]);
const vec2 = new Float32Array([4.0, 5.0, 6.0]);
const result = new Float32Array(3);

// 分配 WASM 内存
const vec1Ptr = wasm.__wbindgen_malloc(vec1.byteLength);
const vec2Ptr = wasm.__wbindgen_malloc(vec2.byteLength);
const resultPtr = wasm.__wbindgen_malloc(result.byteLength);

try {
  // 将数据复制到 WASM 内存
  const memory = new Uint8Array(wasm.memory.buffer);
  memory.set(new Uint8Array(vec1.buffer), vec1Ptr);
  memory.set(new Uint8Array(vec2.buffer), vec2Ptr);

  // 向量加法
  VectorMathWasmLib.vector.add(vec1Ptr, vec2Ptr, resultPtr, 3);

  // 向量点积
  const dot = VectorMathWasmLib.vector.dot(vec1Ptr, vec2Ptr, 3);

  // 向量归一化
  VectorMathWasmLib.vector.normalizeGeneric(vec1Ptr, 3);

  // 3D 向量叉积
  VectorMathWasmLib.vector.cross3d(vec1Ptr, vec2Ptr, resultPtr);
} finally {
  // 释放内存
  wasm.__wbindgen_free(vec1Ptr, vec1.byteLength);
  wasm.__wbindgen_free(vec2Ptr, vec2.byteLength);
  wasm.__wbindgen_free(resultPtr, result.byteLength);
}
```

### 矩阵运算

```javascript
// 4x4 矩阵乘法
VectorMathWasmLib.matrix.multiply4x4(matAPtr, matBPtr, resultPtr);

// 矩阵转置
VectorMathWasmLib.matrix.transpose(matPtr, rows, cols, resultPtr);

// 2x2 矩阵行列式
const det = VectorMathWasmLib.matrix.det2x2(matPtr);

// 3x3 矩阵行列式
const det3 = VectorMathWasmLib.matrix.det3x3(matPtr);

// 2x2 矩阵求逆
const isInvertible = VectorMathWasmLib.matrix.inv2x2(matPtr, resultPtr);

// 二次型计算
const result = VectorMathWasmLib.matrix.quadraticForm(xPtr, aPtr, n);
```

### 图像处理

```javascript
// 超分辨率处理
const processedImage = VectorMathWasmLib.image.superResolutionBicubic(
  inputPtr,
  inWidth,
  inHeight,
  outWidth,
  outHeight
);

// 视频帧增强
const enhancedFrame = VectorMathWasmLib.image.enhanceVideoFrame(
  inputDataPtr,
  inWidth,
  inHeight,
  outWidth,
  outHeight
);

// 获取处理结果
console.log("图像数据指针:", processedImage.ptr);
console.log("图像数据长度:", processedImage.len);

// 释放图像内存
processedImage.free();
```

### 粒子处理

```javascript
// 粒子预处理
const processedParticles = VectorMathWasmLib.particles.preprocess(
  particlesPtr,
  count,
  minMass
);

// 获取处理结果
console.log("粒子数据指针:", processedParticles.ptr);
console.log("粒子数据长度:", processedParticles.len);

// 释放粒子内存
processedParticles.free();
```

## 🔧 简化 API

库还提供了一些简化的全局函数，自动处理内存管理：

```javascript
// 简化的向量加法
const result = await wasmVectorAdd(
  new Float32Array([1, 2, 3]),
  new Float32Array([4, 5, 6])
);

// 简化的向量归一化
const normalized = await wasmVectorNormalize(new Float32Array([3, 4, 0]));
```

## ⚠️ 注意事项

### 内存管理

1. **手动释放**：使用 `wasm.__wbindgen_free()` 释放分配的内存
2. **自动释放**：`ProcessedImage` 和 `ProcessedParticles` 对象支持自动垃圾回收
3. **内存泄漏**：确保在 `try...finally` 块中正确释放内存

### 性能优化

1. **批量操作**：尽量批量处理数据，减少 JS ⟷ WASM 调用次数
2. **内存复用**：重复使用相同大小的内存块
3. **数据对齐**：使用 Float32Array 等类型化数组

### 浏览器兼容性

- **WebAssembly**：需要支持 WebAssembly 的现代浏览器
- **FinalizationRegistry**：用于自动内存回收（可选功能）
- **Fetch API**：用于加载 WASM 文件

## 🛠️ 开发信息

### 技术栈

- **Rust 2021**：核心逻辑实现语言
- **wasm-bindgen 0.2.87**：Rust ⟷ JavaScript 绑定
- **web-sys**：WebGPU API 访问
- **wasm-pack**：构建工具

### 构建命令

```bash
# 构建 WASM 模块
wasm-pack build --target web

# 构建发布版本
wasm-pack build --release --target web
```

### 文件结构

```
├── vector-math-wasm-lib.js    # 主库文件（用于 @require）
├── example-usage.js           # 使用示例
├── webgpu_wasm_core_bg.wasm   # WASM 二进制文件
└── README.md                  # 本文档
```

## 📋 完整示例

```javascript
// ==UserScript==
// @name         WASM Vector Math Demo
// @require      https://cdn.jsdelivr.net/gh/kiwifruit13/wasm@main/vector-math-wasm-lib.js
// @require      https://cdn.jsdelivr.net/gh/kiwifruit13/wasm@main/simple-wasm-math.js
// @grant        none
// ==/UserScript==

(async function () {
  "use strict";

  try {
    // 等待初始化
    await VectorMathWasmLib.ready;
    console.log("WASM 库初始化完成");

    // 使用简化 API
    const vec1 = new Float32Array([3, 4, 0]);
    const vec2 = new Float32Array([1, 0, 0]);

    const sum = await wasmVectorAdd(vec1, vec2);
    const normalized = await wasmVectorNormalize(vec1);

    console.log("向量加法结果:", Array.from(sum));
    console.log("归一化结果:", Array.from(normalized));
  } catch (error) {
    console.error("错误:", error);
  }
})();
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License - 详见 LICENSE 文件

---

**注意**：您的 WASM 文件已经托管在 GitHub 上，可通过 jsDelivr CDN 访问：`https://cdn.jsdelivr.net/gh/kiwifruit13/wasm@main/webgpu_wasm_core_bg.wasm`
