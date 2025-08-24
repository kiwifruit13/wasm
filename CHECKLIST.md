# GitHub Pages 部署检查清单

## 📋 必需文件 (Required Files)

请确保以下文件已上传到您的 GitHub 仓库根目录：

### ✅ 核心库文件

- [ ] `vector-math-wasm-lib.js` - 主库文件（非模块化，支持@require）
- [ ] `simple-wasm-math.js` - 简化 API 库文件
- [ ] `webgpu_wasm_core_bg.wasm` - WASM 二进制文件
- [ ] `index.html` - GitHub Pages 主页

### ✅ 文档文件

- [ ] `README.md` - 用户使用文档
- [ ] `DEPLOYMENT.md` - 部署指南
- [ ] `CHECKLIST.md` - 本检查清单

### ✅ 示例文件

- [ ] `example-usage.js` - 完整版使用示例
- [ ] `simple-demo.js` - 简化版使用示例
- [ ] `userscript-template.js` - 油猴脚本模板

### ✅ 测试文件

- [ ] `test-github-deployment.html` - 通用部署测试
- [ ] `test-kiwifruit13-wasm.html` - 专用测试页面

## 🔧 可选文件 (Optional Files)

### 📄 参考文件

- [ ] `020.txt` - 原始胶水文件（参考用）
- [ ] `webgpu_wasm_core.js` - 原始胶水文件（参考用）

### 🚀 部署脚本

- [ ] `deploy-to-github.sh` - Linux/macOS 部署脚本
- [ ] `deploy-to-github.bat` - Windows 部署脚本
- [ ] `update-to-jsdelivr.js` - jsDelivr 配置脚本
- [ ] `quick-jsdelivr-setup.bat` - 快速配置脚本

### 🧪 测试脚本

- [ ] `performance-test.js` - 性能测试脚本

## 📁 建议的目录结构

```
您的仓库根目录/
├── index.html                      # GitHub Pages 主页
├── vector-math-wasm-lib.js          # 主库文件
├── simple-wasm-math.js              # 简化库文件
├── webgpu_wasm_core_bg.wasm         # WASM 文件
├── README.md                        # 文档
├── DEPLOYMENT.md                    # 部署指南
├── CHECKLIST.md                     # 本文件
├── docs/                            # 文档目录（可选）
│   ├── example-usage.js
│   ├── simple-demo.js
│   └── userscript-template.js
├── tests/                           # 测试目录（可选）
│   ├── test-github-deployment.html
│   ├── test-kiwifruit13-wasm.html
│   └── performance-test.js
└── scripts/                         # 脚本目录（可选）
    ├── deploy-to-github.sh
    ├── deploy-to-github.bat
    ├── update-to-jsdelivr.js
    └── quick-jsdelivr-setup.bat
```

## 🚀 部署步骤

### 1. 上传文件

```bash
git add .
git commit -m "Deploy Vector Math WASM Library to GitHub Pages"
git push origin main
```

### 2. 配置 GitHub Pages

1. 进入仓库设置: `https://github.com/kiwifruit13/wasm/settings/pages`
2. 在 "Source" 部分选择 "Deploy from a branch"
3. 选择 `main` 分支
4. 选择 `/` (root) 目录
5. 点击 "Save"

### 3. 验证部署

访问以下 URLs 验证部署是否成功：

#### 🌐 GitHub Pages URLs

- 主页: `https://kiwifruit13.github.io/wasm/`
- 主库: `https://kiwifruit13.github.io/wasm/vector-math-wasm-lib.js`
- 简化库: `https://kiwifruit13.github.io/wasm/simple-wasm-math.js`

#### ⚡ jsDelivr CDN URLs（推荐）

- 主库: `https://cdn.jsdelivr.net/gh/kiwifruit13/wasm@main/vector-math-wasm-lib.js`
- 简化库: `https://cdn.jsdelivr.net/gh/kiwifruit13/wasm@main/simple-wasm-math.js`
- WASM: `https://cdn.jsdelivr.net/gh/kiwifruit13/wasm@main/webgpu_wasm_core_bg.wasm`

## 🧪 测试部署

### 在线测试

1. 访问 `https://kiwifruit13.github.io/wasm/test-kiwifruit13-wasm.html`
2. 点击测试按钮验证功能

### 油猴脚本测试

```javascript
// ==UserScript==
// @name         WASM Library Test
// @require      https://cdn.jsdelivr.net/gh/kiwifruit13/wasm@main/vector-math-wasm-lib.js
// @require      https://cdn.jsdelivr.net/gh/kiwifruit13/wasm@main/simple-wasm-math.js
// @grant        none
// ==/UserScript==

(async function () {
  try {
    await SimpleWasmMath.ready;
    const result = await SimpleWasmMath.vector.add(
      vec3(1, 2, 3),
      vec3(4, 5, 6)
    );
    console.log("✅ 测试成功:", SimpleWasmMath.utils.toArray(result));
  } catch (error) {
    console.error("❌ 测试失败:", error);
  }
})();
```

## ⚠️ 注意事项

### CORS 配置

GitHub Pages 自动配置正确的 CORS 头，无需额外设置。

### 缓存更新

- GitHub Pages: 通常 5-10 分钟更新
- jsDelivr CDN: 可能需要 10-30 分钟更新缓存

### 文件大小限制

- 单个文件: 最大 100MB
- 仓库总大小: 建议 < 1GB

### 版本管理

建议为稳定版本创建 Git 标签：

```bash
git tag v1.0.0
git push origin v1.0.0
```

然后可以使用版本化的 CDN 链接：
`https://cdn.jsdelivr.net/gh/kiwifruit13/wasm@v1.0.0/vector-math-wasm-lib.js`

## 🎯 完成检查

部署完成后，请验证以下项目：

- [ ] GitHub Pages 主页正常访问
- [ ] 所有 CDN 链接正常工作
- [ ] 测试页面功能正常
- [ ] 油猴脚本可以正常 require 库文件
- [ ] WASM 文件可以正常加载
- [ ] 所有示例代码运行正常

## 📞 获得帮助

如果遇到问题，请检查：

1. 文件是否正确上传
2. GitHub Pages 是否已启用
3. 网络连接是否正常
4. 浏览器是否支持 WebAssembly

---

🎉 完成所有检查项目后，您的 Vector Math WASM Library 就已经成功部署了！
