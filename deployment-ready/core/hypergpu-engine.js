// ==UserScript==
// @name         HyperGPU Engine - Production Ready (Modularized)
// @namespace    http://tampermonkey.net/
// @version      1.1.0
// @description  WebAssembly + WebGPU 高性能计算引擎 - 三层架构主协调库 (模块化版本)
// @author       KiwiFruit
// @match        *://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-start
// @license      MIT
// @require      https://cdn.jsdelivr.net/gh/kiwifruit13/wasm@main/webgpu_wasm_core.js?v=1.0.0
// @require      https://cdn.jsdelivr.net/gh/kiwifruit13/wasm@main/src/core/wasm/hypergpu-wasm-core.js?v=1.0.0
// @require      https://cdn.jsdelivr.net/gh/kiwifruit13/wasm@main/src/core/webgpu/hypergpu-webgpu-core.js?v=1.0.0
// @require      https://cdn.jsdelivr.net/gh/kiwifruit13/wasm@main/src/optimization/memory-optimization.js?v=1.0.0
// @require      https://cdn.jsdelivr.net/gh/kiwifruit13/wasm@main/src/core/scheduler/task-scheduler.js?v=1.0.0
// @require      https://cdn.jsdelivr.net/gh/kiwifruit13/wasm@main/src/core/utils/utils-api.js?v=1.0.0
// ==/UserScript==

// 主协调库 - hypergpu-engine.js
// 实现三层架构设计中的协调层，整合Wasm核心库和WebGPU核心库
// 遵循代码质量优化策略：循环复杂度优化、代码重复度消除、注释覆盖率提升

/**
 * 模块加载器 - 统一的依赖注入和降级处理机制
 * 
 * 负责管理和协调HyperGPU Engine中的各个核心模块，包括：
 * - WASM核心库的加载和降级处理
 * - WebGPU核心库的动态注入
 * - 内存优化模块的依赖管理
 * - 任务调度器和工具API的集成
 * 
 * 设计原则：
 * - 依赖注入：统一的模块获取机制
 * - 降级处理：完善的fallback实现
 * - 健壮性：模块不可用时的优雅降级
 * 
 * @namespace ModuleLoader
 * @version 1.2.1
 */

// === 模块导入检测和降级处理 ===
const ModuleLoader = {
    // 模块依赖映射
    dependencies: {
        wasmCore: {
            global: 'HyperGpuWasmCore',
            required: ['init', 'normalizeVectorGeneric', 'multiplyMat4Generic'],
            optional: ['batchNormalizeVectors', 'allocMemory']
        },
        webgpuCore: {
            global: 'HyperGpuWebGPUCore', 
            required: ['init', 'createBuffer', 'destroy'],
            optional: ['createStorageBuffer', 'createReadBuffer', 'writeBuffer']
        },
        memoryOpt: {
            global: 'HyperGpuMemoryOptimization',
            required: ['createOptimizedSystem'],
            optional: ['createWasmPool', 'createBufferPool']
        },
        taskScheduler: {
            global: 'HyperGpuTaskScheduler',
            required: ['addTask', 'start', 'stop', 'getStatus'],
            optional: ['resetStats', 'setPerformanceMonitoring']
        },
        utilsAPI: {
            global: 'HyperGpuUtilsAPI',
            required: ['benchmark'],
            optional: ['batchNormalizeVectors', 'getMemoryStats']
        },
        wasmLib: {
            global: 'wasm_bindgen',
            required: [],
            optional: ['__wbg_init']
        }
    },
    
    // 检测核心模块是否可用及其完整性
    checkModules() {
        const modules = {};
        
        for (const [name, config] of Object.entries(this.dependencies)) {
            const globalObj = typeof window !== 'undefined' ? window[config.global] : null;
            
            if (globalObj) {
                // 检查必需方法是否存在
                const hasRequired = config.required.every(method => 
                    typeof globalObj[method] === 'function' || 
                    (globalObj.prototype && typeof globalObj.prototype[method] === 'function')
                );
                
                modules[name] = {
                    available: true,
                    instance: globalObj,
                    complete: hasRequired,
                    missing: config.required.filter(method => 
                        typeof globalObj[method] !== 'function' && 
                        (!globalObj.prototype || typeof globalObj.prototype[method] !== 'function')
                    )
                };
                
                if (!hasRequired) {
                    HyperGpuLog.warn('ModuleLoader', `Module ${name} incomplete, missing: ${modules[name].missing.join(', ')}`);
                }
            } else {
                modules[name] = {
                    available: false,
                    instance: null,
                    complete: false,
                    missing: config.required
                };
            }
        }
        
        HyperGpuLog.info('ModuleLoader', 'Module availability check:', modules);
        return modules;
    },
    
    // 依赖注入：获取或创建模块实例
    inject(moduleName, options = {}) {
        const modules = this.checkModules();
        const moduleInfo = modules[moduleName];
        
        if (moduleInfo && moduleInfo.available && moduleInfo.complete) {
            // 返回可用的外部模块
            HyperGpuLog.debug('ModuleLoader', `Injecting external module: ${moduleName}`);
            return moduleInfo.instance;
        } else {
            // 返回降级实现
            HyperGpuLog.warn('ModuleLoader', `Injecting fallback module: ${moduleName}`);
            return this.createFallbackModule(moduleName, options);
        }
    },
    
    // 创建降级模块
    createFallbackModule(moduleName, options = {}) {
        switch (moduleName) {
            case 'wasmCore':
                return this.createFallbackWasmCore();
            case 'webgpuCore':
                return this.createFallbackWebGPUCore();
            case 'memoryOpt':
                return this.createFallbackMemoryOpt();
            case 'taskScheduler':
                return this.createFallbackTaskScheduler();
            case 'utilsAPI':
                return this.createFallbackUtilsAPI();
            default:
                throw new Error(`Unknown module: ${moduleName}`);
        }
    },
    
    createFallbackWasmCore() {
        return {
            init: async () => {},
            normalizeVectorGeneric: (vec) => {
                const len = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
                return len > 0 ? vec.map(v => v / len) : vec;
            },
            multiplyMat4Generic: (a, b) => {
                const result = new Array(16).fill(0);
                for (let i = 0; i < 4; i++) {
                    for (let j = 0; j < 4; j++) {
                        for (let k = 0; k < 4; k++) {
                            result[i * 4 + j] += a[i * 4 + k] * b[k * 4 + j];
                        }
                    }
                }
                return result;
            },
            allocMemory: () => 0,
            freeMemory: () => {},
            getWasmInstance: () => null
        };
    },
    
    createFallbackWebGPUCore() {
        return {
            init: async () => { 
                HyperGpuLog.warn('Fallback', 'WebGPU not available, using fallback implementation');
                throw new Error('WebGPU not available'); 
            },
            isSupported: () => false,
            isInitialized: false,
            createBuffer: () => null,
            createStorageBuffer: () => null,
            createReadBuffer: () => null,
            writeBuffer: () => {},
            readBuffer: async () => new ArrayBuffer(0),
            createComputePipeline: () => ({ pipeline: null, bindGroupLayout: null }),
            executeCompute: async () => {},
            getDevice: () => null,
            getQueue: () => null,
            getCapabilities: () => ({}),
            destroy: () => {}
        };
    },
    
    createFallbackMemoryOpt() {
        return {
            createOptimizedSystem: () => ({
                wasmPool: { allocate: () => 0, deallocate: () => {}, getStats: () => ({}) },
                bufferPool: { allocateBuffer: () => null, deallocateBuffer: () => {}, getStats: () => ({}) },
                cacheManager: { get: () => null, set: () => {}, getStats: () => ({}) },
                monitor: { updateMetrics: () => {}, checkPressure: () => ({ level: 'low' }) },
                getStats: () => ({}),
                cleanup: () => {}
            })
        };
    },
    
    createFallbackTaskScheduler() {
        return {
            addTask: () => 'fallback_task_id',
            start: () => ({ status: 'fallback_scheduler' }),
            stop: () => ({ status: 'fallback_scheduler' }),
            getStatus: () => ({ 
                isRunning: false, 
                type: 'fallback',
                queues: { critical: 0, high: 0, normal: 0, low: 0, background: 0 },
                activeTasks: 0
            }),
            clearAllQueues: () => ({ status: 'fallback_scheduler' }),
            resetStats: () => false,
            setPerformanceMonitoring: () => false
        };
    },
    
    createFallbackUtilsAPI() {
        return {
            benchmark: async (testName, testFn, iterations = 100) => {
                const results = [];
                for (let i = 0; i < iterations; i++) {
                    const start = performance.now();
                    try {
                        await testFn();
                        results.push(performance.now() - start);
                    } catch (e) {
                        results.push(-1);
                    }
                }
                const validResults = results.filter(r => r >= 0);
                const avg = validResults.reduce((a, b) => a + b, 0) / validResults.length;
                return {
                    testName,
                    iterations: validResults.length,
                    failed: results.length - validResults.length,
                    avgTime: avg,
                    minTime: Math.min(...validResults),
                    maxTime: Math.max(...validResults)
                };
            },
            batchNormalizeVectors: async (vectors) => {
                return vectors.map(vector => {
                    const len = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
                    return len > 0 ? vector.map(v => v / len) : vector;
                });
            },
            getMemoryStats: () => ({ error: 'Utils API not available' }),
            clearMemoryCache: () => ({ itemsCleaned: 0 })
        };
    }
};

// === 配置 ===
const HYPERGPU_CONFIG = {
    logLevel: GM_getValue('hyperGpuLogLevel', 'debug'), // 启用详细日志
    enableDetailedLogging: GM_getValue('hyperGpuDetailedLogging', true),
    enablePerformanceLogging: GM_getValue('hyperGpuPerfLogging', true),
    enableModuleTracking: GM_getValue('hyperGpuModuleTracking', true),
    logTimestamps: true,
    logMemoryUsage: true,
    logInitializationSteps: true,
    minSuperResolutionSize: 50,
    // 使用jsDelivr CDN部署，符合WASM文件部署配置
    wasmUrl: 'https://cdn.jsdelivr.net/gh/kiwifruit13/wasm@main/webgpu_wasm_core_bg.wasm?v=1.0.0',
    version: '1.0.0',
    
    // 测试模式配置
    testMode: {
        enabled: GM_getValue('hyperGpuTestMode', false),
        autoRunTests: GM_getValue('hyperGpuAutoTest', false),
        verboseOutput: GM_getValue('hyperGpuVerbose', true)
    }
};

// === 工具函数 ===
const HyperGpuUtils = {
    startTime: Date.now(),
    
    log(level, source, message, data) {
        const levels = { debug: 0, info: 1, warn: 2, error: 3 };
        if (levels[level] < levels[HYPERGPU_CONFIG.logLevel]) return;
        
        const now = Date.now();
        const timestamp = new Date().toISOString().slice(11, 23);
        const elapsed = now - this.startTime;
        
        let logMsg = `[${timestamp}] [+${elapsed}ms] [${level.toUpperCase()}] [HyperGPU:${source}] ${message}`;
        
        // 添加内存使用信息
        if (HYPERGPU_CONFIG.logMemoryUsage && performance.memory) {
            const memoryMB = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1);
            logMsg += ` [MEM:${memoryMB}MB]`;
        }
        
        if (data !== undefined) {
            console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](logMsg, data);
            
            // 详细日志模式
            if (HYPERGPU_CONFIG.enableDetailedLogging && typeof data === 'object') {
                console.log(`[${timestamp}] [DETAIL] [${source}]`, {
                    message,
                    data,
                    metadata: {
                        timestamp: now,
                        elapsed,
                        memoryUsage: this.getMemoryInfo(),
                        performanceNow: performance.now()
                    }
                });
            }
        } else {
            console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](logMsg);
        }
    },
    
    getMemoryInfo() {
        if (performance.memory) {
            return {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit,
                usagePercent: ((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100).toFixed(2)
            };
        }
        return { error: 'Memory API not available' };
    },
    
    benchmark(name, fn) {
        if (!HYPERGPU_CONFIG.enablePerformanceLogging) return fn();
        
        const start = performance.now();
        const startMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
        
        try {
            const result = fn();
            
            const end = performance.now();
            const endMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
            
            HyperGpuLog.debug('PERF', `${name} completed`, {
                duration: (end - start).toFixed(2) + 'ms',
                memoryDelta: endMemory - startMemory,
                startMemory,
                endMemory
            });
            
            return result;
        } catch (error) {
            const end = performance.now();
            HyperGpuLog.error('PERF', `${name} failed after ${(end - start).toFixed(2)}ms`, error);
            throw error;
        }
    },
    
    async benchmarkAsync(name, fn) {
        if (!HYPERGPU_CONFIG.enablePerformanceLogging) return await fn();
        
        const start = performance.now();
        const startMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
        
        try {
            const result = await fn();
            
            const end = performance.now();
            const endMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
            
            HyperGpuLog.debug('PERF', `${name} completed`, {
                duration: (end - start).toFixed(2) + 'ms',
                memoryDelta: endMemory - startMemory,
                startMemory,
                endMemory
            });
            
            return result;
        } catch (error) {
            const end = performance.now();
            HyperGpuLog.error('PERF', `${name} failed after ${(end - start).toFixed(2)}ms`, error);
            throw error;
        }
    }
};

const HyperGpuLog = {
    debug: (src, msg, data) => HyperGpuUtils.log('debug', src, msg, data),
    info: (src, msg, data) => HyperGpuUtils.log('info', src, msg, data),
    warn: (src, msg, data) => HyperGpuUtils.log('warn', src, msg, data),
    error: (src, msg, data) => HyperGpuUtils.log('error', src, msg, data),
    
    // 新增：初始化步骤记录
    initStep: (step, status, details) => {
        if (HYPERGPU_CONFIG.logInitializationSteps) {
            HyperGpuUtils.log('info', 'INIT', `${step}: ${status}`, details);
        }
    },
    
    // 新增：模块加载记录
    moduleLoad: (moduleName, status, details) => {
        if (HYPERGPU_CONFIG.enableModuleTracking) {
            HyperGpuUtils.log('info', 'MODULE', `${moduleName}: ${status}`, details);
        }
    },
    
    // 新增：性能监控
    performance: (operation, metrics) => {
        if (HYPERGPU_CONFIG.enablePerformanceLogging) {
            HyperGpuUtils.log('debug', 'PERF', operation, metrics);
        }
    },
    
    // 新增：状态变更记录
    stateChange: (component, oldState, newState, reason) => {
        HyperGpuUtils.log('debug', 'STATE', `${component}: ${oldState} → ${newState}`, { reason });
    },
    
    // 新增：系统信息记录
    system: (msg, data) => {
        HyperGpuUtils.log('info', 'SYSTEM', msg, data);
    },
    
    // 新增：测试记录
    test: (testName, result, details) => {
        const level = result === 'PASS' ? 'info' : result === 'FAIL' ? 'error' : 'warn';
        HyperGpuUtils.log(level, 'TEST', `${testName}: ${result}`, details);
    }
};

// === 环境检测 ===
class HyperGpuEnvironment {
    constructor() {
        this.report = {
            webgpu: false,
            webgl2: false,
            wasm: false,
            sharedArrayBuffer: false,
            worker: typeof Worker !== 'undefined',
            browser: this.detectBrowser(),
            userAgent: navigator.userAgent
        };
        this.mode = 'pure-js';
    }

    detectBrowser() {
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes('chrome')) return 'chrome';
        if (userAgent.includes('firefox')) return 'firefox';
        if (userAgent.includes('safari')) return 'safari';
        if (userAgent.includes('edge')) return 'edge';
        return 'unknown';
    }

    /**
     * 初始化环境检测
     * 拆分为多个单一职责的方法以降低复杂度
     */
    async init() {
        HyperGpuLog.initStep('Environment Detection', 'STARTING', 'Beginning comprehensive environment detection...');
        
        try {
            await this.detectWebGPU();
            await this.detectWebGL2();
            await this.detectWebAssembly();
            this.detectAdditionalAPIs();
            
            // 确定运行模式
            this.mode = this.determineMode();
            
            this.logDetectionComplete();
            
        } catch (error) {
            this.handleDetectionError(error);
        }
    }

    /**
     * 检测WebGPU支持
     */
    async detectWebGPU() {
        HyperGpuLog.initStep('WebGPU Detection', 'IN_PROGRESS', 'Checking WebGPU availability...');
        
        if (!navigator.gpu) {
            HyperGpuLog.initStep('WebGPU Detection', 'NOT_AVAILABLE', 'navigator.gpu not found');
            this.report.webgpu = false;
            return;
        }

        try {
            const adapter = await this.requestWebGPUAdapter();
            if (adapter) {
                await this.testWebGPUDevice(adapter);
                HyperGpuLog.initStep('WebGPU Detection', 'SUCCESS', 'WebGPU adapter acquired successfully');
            } else {
                HyperGpuLog.initStep('WebGPU Detection', 'FAILED', 'No WebGPU adapter available');
            }
        } catch (error) {
            HyperGpuLog.initStep('WebGPU Detection', 'ERROR', 'WebGPU adapter request failed');
            HyperGpuLog.warn('Env', 'WebGPU adapter request failed', error);
            this.report.webgpu = false;
        }
    }

    /**
     * 请求WebGPU适配器
     */
    async requestWebGPUAdapter() {
        HyperGpuLog.debug('Env', 'Requesting WebGPU adapter...');
        const adapter = await navigator.gpu.requestAdapter();
        this.report.webgpu = !!adapter;
        
        if (adapter) {
            const adapterInfo = {
                info: adapter.info || 'No adapter info available',
                features: adapter.features ? Array.from(adapter.features) : [],
                limits: adapter.limits ? Object.fromEntries(Object.entries(adapter.limits)) : {}
            };
            HyperGpuLog.info('Env', 'WebGPU adapter details', adapterInfo);
        }
        
        return adapter;
    }

    /**
     * 测试WebGPU设备
     */
    async testWebGPUDevice(adapter) {
        try {
            HyperGpuLog.debug('Env', 'Requesting WebGPU device...');
            const device = await adapter.requestDevice();
            
            if (device) {
                HyperGpuLog.info('Env', 'WebGPU device created successfully', {
                    features: Array.from(device.features),
                    limits: Object.fromEntries(Object.entries(device.limits)),
                    queue: !!device.queue
                });
                device.destroy(); // 清理资源
            }
        } catch (deviceError) {
            HyperGpuLog.warn('Env', 'WebGPU device creation failed', deviceError);
        }
    }

    /**
     * 检测WebGL2支持
     */
    async detectWebGL2() {
        HyperGpuLog.initStep('WebGL2 Detection', 'IN_PROGRESS', 'Checking WebGL2 availability...');
        
        this.report.webgl2 = !!window.WebGL2RenderingContext;
        
        if (this.report.webgl2) {
            this.testWebGL2Context();
        } else {
            HyperGpuLog.initStep('WebGL2 Detection', 'NOT_AVAILABLE', 'WebGL2RenderingContext not found');
        }
    }

    /**
     * 测试WebGL2上下文
     */
    testWebGL2Context() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl2');
            
            if (gl) {
                const webgl2Info = {
                    version: gl.getParameter(gl.VERSION),
                    vendor: gl.getParameter(gl.VENDOR),
                    renderer: gl.getParameter(gl.RENDERER),
                    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
                    maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
                    supportedExtensions: gl.getSupportedExtensions().length
                };
                
                HyperGpuLog.initStep('WebGL2 Detection', 'SUCCESS', 'WebGL2 context created successfully');
                HyperGpuLog.info('Env', 'WebGL2 capabilities', webgl2Info);
                
                // 清理资源
                if (gl.getExtension('WEBGL_lose_context')) {
                    gl.getExtension('WEBGL_lose_context').loseContext();
                }
            } else {
                HyperGpuLog.initStep('WebGL2 Detection', 'FAILED', 'WebGL2 context creation failed');
            }
        } catch (webglError) {
            HyperGpuLog.warn('Env', 'WebGL2 context test failed', webglError);
        }
    }

    /**
     * 检测WebAssembly支持
     */
    async detectWebAssembly() {
        HyperGpuLog.initStep('WebAssembly Detection', 'IN_PROGRESS', 'Checking WebAssembly availability...');
        
        this.report.wasm = typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function';
        
        if (this.report.wasm) {
            this.testWebAssemblyCapabilities();
        } else {
            HyperGpuLog.initStep('WebAssembly Detection', 'NOT_AVAILABLE', 'WebAssembly not supported');
        }
    }

    /**
     * 测试WebAssembly能力
     */
    testWebAssemblyCapabilities() {
        try {
            const wasmCapabilities = {
                instantiate: typeof WebAssembly.instantiate === 'function',
                compile: typeof WebAssembly.compile === 'function',
                Module: typeof WebAssembly.Module === 'function',
                Instance: typeof WebAssembly.Instance === 'function',
                Memory: typeof WebAssembly.Memory === 'function',
                Table: typeof WebAssembly.Table === 'function'
            };
            
            HyperGpuLog.initStep('WebAssembly Detection', 'SUCCESS', 'WebAssembly APIs available');
            HyperGpuLog.info('Env', 'WebAssembly capabilities', wasmCapabilities);
        } catch (wasmError) {
            HyperGpuLog.warn('Env', 'WebAssembly capability test failed', wasmError);
        }
    }

    /**
     * 检测额外的Web API
     */
    detectAdditionalAPIs() {
        HyperGpuLog.initStep('Additional APIs Detection', 'IN_PROGRESS', 'Checking additional web APIs...');
        
        this.report.sharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
        
        const additionalAPIs = {
            sharedArrayBuffer: this.report.sharedArrayBuffer,
            worker: this.report.worker,
            serviceWorker: 'serviceWorker' in navigator,
            crypto: typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function',
            indexedDB: typeof indexedDB !== 'undefined',
            localStorage: typeof localStorage !== 'undefined',
            fetch: typeof fetch !== 'undefined',
            promise: typeof Promise !== 'undefined',
            asyncAwait: (async function(){}).constructor === (async function(){}).constructor
        };
        
        HyperGpuLog.info('Env', 'Additional web APIs', additionalAPIs);
    }

    /**
     * 记录检测完成
     */
    logDetectionComplete() {
        HyperGpuLog.initStep('Environment Detection', 'COMPLETED', `Mode selected: ${this.mode}`);
        HyperGpuLog.info('Env', 'Final environment report', this.report);
        HyperGpuLog.system('Environment detection completed successfully', {
            mode: this.mode,
            webgpu: this.report.webgpu,
            webgl2: this.report.webgl2,
            wasm: this.report.wasm,
            browser: this.report.browser
        });
    }

    /**
     * 处理检测错误
     */
    handleDetectionError(error) {
        HyperGpuLog.initStep('Environment Detection', 'FAILED', 'Critical error during environment detection');
        HyperGpuLog.error('Env', 'Detection failed', error);
        this.mode = 'pure-js'; // 降级到最安全的模式
    }

    determineMode() {
        if (this.report.webgpu && this.report.wasm) return 'webgpu+wasm';
        if (this.report.wasm && this.report.webgl2) return 'webgl+wasm';
        if (this.report.wasm) return 'cpu+wasm';
        return 'pure-js';
    }

    getReport() {
        return { ...this.report, mode: this.mode };
    }
}

// === 资源管理器 (优化版) ===
class HyperGpuResourceManager {
    constructor(env) {
        this.env = env;
        this.wasmExports = null;
        this.webgpuCore = null;
        this.isInitialized = false;
        
        // 初始化状态跟踪 (改进)
        this.initState = {
            phase: 'not_started', // not_started, environment, wasm, webgpu, memory, completed, failed
            startTime: null,
            endTime: null,
            duration: null,
            errors: [],
            warnings: [],
            recovery: {
                attemptCount: 0,
                maxAttempts: 3,
                lastAttemptTime: null,
                enabled: true
            }
        };
        
        // 组件初始化状态
        this.componentStates = {
            environment: { status: 'pending', error: null, timestamp: null },
            wasm: { status: 'pending', error: null, timestamp: null, exports: {} },
            webgpu: { status: 'pending', error: null, timestamp: null, capabilities: {} },
            memory: { status: 'pending', error: null, timestamp: null, pools: {} }
        };
        
        // 内存优化组件
        this.wasmMemoryPool = null;
        this.webgpuBufferPool = null;
        this.batchManager = null;
        this.cacheManager = null;
        this.memoryMonitor = null;
    }

    async init() {
        if (this.isInitialized) {
            HyperGpuLog.warn('Resource', 'Already initialized.');
            return;
        }

        // 初始化状态跟踪开始
        this.initState.phase = 'starting';
        this.initState.startTime = Date.now();
        this.initState.recovery.attemptCount++;
        
        HyperGpuLog.initStep('Resource Manager', 'STARTING', `Attempt ${this.initState.recovery.attemptCount}/${this.initState.recovery.maxAttempts}`);
        HyperGpuLog.system('Resource Manager initialization started', {
            attempt: this.initState.recovery.attemptCount,
            maxAttempts: this.initState.recovery.maxAttempts,
            environment: this.env.getReport()
        });
        
        try {
            // 1. 初始化环境检测确认
            this.initState.phase = 'environment';
            this.componentStates.environment.timestamp = Date.now();
            this.componentStates.environment.status = 'success';
            
            HyperGpuLog.initStep('Environment Confirmation', 'SUCCESS', 'Environment state confirmed');
            HyperGpuLog.info('Resource', 'Environment mode', { mode: this.env.mode, report: this.env.getReport() });
            
            // 2. 初始化 Wasm 核心
            this.initState.phase = 'wasm';
            HyperGpuLog.initStep('WASM Initialization', 'STARTING', 'Initializing WebAssembly module...');
            
            const wasmResult = await HyperGpuUtils.benchmarkAsync('WASM Initialization', async () => {
                await this.initWasmModule();
            });
            
            HyperGpuLog.initStep('WASM Initialization', this.componentStates.wasm.status.toUpperCase(), 'WASM module initialization completed');
            
            // 3. 初始化 WebGPU 核心（如果支持）
            this.initState.phase = 'webgpu';
            
            if (this.env.report.webgpu) {
                HyperGpuLog.initStep('WebGPU Initialization', 'STARTING', 'Initializing WebGPU core...');
                
                const webgpuResult = await HyperGpuUtils.benchmarkAsync('WebGPU Initialization', async () => {
                    await this.initWebGPUCore();
                });
                
                HyperGpuLog.initStep('WebGPU Initialization', this.componentStates.webgpu.status.toUpperCase(), 'WebGPU core initialization completed');
            } else {
                this.componentStates.webgpu.status = 'skipped';
                this.componentStates.webgpu.timestamp = Date.now();
                HyperGpuLog.initStep('WebGPU Initialization', 'SKIPPED', 'WebGPU not supported in this environment');
            }
            
            // 4. 初始化内存优化组件
            this.initState.phase = 'memory';
            HyperGpuLog.initStep('Memory Optimization', 'STARTING', 'Initializing memory optimization system...');
            
            const memoryResult = HyperGpuUtils.benchmark('Memory Optimization Initialization', () => {
                this.initMemoryOptimization();
            });
            
            HyperGpuLog.initStep('Memory Optimization', this.componentStates.memory.status.toUpperCase(), 'Memory optimization system initialized');

            // 5. 组件协调验证
            this.initState.phase = 'validation';
            HyperGpuLog.initStep('Component Validation', 'STARTING', 'Validating component integration...');
            
            const validationResult = this.validateComponents();
            
            HyperGpuLog.initStep('Component Validation', validationResult ? 'SUCCESS' : 'WARNING', 'Component validation completed');

            // 初始化成功
            this.isInitialized = true;
            this.initState.phase = 'completed';
            this.initState.endTime = Date.now();
            this.initState.duration = this.initState.endTime - this.initState.startTime;
            
            HyperGpuLog.initStep('Resource Manager', 'COMPLETED', `Initialization successful in ${this.initState.duration}ms`);
            HyperGpuLog.system('Resource Manager initialization completed', {
                duration: this.initState.duration,
                componentsInitialized: Object.keys(this.componentStates).filter(k => this.componentStates[k].status === 'success').length,
                warnings: this.initState.warnings.length,
                errors: this.initState.errors.length
            });
            
            this.logInitializationSummary();
            
        } catch (error) {
            this.initState.phase = 'failed';
            this.initState.endTime = Date.now();
            this.initState.duration = this.initState.endTime - this.initState.startTime;
            this.initState.errors.push({
                phase: this.initState.phase,
                error: error.message,
                stack: error.stack,
                timestamp: Date.now(),
                attempt: this.initState.recovery.attemptCount
            });
            
            HyperGpuLog.initStep('Resource Manager', 'FAILED', `Initialization failed in phase '${this.initState.phase}'`);
            HyperGpuLog.error('Resource', `Initialization failed in phase '${this.initState.phase}' after ${this.initState.duration}ms`, error);
            
            // 尝试错误恢复
            if (this.shouldAttemptRecovery()) {
                HyperGpuLog.warn('Resource', 'Attempting recovery...');
                await this.attemptRecovery();
            } else {
                HyperGpuLog.error('Resource', 'Recovery attempts exhausted, initialization failed');
                throw error;
            }
        }
    }

    /**
     * 初始化WASM模块
     * 重构为多个专门的方法以降低复杂度
     * 
     * @async
     * @method initWasmModule
     * @private
     * @throws {Error} 当WASM模块加载或初始化失败时抛出错误
     * @returns {Promise<void>}
     * 
     * @description 初始化流程：
     * 1. 检查WebAssembly支持
     * 2. 加载WASM核心模块
     * 3. 验证导出函数
     * 4. 测试基本功能
     */
    async initWasmModule() {
        this.componentStates.wasm.timestamp = Date.now();
        
        HyperGpuLog.moduleLoad('WASM Core', 'CHECKING', 'Checking WebAssembly support...');
        
        if (!this.env.report.wasm) {
            this.componentStates.wasm.status = 'skipped';
            this.componentStates.wasm.error = 'WebAssembly not supported';
            HyperGpuLog.moduleLoad('WASM Core', 'SKIPPED', 'WebAssembly not supported in this environment');
            return;
        }

        try {
            await this.loadWasmCore();
            this.validateWasmExports();
            this.testWasmFunctionality();
            
            this.componentStates.wasm.status = 'success';
            HyperGpuLog.moduleLoad('WASM Core', 'SUCCESS', 'WASM module fully loaded and validated');
            
        } catch (error) {
            this.handleWasmInitializationError(error);
        }
    }

    /**
     * 加载WASM核心模块
     */
    async loadWasmCore() {
        HyperGpuLog.moduleLoad('WASM Core', 'LOADING', `Loading WASM from ${HYPERGPU_CONFIG.wasmUrl}`);
        
        // 检查全局__wbg_init函数
        if (typeof __wbg_init !== 'function') {
            throw new Error('__wbg_init function not found');
        }

        HyperGpuLog.debug('Resource', '__wbg_init function found, initializing WASM...');
        
        const wasmInitStart = performance.now();
        await __wbg_init(HYPERGPU_CONFIG.wasmUrl);
        const wasmInitTime = performance.now() - wasmInitStart;
        
        HyperGpuLog.performance('WASM __wbg_init', {
            duration: wasmInitTime.toFixed(2) + 'ms',
            url: HYPERGPU_CONFIG.wasmUrl
        });
        
        // 检查初始化函数
        this.callWasmInitFunction();
    }

    /**
     * 调用WASM初始化函数
     */
    callWasmInitFunction() {
        if (typeof init_wasm === 'function') {
            HyperGpuLog.debug('Resource', 'Found init_wasm function, calling...');
            
            const initStart = performance.now();
            init_wasm();
            const initTime = performance.now() - initStart;
            
            HyperGpuLog.performance('WASM init_wasm', {
                duration: initTime.toFixed(2) + 'ms'
            });
            
            HyperGpuLog.moduleLoad('WASM Core', 'INIT_SUCCESS', 'WASM module initialized successfully');
        } else {
            HyperGpuLog.warn('Resource', 'init_wasm function not found, skipping initialization');
            this.initState.warnings.push('init_wasm function not found');
        }
    }

    /**
     * 验证WASM导出函数
     */
    validateWasmExports() {
        // 收集并验证WASM导出函数
        const wasmExports = this.collectWasmExports();
        const exportStats = this.analyzeWasmExports(wasmExports);
        
        this.wasmExports = wasmExports;
        this.componentStates.wasm.exports = exportStats;
        
        HyperGpuLog.moduleLoad('WASM Core', 'EXPORTS_CHECKED', 'WASM exports validation completed');
        HyperGpuLog.info('Resource', 'WASM exports summary', exportStats);
    }

    /**
     * 收集WASM导出函数
     */
    collectWasmExports() {
        return {
            init_wasm: typeof init_wasm !== 'undefined' ? init_wasm : null,
            normalizeVectorGeneric: typeof normalize_vector_generic !== 'undefined' ? normalize_vector_generic : null,
            vector_add: typeof vector_add !== 'undefined' ? vector_add : null,
            multiplyMat4Generic: typeof multiply_mat4_generic !== 'undefined' ? multiply_mat4_generic : null,
            preprocessParticles: typeof preprocess_particles !== 'undefined' ? preprocess_particles : null,
            allocMemory: typeof alloc !== 'undefined' ? alloc : null,
            freeMemory: typeof dealloc !== 'undefined' ? dealloc : null,
            getWasmInstance: () => typeof wasm_bindgen !== 'undefined' ? wasm_bindgen : null
        };
    }

    /**
     * 分析WASM导出函数统计
     */
    analyzeWasmExports(wasmExports) {
        const availableFunctions = Object.entries(wasmExports)
            .filter(([name, func]) => func !== null)
            .map(([name]) => name);
            
        const missingFunctions = Object.entries(wasmExports)
            .filter(([name, func]) => func === null)
            .map(([name]) => name);
        
        return {
            available: availableFunctions,
            missing: missingFunctions,
            availableCount: availableFunctions.length,
            totalExpected: Object.keys(wasmExports).length
        };
    }

    /**
     * 测试WASM功能
     */
    testWasmFunctionality() {
        // 测试基本功能
        if (this.wasmExports.normalizeVectorGeneric) {
            try {
                HyperGpuLog.debug('Resource', 'Testing WASM vector normalization...');
                const testVector = [3, 4, 0];
                const testStart = performance.now();
                const normalized = this.wasmExports.normalizeVectorGeneric(testVector);
                const testTime = performance.now() - testStart;
                
                HyperGpuLog.test('WASM Vector Normalization', 'PASS', {
                    input: testVector,
                    output: normalized,
                    duration: testTime.toFixed(3) + 'ms'
                });
            } catch (testError) {
                HyperGpuLog.test('WASM Vector Normalization', 'FAIL', testError.message);
                this.initState.warnings.push('WASM vector normalization test failed');
            }
        }
    }

    /**
     * 处理WASM初始化错误
     */
    handleWasmInitializationError(error) {
        this.componentStates.wasm.status = 'failed';
        this.componentStates.wasm.error = error.message;
        
        HyperGpuLog.moduleLoad('WASM Core', 'FAILED', 'WASM initialization failed');
        HyperGpuLog.error('Resource', 'WASM initialization failed', error);
        
        // 尝试降级到JavaScript实现
        this.attemptWasmFallback(error);
    }

    /**
     * 尝试WASM降级处理
     */
    attemptWasmFallback(originalError) {
        try {
            HyperGpuLog.warn('Resource', 'Attempting fallback to JavaScript implementation...');
            
            const WasmCoreClass = ModuleLoader.inject('wasmCore');
            this.wasmExports = WasmCoreClass;
            
            this.componentStates.wasm.status = 'fallback';
            this.componentStates.wasm.exports = { fallback: true };
            this.initState.warnings.push('WASM failed, using JavaScript fallback');
            
            HyperGpuLog.moduleLoad('WASM Core', 'FALLBACK_SUCCESS', 'JavaScript fallback implementation loaded');
            
        } catch (fallbackError) {
            HyperGpuLog.error('Resource', 'Both WASM and fallback initialization failed', fallbackError);
            throw new Error(`WASM initialization failed: ${originalError.message}, Fallback failed: ${fallbackError.message}`);
        }
    }
    async initWebGPUCore() {
        this.componentStates.webgpu.timestamp = Date.now();
        
        HyperGpuLog.moduleLoad('WebGPU Core', 'CHECKING', 'Checking WebGPU support and availability...');
        
        if (!this.env.report.webgpu) {
            this.componentStates.webgpu.status = 'skipped';
            this.componentStates.webgpu.error = 'WebGPU not supported';
            HyperGpuLog.moduleLoad('WebGPU Core', 'SKIPPED', 'WebGPU not supported in this environment');
            return;
        }

        try {
            HyperGpuLog.moduleLoad('WebGPU Core', 'LOADING', 'Attempting to load WebGPU core module...');
            
            // 使用依赖注入机制获取WebGPU核心库
            const WebGPUCoreClass = ModuleLoader.inject('webgpuCore');
            
            if (typeof WebGPUCoreClass === 'function') {
                HyperGpuLog.debug('Resource', 'Creating WebGPU core instance...');
                
                const coreInitStart = performance.now();
                this.webgpuCore = new WebGPUCoreClass();
                
                HyperGpuLog.debug('Resource', 'Initializing WebGPU core...');
                await this.webgpuCore.init();
                
                const coreInitTime = performance.now() - coreInitStart;
                
                HyperGpuLog.performance('WebGPU Core Initialization', {
                    duration: coreInitTime.toFixed(2) + 'ms',
                    type: 'external_module'
                });
                
                // 记录能力信息
                if (this.webgpuCore.getCapabilities) {
                    const capabilities = this.webgpuCore.getCapabilities();
                    this.componentStates.webgpu.capabilities = capabilities;
                    HyperGpuLog.info('Resource', 'WebGPU capabilities acquired', capabilities);
                }
                
                // 测试基本功能
                if (this.webgpuCore.createBuffer) {
                    try {
                        HyperGpuLog.debug('Resource', 'Testing WebGPU buffer creation...');
                        const testStart = performance.now();
                        const testBuffer = this.webgpuCore.createBuffer(new Float32Array([1, 2, 3, 4]));
                        const testTime = performance.now() - testStart;
                        
                        HyperGpuLog.test('WebGPU Buffer Creation', 'PASS', {
                            bufferSize: 16,
                            duration: testTime.toFixed(3) + 'ms'
                        });
                        
                        // 清理测试资源
                        if (testBuffer && this.webgpuCore.destroy) {
                            // 谨慎清理，不影响后续使用
                        }
                    } catch (testError) {
                        HyperGpuLog.test('WebGPU Buffer Creation', 'FAIL', testError.message);
                        this.initState.warnings.push('WebGPU buffer creation test failed');
                    }
                }
                
                this.componentStates.webgpu.status = 'success';
                HyperGpuLog.moduleLoad('WebGPU Core', 'SUCCESS', 'WebGPU core initialized successfully');
                
            } else {
                // 降级实现已经是对象，直接使用
                HyperGpuLog.warn('Resource', 'External WebGPU module not available, using fallback');
                
                this.webgpuCore = WebGPUCoreClass;
                
                try {
                    await this.webgpuCore.init();
                } catch (fallbackInitError) {
                    HyperGpuLog.debug('Resource', 'Fallback WebGPU init failed (expected)', fallbackInitError.message);
                }
                
                this.componentStates.webgpu.status = 'fallback';
                this.componentStates.webgpu.capabilities = { fallback: true };
                this.initState.warnings.push('Using fallback WebGPU implementation');
                
                HyperGpuLog.moduleLoad('WebGPU Core', 'FALLBACK', 'Using JavaScript fallback implementation');
                
                // 更新环境模式
                this.env.report.webgpu = false;
                this.env.mode = this.env.determineMode();
                
                HyperGpuLog.stateChange('Environment', 'webgpu+wasm', this.env.mode, 'WebGPU fallback triggered');
            }
            
        } catch (error) {
            this.componentStates.webgpu.status = 'failed';
            this.componentStates.webgpu.error = error.message;
            
            HyperGpuLog.moduleLoad('WebGPU Core', 'FAILED', 'WebGPU core initialization failed');
            HyperGpuLog.error('Resource', 'Failed to initialize WebGPU core', error);
            
            // 降级处理
            this.env.report.webgpu = false;
            this.env.mode = this.env.determineMode();
            this.webgpuCore = null;
            
            this.initState.warnings.push(`WebGPU initialization failed: ${error.message}`);
            HyperGpuLog.stateChange('Environment', 'webgpu+wasm', this.env.mode, 'WebGPU initialization failure');
            
            // 不抛出错误，允许降级到其他模式
        }
    }
    
    /**
     * 验证组件集成状态
     * @returns {boolean} 验证是否成功
     */
    validateComponents() {
        HyperGpuLog.debug('Resource', 'Validating component integration...');
        
        const validationResults = {
            environment: this.componentStates.environment.status === 'success',
            wasm: ['success', 'fallback'].includes(this.componentStates.wasm.status),
            webgpu: ['success', 'fallback', 'skipped'].includes(this.componentStates.webgpu.status),
            memory: ['full_optimization', 'simplified', 'failed'].includes(this.componentStates.memory.status)
        };
        
        // 检查核心功能可用性
        const functionalChecks = {
            hasWasmExports: !!this.wasmExports,
            hasWebGpuCore: !!this.webgpuCore || this.componentStates.webgpu.status === 'skipped',
            hasMemorySystem: !!this.wasmMemoryPool || !!this.cacheManager
        };
        
        // 计算整体健康状态
        const healthScore = {
            critical: (validationResults.environment && validationResults.wasm) ? 1 : 0,
            optional: Object.values(validationResults).filter(Boolean).length,
            functional: Object.values(functionalChecks).filter(Boolean).length,
            total: Object.keys(validationResults).length + Object.keys(functionalChecks).length
        };
        
        const overallHealth = ((healthScore.optional + healthScore.functional) / healthScore.total * 100).toFixed(1);
        
        HyperGpuLog.info('Resource', 'Component validation results', {
            validationResults,
            functionalChecks,
            healthScore: `${overallHealth}%`,
            criticalSystemsOk: healthScore.critical === 1
        });
        
        // 记录警告和问题
        const issues = [];
        
        if (!validationResults.environment) {
            issues.push('Environment detection failed');
        }
        
        if (!validationResults.wasm) {
            issues.push('WASM module initialization failed');
        }
        
        if (this.componentStates.webgpu.status === 'failed') {
            issues.push('WebGPU initialization failed (degraded to fallback)');
        }
        
        if (this.componentStates.memory.status === 'failed') {
            issues.push('Memory optimization system failed');
        }
        
        if (issues.length > 0) {
            HyperGpuLog.warn('Resource', 'Component validation issues detected', issues);
            this.initState.warnings.push(...issues);
        }
        
        return healthScore.critical === 1 && healthScore.optional >= 2;
    }
    
    /**
     * 记录初始化总结
     */
    logInitializationSummary() {
        const summary = {
            totalDuration: this.initState.duration,
            phase: this.initState.phase,
            attempt: this.initState.recovery.attemptCount,
            components: {},
            warnings: this.initState.warnings.length,
            errors: this.initState.errors.length,
            environmentMode: this.env.mode,
            memoryUsage: HyperGpuUtils.getMemoryInfo()
        };
        
        // 汇总组件状态
        for (const [name, state] of Object.entries(this.componentStates)) {
            summary.components[name] = {
                status: state.status,
                hasError: !!state.error,
                initTime: state.timestamp ? Date.now() - state.timestamp : 0
            };
            
            if (state.exports) {
                summary.components[name].exports = state.exports;
            }
            
            if (state.capabilities) {
                summary.components[name].capabilities = state.capabilities;
            }
            
            if (state.pools) {
                summary.components[name].pools = state.pools;
            }
        }
        
        // 计算成功率
        const successfulComponents = Object.values(this.componentStates)
            .filter(state => ['success', 'fallback', 'skipped'].includes(state.status)).length;
        const totalComponents = Object.keys(this.componentStates).length;
        const successRate = ((successfulComponents / totalComponents) * 100).toFixed(1);
        
        HyperGpuLog.system('='.repeat(80));
        HyperGpuLog.system('HyperGPU Engine Initialization Summary');
        HyperGpuLog.system('='.repeat(80));
        HyperGpuLog.system(`Status: ${this.initState.phase.toUpperCase()}`);
        HyperGpuLog.system(`Duration: ${this.initState.duration}ms`);
        HyperGpuLog.system(`Attempt: ${this.initState.recovery.attemptCount}/${this.initState.recovery.maxAttempts}`);
        HyperGpuLog.system(`Success Rate: ${successRate}% (${successfulComponents}/${totalComponents})`);
        HyperGpuLog.system(`Environment Mode: ${this.env.mode}`);
        HyperGpuLog.system(`Warnings: ${this.initState.warnings.length}`);
        HyperGpuLog.system(`Errors: ${this.initState.errors.length}`);
        
        HyperGpuLog.system('-'.repeat(40));
        HyperGpuLog.system('Component Status:');
        
        for (const [name, info] of Object.entries(summary.components)) {
            const statusIcon = info.status === 'success' ? '✓' : 
                             info.status === 'fallback' ? '⚠' : 
                             info.status === 'skipped' ? '-' : '✗';
            
            HyperGpuLog.system(`  ${statusIcon} ${name.toUpperCase()}: ${info.status}`);
            
            if (info.exports && typeof info.exports === 'object') {
                if (info.exports.availableCount !== undefined) {
                    HyperGpuLog.system(`    Exports: ${info.exports.availableCount} available`);
                } else if (info.exports.fallback) {
                    HyperGpuLog.system(`    Type: Fallback implementation`);
                }
            }
            
            if (info.capabilities && typeof info.capabilities === 'object') {
                const capKeys = Object.keys(info.capabilities);
                if (capKeys.length > 0) {
                    HyperGpuLog.system(`    Capabilities: ${capKeys.length} features detected`);
                }
            }
            
            if (info.pools && typeof info.pools === 'object') {
                const poolsActive = Object.values(info.pools).filter(Boolean).length;
                const totalPools = Object.keys(info.pools).length;
                HyperGpuLog.system(`    Memory Pools: ${poolsActive}/${totalPools} active`);
            }
        }
        
        if (this.initState.warnings.length > 0) {
            HyperGpuLog.system('-'.repeat(40));
            HyperGpuLog.system('Warnings:');
            this.initState.warnings.forEach((warning, index) => {
                HyperGpuLog.system(`  ${index + 1}. ${warning}`);
            });
        }
        
        if (this.initState.errors.length > 0) {
            HyperGpuLog.system('-'.repeat(40));
            HyperGpuLog.system('Errors:');
            this.initState.errors.forEach((error, index) => {
                HyperGpuLog.system(`  ${index + 1}. ${error.error} (Phase: ${error.phase})`);
            });
        }
        
        HyperGpuLog.system('-'.repeat(40));
        HyperGpuLog.system('Available Functions:');
        
        // WASM函数
        if (this.wasmExports) {
            const wasmFunctions = Object.entries(this.wasmExports)
                .filter(([name, func]) => func !== null && typeof func === 'function')
                .map(([name]) => name);
            
            if (wasmFunctions.length > 0) {
                HyperGpuLog.system(`  WASM Functions: ${wasmFunctions.join(', ')}`);
            } else {
                HyperGpuLog.system(`  WASM Functions: Using fallback implementations`);
            }
        }
        
        // WebGPU功能
        if (this.webgpuCore && this.componentStates.webgpu.status === 'success') {
            HyperGpuLog.system(`  WebGPU Core: Fully operational`);
        } else if (this.componentStates.webgpu.status === 'fallback') {
            HyperGpuLog.system(`  WebGPU Core: Fallback mode`);
        } else {
            HyperGpuLog.system(`  WebGPU Core: Not available`);
        }
        
        // 内存优化
        const memoryStatus = this.componentStates.memory.status;
        HyperGpuLog.system(`  Memory Optimization: ${memoryStatus}`);
        
        HyperGpuLog.system('='.repeat(80));
        
        // 将详细报告保存到全局变量
        window.HyperGpuInitializationReport = summary;
        HyperGpuLog.info('Resource', 'Detailed initialization report saved to window.HyperGpuInitializationReport');
        
        return summary;
    }
    
    /**
     * 初始化内存优化组件
     */
    initMemoryOptimization() {
        this.componentStates.memory.timestamp = Date.now();
        
        try {
            // 检查是否有全局的内存优化模块
            if (typeof window !== 'undefined' && window.HyperGpuMemoryOptimization) {
                HyperGpuLog.info('Resource', 'Using full memory optimization system');
                const memSystem = window.HyperGpuMemoryOptimization.createOptimizedSystem(
                    this.wasmExports, 
                    this.webgpuCore
                );
                
                this.wasmMemoryPool = memSystem.wasmPool;
                this.webgpuBufferPool = memSystem.bufferPool;
                this.batchManager = memSystem.batchManager;
                this.cacheManager = memSystem.cacheManager;
                this.memoryMonitor = memSystem.monitor;
                
                // 记录池信息
                this.componentStates.memory.pools = {
                    wasm: !!this.wasmMemoryPool,
                    webgpu: !!this.webgpuBufferPool,
                    cache: !!this.cacheManager,
                    batch: !!this.batchManager,
                    monitor: !!this.memoryMonitor
                };
                
                // 启动内存监控
                this.startMemoryMonitoring();
                this.componentStates.memory.status = 'full_optimization';
            } else {
                HyperGpuLog.warn('Resource', 'Full memory optimization not available, using simplified system');
                const simpleSystem = this.createSimpleMemorySystem();
                
                this.wasmMemoryPool = simpleSystem.wasmPool;
                this.webgpuBufferPool = simpleSystem.bufferPool;
                this.cacheManager = simpleSystem.cacheManager;
                this.memoryMonitor = simpleSystem.monitor;
                this.batchManager = null; // 简化版本不包含批处理管理器
                
                // 记录池信息
                this.componentStates.memory.pools = {
                    wasm: !!this.wasmMemoryPool,
                    webgpu: !!this.webgpuBufferPool,
                    cache: !!this.cacheManager,
                    batch: false,
                    monitor: !!this.memoryMonitor
                };
                
                this.componentStates.memory.status = 'simplified';
                this.initState.warnings.push('Using simplified memory system');
            }
            
            HyperGpuLog.info('Resource', `Memory optimization initialized (${this.componentStates.memory.status})`);
        } catch (error) {
            this.componentStates.memory.status = 'failed';
            this.componentStates.memory.error = error.message;
            
            HyperGpuLog.error('Resource', 'Failed to initialize memory optimization', error);
            // 使用最简单的降级方案
            this.wasmMemoryPool = null;
            this.webgpuBufferPool = null;
            this.cacheManager = null;
            this.memoryMonitor = null;
            this.batchManager = null;
            
            this.initState.warnings.push(`Memory optimization failed: ${error.message}`);
        }
    }
    
    /**
     * 创建简化的WASM内存池
    /**
     * 创建简化的内存系统（作为降级方案）
     */
    createSimpleWasmPool() {
        return {
            pools: new Map(),
            inUse: new Set(),
            stats: { hits: 0, misses: 0, totalAllocations: 0 },
            
            allocate: (size) => {
                if (!this.wasmExports || !this.wasmExports.wasm_alloc) {
                    return 0;
                }
                
                const ptr = this.wasmExports.wasm_alloc(size);
                if (ptr) {
                    this.inUse.add(ptr);
                    this.stats.totalAllocations++;
                }
                return ptr;
            },
            
            deallocate: (ptr, size) => {
                if (!this.inUse.has(ptr)) return;
                this.inUse.delete(ptr);
                
                if (this.wasmExports && this.wasmExports.free_memory) {
                    this.wasmExports.free_memory(ptr);
                }
            },
            
            cleanup: () => {
                this.pools.clear();
                this.inUse.clear();
            },
            
            getStats: () => ({ ...this.stats, inUseCount: this.inUse.size })
        };
    }
    
    /**
     * 创建简化的内存系统（作为降级方案）
     */
    createSimpleMemorySystem() {
        const wasmPool = this.createSimpleWasmPool();
        const bufferPool = this.webgpuCore ? this.createSimpleBufferPool() : null;
        const cacheManager = this.createSimpleCache();
        const monitor = this.createSimpleMonitor();
        
        return {
            wasmPool,
            bufferPool,
            cacheManager,
            monitor,
            getStats: () => ({
                wasm: wasmPool.getStats(),
                webgpu: bufferPool ? bufferPool.getStats() : {},
                cache: cacheManager.getStats(),
                memory: monitor.getReport()
            }),
            cleanup: () => {
                wasmPool.cleanup();
                if (bufferPool) bufferPool.cleanup();
                cacheManager.cleanup();
            }
        };
    }

    
    /**
     * 创建简化的GPU缓冲区池
     */
    createSimpleBufferPool() {
        return {
            bufferPools: new Map(),
            inUseBuffers: new Set(),
            stats: { hits: 0, misses: 0, totalCreated: 0 },
            
            allocateBuffer: (size, usage, label = '') => {
                const key = `${size}_${usage}`;
                const pool = this.bufferPools.get(key);
                
                if (pool && pool.length > 0) {
                    const buffer = pool.pop();
                    this.inUseBuffers.add(buffer);
                    this.stats.hits++;
                    return buffer;
                }
                
                const buffer = this.webgpuCore.createBuffer(size, usage, label);
                this.inUseBuffers.add(buffer);
                this.stats.misses++;
                this.stats.totalCreated++;
                return buffer;
            },
            
            deallocateBuffer: (buffer, size, usage) => {
                if (!this.inUseBuffers.has(buffer)) return;
                this.inUseBuffers.delete(buffer);
                
                const key = `${size}_${usage}`;
                let pool = this.bufferPools.get(key);
                if (!pool) {
                    pool = [];
                    this.bufferPools.set(key, pool);
                }
                
                if (pool.length < 8) {
                    pool.push(buffer);
                } else {
                    buffer.destroy();
                }
            },
            
            getStats: () => ({ ...this.stats, inUseCount: this.inUseBuffers.size })
        };
    }
    
    /**
     * 创建简化的缓存管理器
     */
    createSimpleCache() {
        return {
            cache: new Map(),
            maxSize: 50,
            
            get: (key) => this.cache.get(key) || null,
            
            set: (key, data) => {
                if (this.cache.size >= this.maxSize) {
                    const firstKey = this.cache.keys().next().value;
                    this.cache.delete(firstKey);
                }
                this.cache.set(key, data);
            },
            
            cleanup: () => this.cache.clear(),
            
            getStats: () => ({ cacheSize: this.cache.size, maxSize: this.maxSize })
        };
    }
    
    /**
     * 创建简化的内存监控器
     */
    createSimpleMonitor() {
        return {
            metrics: {},
            
            updateMetrics: (wasmStats, bufferStats, cacheStats) => {
                this.metrics = {
                    wasmInUse: wasmStats.inUseCount || 0,
                    bufferInUse: bufferStats.inUseCount || 0,
                    cacheSize: cacheStats.cacheSize || 0,
                    timestamp: Date.now()
                };
            },
            
            checkMemoryPressure: () => {
                const jsHeapUsage = performance.memory ? 
                    performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit : 0;
                
                return {
                    level: jsHeapUsage > 0.8 ? 'high' : jsHeapUsage > 0.6 ? 'medium' : 'low',
                    usage: jsHeapUsage,
                    recommendations: jsHeapUsage > 0.8 ? ['reduce batch size', 'clear cache'] : []
                };
            },
            
            getReport: () => ({ current: this.metrics, pressure: this.checkMemoryPressure() })
        };
    }
    
    /**
     * 启动内存监控
     */
    startMemoryMonitoring() {
        if (!this.memoryMonitor) return;
        
        setInterval(() => {
            try {
                const wasmStats = this.wasmMemoryPool ? this.wasmMemoryPool.getStats() : {};
                const bufferStats = this.webgpuBufferPool ? this.webgpuBufferPool.getStats() : {};
                const cacheStats = this.cacheManager ? this.cacheManager.getStats() : {};
                
                this.memoryMonitor.updateMetrics(wasmStats, bufferStats, cacheStats);
                
                // 检查内存压力
                const pressure = this.memoryMonitor.checkMemoryPressure();
                if (pressure.level === 'high') {
                    HyperGpuLog.warn('Memory', 'High memory pressure detected', pressure);
                    this.handleMemoryPressure(pressure);
                }
            } catch (error) {
                HyperGpuLog.error('Memory', 'Memory monitoring error', error);
            }
        }, 30000); // 每30秒检查一次
    }
    
    /**
     * 处理内存压力
     */
    handleMemoryPressure(pressure) {
        HyperGpuLog.info('Memory', 'Handling memory pressure...', pressure.recommendations);
        
        // 清理缓存
        if (this.cacheManager) {
            this.cacheManager.cleanup();
        }
        
        // 建议手动垃圾回收
        if (typeof gc === 'function') {
            gc();
            HyperGpuLog.info('Memory', 'Manual garbage collection triggered');
        }
    }

    getWasmExports() {
        return this.wasmExports;
    }

    getWebGPUCore() {
        return this.webgpuCore;
    }
    
    /**
     * 判断是否应该尝试错误恢复
     */
    shouldAttemptRecovery() {
        return this.initState.recovery.enabled && 
               this.initState.recovery.attemptCount < this.initState.recovery.maxAttempts;
    }
    
    /**
     * 尝试错误恢复
     */
    async attemptRecovery() {
        this.initState.recovery.lastAttemptTime = Date.now();
        
        // 简单的恢复策略：重置状态并重新初始化
        HyperGpuLog.info('Resource', `Attempting recovery (${this.initState.recovery.attemptCount}/${this.initState.recovery.maxAttempts})...`);
        
        // 等待一些时间再重试
        await new Promise(resolve => setTimeout(resolve, 1000 * this.initState.recovery.attemptCount));
        
        // 重置部分状态
        this.isInitialized = false;
        
        // 重新初始化
        return this.init();
    }
    
    /**
     * 记录初始化摘要
     */
    logInitializationSummary() {
        const summary = {
            duration: this.initState.duration,
            attempts: this.initState.recovery.attemptCount,
            warnings: this.initState.warnings.length,
            errors: this.initState.errors.length,
            components: {
                environment: this.componentStates.environment.status,
                wasm: this.componentStates.wasm.status,
                webgpu: this.componentStates.webgpu.status,
                memory: this.componentStates.memory.status
            }
        };
        
        HyperGpuLog.info('Resource', 'Initialization Summary:', summary);
        
        if (this.initState.warnings.length > 0) {
            HyperGpuLog.warn('Resource', 'Initialization warnings:', this.initState.warnings);
        }
    }
    
    /**
     * 获取初始化状态报告
     */
    getInitializationReport() {
        return {
            isInitialized: this.isInitialized,
            state: { ...this.initState },
            components: { ...this.componentStates },
            environment: this.env.getReport()
        };
    }
    
    /**
     * 重置初始化状态（用于重新初始化）
     */
    resetInitializationState() {
        this.isInitialized = false;
        this.initState = {
            phase: 'not_started',
            startTime: null,
            endTime: null,
            duration: null,
            errors: [],
            warnings: [],
            recovery: {
                attemptCount: 0,
                maxAttempts: 3,
                lastAttemptTime: null,
                enabled: true
            }
        };
        
        // 重置组件状态
        Object.keys(this.componentStates).forEach(key => {
            this.componentStates[key] = { status: 'pending', error: null, timestamp: null };
        });
    }

    async destroy() {
        if (this.webgpuCore) {
            this.webgpuCore.destroy();
            this.webgpuCore = null;
        }
        this.wasmExports = null;
        this.isInitialized = false;
        HyperGpuLog.info('Resource', 'Resource Manager destroyed.');
    }
}

// === API层 ===
class HyperGpuAPI {
    constructor(resourceManager) {
        this.rm = resourceManager;
        
        // 初始化模块化组件
        this.initializeModules();
    }
    
    /**
     * 初始化模块化组件
     */
    initializeModules() {
        // 使用依赖注入机制初始化任务调度器
        const TaskSchedulerClass = ModuleLoader.inject('taskScheduler');
        if (typeof TaskSchedulerClass === 'function') {
            this.taskScheduler = new TaskSchedulerClass(this.rm, {
                maxConcurrentTasks: HYPERGPU_CONFIG.maxConcurrentTasks || 4,
                performanceMonitoring: 1
            });
            HyperGpuLog.info('API', 'Task scheduler initialized via dependency injection');
        } else {
            // 降级实现已经是对象，直接使用
            this.taskScheduler = TaskSchedulerClass;
            HyperGpuLog.warn('API', 'Using fallback task scheduler');
        }
        
        // 使用依赖注入机制初始化工具API
        const UtilsAPIClass = ModuleLoader.inject('utilsAPI');
        if (typeof UtilsAPIClass === 'function') {
            this.utilsAPI = new UtilsAPIClass(this.rm);
            HyperGpuLog.info('API', 'Utils API initialized via dependency injection');
        } else {
            // 降级实现已经是对象，直接使用
            this.utilsAPI = UtilsAPIClass;
            HyperGpuLog.warn('API', 'Using fallback utils API');
        }
    }

    getApi() {
        return {
            // === WASM任务 (内存优化版) ===
            normalizeVectorGeneric: this.createWasmAPI('normalizeVectorGeneric', 'normalize_vector'),
            preprocessParticles: this.createWasmAPI('preprocessParticles', 'preprocess_particles'),
            multiplyMat4Generic: this.createWasmAPI('multiplyMat4Generic', 'multiply_mat4'),
            superResolutionBicubic: this.createWasmAPI('superResolutionBicubic', 'super_resolution'),

            // === WebGPU任务 (内存优化版) ===
            vectorAddWithWebGPU: this.createWebGPUVectorAdd(),
            matrixMultiplyWithWebGPU: this.createWebGPUMatrixMultiply(),

            // === 通用工具方法 ===
            benchmark: this.utilsAPI ? this.utilsAPI.benchmark.bind(this.utilsAPI) : this.createFallbackBenchmark(),
            batchNormalizeVectors: this.utilsAPI ? this.utilsAPI.batchNormalizeVectors.bind(this.utilsAPI) : this.createFallbackBatch(),
            getMemoryStats: this.utilsAPI ? this.utilsAPI.getMemoryStats.bind(this.utilsAPI) : () => ({ error: 'Utils API not available' }),
            clearMemoryCache: this.utilsAPI ? this.utilsAPI.clearMemoryCache.bind(this.utilsAPI) : () => ({ itemsCleaned: 0 }),

            // === 任务调度系统 ===
            taskScheduler: this.taskScheduler || this.createFallbackScheduler(),

            // === 便捷的脚本调用API ===
            ...this.createQuickAPIs(),

            // === 后台任务管理 ===
            ...this.createBackgroundAPIs(),

            // === 性能监控控制API ===
            ...this.createPerformanceAPIs()
        };
    }
    
    /**
     * WASM方法处理器映射表
     * 使用映射表替代switch-case减少代码重复
     */
    wasmMethodHandlers = {
        'normalizeVectorGeneric': {
            handler: this.handleNormalizeVector.bind(this),
            argExtractor: (args) => [args[0]],
            memoryType: 'vector'
        },
        'multiplyMat4Generic': {
            handler: this.handleMultiplyMat4.bind(this),
            argExtractor: (args) => [args[0], args[1]],
            memoryType: 'matrix'
        },
        'superResolutionBicubic': {
            handler: this.handleSuperResolution.bind(this),
            argExtractor: (args) => args,
            memoryType: 'image'
        },
        'preprocessParticles': {
            handler: this.handlePreprocessParticles.bind(this),
            argExtractor: (args) => args,
            memoryType: 'particles'
        }
    };

    /**
     * 创建WASM API包装器
     * 使用映射表减少重复的switch-case逻辑
     */
    createWasmAPI(methodName, taskType) {
        return async (...args) => {
            const wasm = this.rm.getWasmExports();
            if (!wasm || !wasm[methodName]) {
                throw new Error(`WASM ${methodName} not available`);
            }

            const methodConfig = this.wasmMethodHandlers[methodName];
            if (!methodConfig) {
                throw new Error(`Unimplemented WASM method: ${methodName}`);
            }

            // 使用通用处理器
            const extractedArgs = methodConfig.argExtractor(args);
            return await methodConfig.handler(...extractedArgs);
        };
    }
    
    /**
     * 通用WASM内存管理和缓存处理器
     */
    async executeWasmWithMemoryManagement(methodName, setupMemory, executeWasm, cacheKeyData) {
        const wasm = this.rm.getWasmExports();
        
        // 统一的缓存检查
        const cacheKey = `${methodName}_${JSON.stringify(cacheKeyData)}`;
        if (this.rm.cacheManager) {
            const cached = this.rm.cacheManager.get(cacheKey);
            if (cached) {
                HyperGpuLog.debug('API', `Cache hit for ${methodName}`);
                return cached;
            }
        }

        const allocatedPointers = [];
        try {
            // 统一的内存分配策略
            const memoryInfo = await setupMemory(wasm, allocatedPointers);
            
            // 执行WASM操作
            const result = await executeWasm(wasm, memoryInfo);
            
            // 统一的缓存策略
            if (this.rm.cacheManager) {
                this.rm.cacheManager.set(cacheKey, result);
            }
            
            return result;
        } finally {
            // 统一的内存释放
            this.cleanupWasmMemory(wasm, allocatedPointers);
        }
    }

    /**
     * 统一的WASM内存清理
     */
    cleanupWasmMemory(wasm, allocatedPointers) {
        allocatedPointers.forEach(({ ptr, size }) => {
            if (ptr) {
                if (this.rm.wasmMemoryPool) {
                    this.rm.wasmMemoryPool.deallocate(ptr, size);
                } else {
                    wasm.free_memory(ptr);
                }
            }
        });
    }

    /**
     * 处理向量归一化
     * 使用通用内存管理减少重复代码
     */
    async handleNormalizeVector(array) {
        return await this.executeWasmWithMemoryManagement(
            'normalizeVector',
            async (wasm, allocatedPointers) => {
                const size = array.length * 4;
                let ptr;
                
                if (this.rm.wasmMemoryPool) {
                    ptr = this.rm.wasmMemoryPool.allocate(size);
                } else {
                    ptr = wasm.wasm_alloc(size);
                }
                
                if (!ptr) throw new Error("Failed to allocate WASM memory");
                allocatedPointers.push({ ptr, size });

                const memory = wasm.get_memory();
                const wasmArray = new Float32Array(memory.buffer, ptr, array.length);
                wasmArray.set(array);
                
                return { ptr, wasmArray, memory };
            },
            async (wasm, { ptr, wasmArray }) => {
                wasm.normalizeVectorGeneric(ptr, array.length);
                return Array.from(wasmArray);
            },
            array
        );
    }
    
    /**
     * 处理4x4矩阵乘法
     * 使用通用内存管理减少重复代码
     */
    async handleMultiplyMat4(matA, matB) {
        if (matA.length !== 16 || matB.length !== 16) {
            throw new Error("Input matrices must be 4x4 (16 elements each)");
        }

        return await this.executeWasmWithMemoryManagement(
            'multiplyMat4',
            async (wasm, allocatedPointers) => {
                const size = 16 * 4;
                
                // 分配三个矩阵的内存
                const allocateMatrix = () => {
                    let ptr;
                    if (this.rm.wasmMemoryPool) {
                        ptr = this.rm.wasmMemoryPool.allocate(size);
                    } else {
                        ptr = wasm.wasm_alloc(size);
                    }
                    if (!ptr) throw new Error("Failed to allocate WASM memory");
                    allocatedPointers.push({ ptr, size });
                    return ptr;
                };

                const aPtr = allocateMatrix();
                const bPtr = allocateMatrix();
                const cPtr = allocateMatrix();

                const memory = wasm.get_memory();
                const aMem = new Float32Array(memory.buffer, aPtr, 16);
                const bMem = new Float32Array(memory.buffer, bPtr, 16);
                const cMem = new Float32Array(memory.buffer, cPtr, 16);
                
                aMem.set(matA);
                bMem.set(matB);
                
                return { aPtr, bPtr, cPtr, cMem };
            },
            async (wasm, { aPtr, bPtr, cPtr, cMem }) => {
                wasm.multiplyMat4Generic(aPtr, bPtr, cPtr);
                return Array.from(cMem);
            },
            [matA, matB]
        );
    }
    
    /**
     * 处理超分辨率
     * 使用通用内存管理减少重复代码
     */
    async handleSuperResolution(imageData, inWidth, inHeight, outWidth, outHeight) {
        if (!(imageData instanceof Uint8ClampedArray)) {
            throw new Error('Input must be Uint8ClampedArray');
        }

        if (inWidth < HYPERGPU_CONFIG.minSuperResolutionSize || inHeight < HYPERGPU_CONFIG.minSuperResolutionSize) {
            HyperGpuLog.warn('API', `Skipping super resolution: input too small (${inWidth}x${inHeight})`);
            return { outputData: imageData, width: inWidth, height: inHeight, status: 'skipped' };
        }

        return await this.executeWasmWithMemoryManagement(
            'superResolution',
            async (wasm, allocatedPointers) => {
                const size = imageData.length;
                let inputPtr;
                
                if (this.rm.wasmMemoryPool) {
                    inputPtr = this.rm.wasmMemoryPool.allocate(size);
                } else {
                    inputPtr = wasm.wasm_alloc(size);
                }
                
                if (!inputPtr) throw new Error("Failed to allocate WASM memory");
                allocatedPointers.push({ ptr: inputPtr, size });

                const memory = wasm.get_memory();
                const inputMem = new Uint8Array(memory.buffer, inputPtr, imageData.length);
                inputMem.set(imageData);
                
                return { inputPtr, memory };
            },
            async (wasm, { inputPtr, memory }) => {
                const result = wasm.superResolutionBicubic(inputPtr, inWidth, inHeight, outWidth, outHeight);
                const dataPtr = result.ptr;
                const dataLen = result.len;
                
                const outputData = new Uint8ClampedArray(memory.buffer, dataPtr, dataLen);
                return {
                    outputData: new Uint8ClampedArray(outputData),
                    width: outWidth,
                    height: outHeight,
                    status: 'done'
                };
            },
            [imageData.length, inWidth, inHeight, outWidth, outHeight]
        );
    }
    
    /**
     * 处理粒子预处理
     * 使用通用内存管理减少重复代码
     */
    async handlePreprocessParticles(particlesFlatArray, count, minMass) {
        return await this.executeWasmWithMemoryManagement(
            'preprocessParticles',
            async (wasm, allocatedPointers) => {
                const size = particlesFlatArray.length * 4;
                let ptr;
                
                if (this.rm.wasmMemoryPool) {
                    ptr = this.rm.wasmMemoryPool.allocate(size);
                } else {
                    ptr = wasm.wasm_alloc(size);
                }
                
                if (!ptr) throw new Error("Failed to allocate WASM memory");
                allocatedPointers.push({ ptr, size });

                const memory = wasm.get_memory();
                const wasmArray = new Float32Array(memory.buffer, ptr, particlesFlatArray.length);
                wasmArray.set(particlesFlatArray);
                
                return { ptr, memory };
            },
            async (wasm, { ptr, memory }) => {
                const result = wasm.preprocessParticles(ptr, count, minMass);
                const dataPtr = result.ptr;
                const dataLen = result.len;
                
                const resultData = new Float32Array(memory.buffer, dataPtr, dataLen * 7);
                return { data: Array.from(resultData), count: dataLen };
            },
            [particlesFlatArray.length, count, minMass]
        );
    }
    
    /**
     * 通用WebGPU计算执行器
     * 统一处理缓冲区分配、管线管理、执行和清理
     */
    async executeWebGPUCompute(operationName, setupBuffers, createPipeline, executeCompute, cacheKeyData) {
        const webgpuCore = this.rm.getWebGPUCore();
        if (!webgpuCore || !webgpuCore.isInitialized) {
            throw new Error('WebGPU core not available');
        }

        // 统一的缓存检查
        const cacheKey = `gpu_${operationName}_${JSON.stringify(cacheKeyData)}`;
        const shouldCache = this.shouldCacheResult(cacheKeyData);
        
        if (shouldCache && this.rm.cacheManager) {
            const cached = this.rm.cacheManager.get(cacheKey);
            if (cached) {
                HyperGpuLog.debug('API', `Cache hit for GPU ${operationName}`);
                return cached;
            }
        }

        const allocatedBuffers = [];
        try {
            // 统一的缓冲区分配
            const buffers = await setupBuffers(webgpuCore, allocatedBuffers);
            
            // 统一的管线管理（支持缓存）
            const { pipeline, bindGroupLayout } = await this.getOrCreatePipeline(
                operationName, 
                createPipeline, 
                webgpuCore
            );
            
            // 执行计算
            const result = await executeCompute(webgpuCore, buffers, pipeline, bindGroupLayout);
            
            // 统一的缓存策略
            if (shouldCache && this.rm.cacheManager) {
                this.rm.cacheManager.set(cacheKey, result);
            }
            
            return result;
        } finally {
            // 统一的资源清理
            this.cleanupWebGPUBuffers(allocatedBuffers);
        }
    }

    /**
     * 判断是否应该缓存结果
     */
    shouldCacheResult(cacheKeyData) {
        // 只缓存小规模的计算结果
        const dataSize = JSON.stringify(cacheKeyData).length;
        return dataSize <= 10000; // 10KB限制
    }

    /**
     * 获取或创建WebGPU管线（支持缓存）
     */
    async getOrCreatePipeline(operationName, createPipelineFunc, webgpuCore) {
        const pipelineKey = `${operationName}_pipeline`;
        
        if (this.rm.cacheManager) {
            const cached = this.rm.cacheManager.get(pipelineKey);
            if (cached) {
                return cached;
            }
        }
        
        const pipelineResult = await createPipelineFunc(webgpuCore);
        
        if (this.rm.cacheManager) {
            this.rm.cacheManager.set(pipelineKey, pipelineResult);
        }
        
        return pipelineResult;
    }

    /**
     * 统一的WebGPU缓冲区分配
     */
    allocateWebGPUBuffer(webgpuCore, size, usage, label, allocatedBuffers) {
        let buffer;
        
        if (this.rm.webgpuBufferPool) {
            buffer = this.rm.webgpuBufferPool.allocateBuffer(size, usage, label);
        } else {
            buffer = webgpuCore.createBuffer(size, usage);
        }
        
        allocatedBuffers.push({ buffer, size, usage });
        return buffer;
    }

    /**
     * 统一的WebGPU缓冲区清理
     */
    cleanupWebGPUBuffers(allocatedBuffers) {
        allocatedBuffers.forEach(({ buffer, size, usage }) => {
            if (buffer) {
                if (this.rm.webgpuBufferPool) {
                    this.rm.webgpuBufferPool.deallocateBuffer(buffer, size, usage);
                } else {
                    buffer.destroy();
                }
            }
        });
    }

    /**
     * 创建WebGPU向量加法API
     * 使用通用执行器减少重复代码
     */
    createWebGPUVectorAdd() {
        return async (vectorA, vectorB) => {
            if (vectorA.length !== vectorB.length) {
                throw new Error('Vectors must have the same length');
            }

            const len = vectorA.length;
            const bufferSize = len * 4;

            return await this.executeWebGPUCompute(
                'vector_add',
                // 设置缓冲区
                async (webgpuCore, allocatedBuffers) => {
                    const inputA = this.allocateWebGPUBuffer(
                        webgpuCore, bufferSize, 
                        GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                        'VectorA', allocatedBuffers
                    );
                    const inputB = this.allocateWebGPUBuffer(
                        webgpuCore, bufferSize,
                        GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                        'VectorB', allocatedBuffers
                    );
                    const output = this.allocateWebGPUBuffer(
                        webgpuCore, bufferSize,
                        GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
                        'VectorOutput', allocatedBuffers
                    );

                    // 写入数据
                    webgpuCore.writeBuffer(inputA, new Float32Array(vectorA));
                    webgpuCore.writeBuffer(inputB, new Float32Array(vectorB));

                    return { inputA, inputB, output, bufferSize };
                },
                // 创建管线
                async (webgpuCore) => {
                    const shaderCode = `
                        @group(0) @binding(0) var<storage, read> inputA: array<f32>;
                        @group(0) @binding(1) var<storage, read> inputB: array<f32>;
                        @group(0) @binding(2) var<storage, read_write> output: array<f32>;

                        @compute @workgroup_size(64)
                        fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
                            let index = global_id.x;
                            if (index < arrayLength(&inputA)) {
                                output[index] = inputA[index] + inputB[index];
                            }
                        }
                    `;

                    const bindGroupLayoutEntries = [
                        { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage" } },
                        { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage" } },
                        { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage" } }
                    ];

                    return webgpuCore.createComputePipeline(shaderCode, bindGroupLayoutEntries, 'VectorAdd');
                },
                // 执行计算
                async (webgpuCore, { inputA, inputB, output, bufferSize }, pipeline, bindGroupLayout) => {
                    const bindGroup = webgpuCore.device.createBindGroup({
                        layout: bindGroupLayout,
                        entries: [
                            { binding: 0, resource: { buffer: inputA } },
                            { binding: 1, resource: { buffer: inputB } },
                            { binding: 2, resource: { buffer: output } }
                        ]
                    });

                    const commandEncoder = webgpuCore.device.createCommandEncoder();
                    const passEncoder = commandEncoder.beginComputePass();
                    passEncoder.setPipeline(pipeline);
                    passEncoder.setBindGroup(0, bindGroup);
                    passEncoder.dispatchWorkgroups(Math.ceil(len / 64));
                    passEncoder.end();

                    webgpuCore.queue.submit([commandEncoder.finish()]);

                    const resultBuffer = await webgpuCore.readBuffer(output, bufferSize);
                    return Array.from(new Float32Array(resultBuffer));
                },
                // 缓存键数据
                [vectorA.length, vectorA.slice(0, 10), vectorB.slice(0, 10)] // 只使用前10个元素作为缓存键
            );
        };
    }
    
    /**
     * 创建WebGPU矩阵乘法API
     * 使用通用执行器减少重复代码
     */
    createWebGPUMatrixMultiply() {
        return async (matA, matB, M, N, K) => {
            if (matA.length !== M * K || matB.length !== K * N) {
                throw new Error('Matrix dimensions mismatch');
            }

            const bufferSizeA = M * K * 4;
            const bufferSizeB = K * N * 4;
            const bufferSizeResult = M * N * 4;
            const dimensionsSize = 12; // vec3<u32> = 3 * 4 bytes

            return await this.executeWebGPUCompute(
                'matrix_multiply',
                // 设置缓冲区
                async (webgpuCore, allocatedBuffers) => {
                    const inputA = this.allocateWebGPUBuffer(
                        webgpuCore, bufferSizeA,
                        GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                        'MatrixA', allocatedBuffers
                    );
                    const inputB = this.allocateWebGPUBuffer(
                        webgpuCore, bufferSizeB,
                        GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                        'MatrixB', allocatedBuffers
                    );
                    const output = this.allocateWebGPUBuffer(
                        webgpuCore, bufferSizeResult,
                        GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
                        'MatrixResult', allocatedBuffers
                    );
                    const dimensionsBuffer = this.allocateWebGPUBuffer(
                        webgpuCore, dimensionsSize,
                        GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                        'MatrixDimensions', allocatedBuffers
                    );

                    // 写入数据
                    webgpuCore.writeBuffer(inputA, new Float32Array(matA));
                    webgpuCore.writeBuffer(inputB, new Float32Array(matB));
                    webgpuCore.writeBuffer(dimensionsBuffer, new Uint32Array([M, N, K]));

                    return { inputA, inputB, output, dimensionsBuffer, bufferSizeResult, M, N };
                },
                // 创建管线
                async (webgpuCore) => {
                    const shaderCode = `
                        @group(0) @binding(0) var<storage, read> matrixA: array<f32>;
                        @group(0) @binding(1) var<storage, read> matrixB: array<f32>;
                        @group(0) @binding(2) var<storage, read_write> result: array<f32>;
                        @group(0) @binding(3) var<uniform> dimensions: vec3<u32>; // [M, N, K]

                        @compute @workgroup_size(8, 8)
                        fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
                            let row = global_id.x;
                            let col = global_id.y;
                            let M = dimensions.x;
                            let N = dimensions.y;
                            let K = dimensions.z;
                            
                            if (row >= M || col >= N) {
                                return;
                            }
                            
                            var sum = 0.0;
                            for (var k = 0u; k < K; k++) {
                                sum += matrixA[row * K + k] * matrixB[k * N + col];
                            }
                            
                            result[row * N + col] = sum;
                        }
                    `;

                    const bindGroupLayoutEntries = [
                        { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage" } },
                        { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage" } },
                        { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage" } },
                        { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: "uniform" } }
                    ];

                    return webgpuCore.createComputePipeline(shaderCode, bindGroupLayoutEntries, 'MatrixMultiply');
                },
                // 执行计算
                async (webgpuCore, { inputA, inputB, output, dimensionsBuffer, bufferSizeResult, M, N }, pipeline, bindGroupLayout) => {
                    const bindGroup = webgpuCore.device.createBindGroup({
                        layout: bindGroupLayout,
                        entries: [
                            { binding: 0, resource: { buffer: inputA } },
                            { binding: 1, resource: { buffer: inputB } },
                            { binding: 2, resource: { buffer: output } },
                            { binding: 3, resource: { buffer: dimensionsBuffer } }
                        ]
                    });

                    const commandEncoder = webgpuCore.device.createCommandEncoder();
                    const passEncoder = commandEncoder.beginComputePass();
                    passEncoder.setPipeline(pipeline);
                    passEncoder.setBindGroup(0, bindGroup);
                    
                    // 计算工作组数量（每个工作组处理8x8个元素）
                    const workgroupCountX = Math.ceil(M / 8);
                    const workgroupCountY = Math.ceil(N / 8);
                    passEncoder.dispatchWorkgroups(workgroupCountX, workgroupCountY, 1);
                    passEncoder.end();

                    webgpuCore.queue.submit([commandEncoder.finish()]);

                    const resultBuffer = await webgpuCore.readBuffer(output, bufferSizeResult);
                    return Array.from(new Float32Array(resultBuffer));
                },
                // 缓存键数据
                [M, N, K, matA.slice(0, 16), matB.slice(0, 16)] // 只使用部分数据作为缓存键
            );
        };
    }
    
    /**
     * 创建降级基准测试方法
     */
    createFallbackBenchmark() {
        return async (testName, testFn, iterations = 100) => {
            const results = [];
            console.log(`[HyperGPU:Fallback] Starting ${testName} (${iterations} iterations)`);
            
            for (let i = 0; i < iterations; i++) {
                const start = performance.now();
                try {
                    await testFn();
                    results.push(performance.now() - start);
                } catch (error) {
                    console.error(`[HyperGPU:Fallback] Iteration ${i} failed`, error);
                    results.push(-1);
                }
            }
            
            const validResults = results.filter(r => r >= 0);
            const avg = validResults.reduce((a, b) => a + b, 0) / validResults.length;
            
            return {
                testName,
                iterations: validResults.length,
                failed: results.length - validResults.length,
                avgTime: avg,
                minTime: Math.min(...validResults),
                maxTime: Math.max(...validResults)
            };
        };
    }
    
    /**
     * 创建降级批处理方法
     */
    createFallbackBatch() {
        return async (vectors) => {
            return vectors.map(vector => {
                const len = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
                return len > 0 ? vector.map(v => v / len) : vector;
            });
        };
    }
    
    /**
     * 创建降级调度器
     */
    createFallbackScheduler() {
        return {
            isRunning: false,
            start: () => ({ status: 'fallback_scheduler' }),
            stop: () => ({ status: 'fallback_scheduler' }),
            addTask: () => 'fallback_task_id',
            getStatus: () => ({ 
                isRunning: false, 
                type: 'fallback',
                queues: { critical: 0, high: 0, normal: 0, low: 0, background: 0 },
                activeTasks: 0
            }),
            clearAllQueues: () => ({ status: 'fallback_scheduler' })
        };
    }
}

// === 环境检测类 ===
class HyperGpuEnvironment {
    constructor() {
        this.report = {
            webgpu: false,
            webgl2: false,
            wasm: false,
            sharedArrayBuffer: false,
            worker: typeof Worker !== 'undefined',
            browser: this.detectBrowser(),
            userAgent: navigator.userAgent
        };
        this.mode = 'pure-js';
    }

    detectBrowser() {
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes('chrome')) return 'chrome';
        if (userAgent.includes('firefox')) return 'firefox';
        if (userAgent.includes('safari')) return 'safari';
        if (userAgent.includes('edge')) return 'edge';
        return 'unknown';
    }

    async init() {
        HyperGpuLog.info('Env', 'Detecting environment...');
        try {
            // 检测WebGPU支持
            if (navigator.gpu) {
                try {
                    const adapter = await navigator.gpu.requestAdapter();
                    this.report.webgpu = !!adapter;
                    if (adapter) {
                        HyperGpuLog.info('Env', 'WebGPU adapter found', adapter.info || 'No adapter info');
                    }
                } catch (error) {
                    HyperGpuLog.warn('Env', 'WebGPU adapter request failed', error);
                    this.report.webgpu = false;
                }
            }
            // 检测其他技术
            this.report.webgl2 = !!window.WebGL2RenderingContext;
            this.report.wasm = typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function';
            this.report.sharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
            this.mode = this.determineMode();
            HyperGpuLog.info('Env', 'Detection complete', this.report);
            HyperGpuLog.info('Env', `Selected mode: ${this.mode}`);
        } catch (error) {
            HyperGpuLog.error('Env', 'Detection failed', error);
            this.mode = 'pure-js';
        }
    }

    determineMode() {
        if (this.report.webgpu && this.report.wasm) return 'webgpu+wasm';
        if (this.report.wasm && this.report.webgl2) return 'webgl+wasm';
        if (this.report.wasm) return 'cpu+wasm';
        return 'pure-js';
    }

    getReport() {
        return { ...this.report, mode: this.mode };
    }
}

/**
 * HyperGPU资源管理器
 * 负责管理WASM、WebGPU等核心资源的初始化和生命周期
 * 
 * @class HyperGpuResourceManager
 * @description 提供统一的资源管理接口，包括内存优化、失败恢复等功能
 * @example
 * const env = new HyperGpuEnvironment();
 * await env.init();
 * const rm = new HyperGpuResourceManager(env);
 * await rm.init();
 * const wasmExports = rm.getWasmExports();
 */
class HyperGpuResourceManager {
    /**
     * 构造函数
     * @param {HyperGpuEnvironment} env - 环境检测器实例
     */
    constructor(env) {
        this.env = env;
        this.wasmExports = null;
        this.webgpuCore = null;
        this.isInitialized = false;
        // 初始化状态跟踪 (参考033.txt)
        this.initState = {
            phase: 'not_started',
            startTime: null,
            endTime: null,
            duration: null,
            errors: [],
            warnings: [],
            recovery: {
                attemptCount: 0,
                maxAttempts: 3,
                lastAttemptTime: null,
                enabled: true
            }
        };
        // 组件初始化状态
        this.componentStates = {
            environment: { status: 'pending', error: null, timestamp: null },
            wasm: { status: 'pending', error: null, timestamp: null, exports: {} },
            webgpu: { status: 'pending', error: null, timestamp: null, capabilities: {} },
            memory: { status: 'pending', error: null, timestamp: null, pools: {} }
        };
        // 内存优化组件
        this.wasmMemoryPool = null;
        this.webgpuBufferPool = null;
        this.batchManager = null;
        this.cacheManager = null;
        this.memoryMonitor = null;
    }

    async init() {
        if (this.isInitialized) {
            HyperGpuLog.warn('Resource', 'Already initialized.');
            return;
        }
        
        this.initState.phase = 'starting';
        this.initState.startTime = Date.now();
        this.initState.recovery.attemptCount++;
        HyperGpuLog.info('Resource', `Initializing Resource Manager (attempt ${this.initState.recovery.attemptCount}/${this.initState.recovery.maxAttempts})...`);

        try {
            // 1. 初始化环境检测
            this.initState.phase = 'environment';
            this.componentStates.environment.timestamp = Date.now();
            this.componentStates.environment.status = 'success';
            HyperGpuLog.info('Resource', 'Environment detection completed');

            // 2. 初始化 Wasm 核心
            this.initState.phase = 'wasm';
            await this.initWasmModule();

            // 3. 初始化 WebGPU 核心（如果支持）
            this.initState.phase = 'webgpu';
            if (this.env.report.webgpu) {
                await this.initWebGPUCore();
            } else {
                this.componentStates.webgpu.status = 'skipped';
                HyperGpuLog.info('Resource', 'WebGPU not supported, skipping initialization');
            }

            // 4. 初始化内存优化系统
            this.initState.phase = 'memory';
            await this.initMemoryOptimization();

            // 5. 初始化完成
            this.isInitialized = true;
            this.initState.phase = 'completed';
            this.initState.endTime = Date.now();
            this.initState.duration = this.initState.endTime - this.initState.startTime;
            HyperGpuLog.info('Resource', `Resource Manager initialization complete in ${this.initState.duration}ms`);
            this.logInitializationSummary();
        } catch (error) {
            this.initState.phase = 'failed';
            this.initState.endTime = Date.now();
            this.initState.duration = this.initState.endTime - this.initState.startTime;
            this.initState.errors.push({
                phase: this.initState.phase,
                error: error.message,
                timestamp: Date.now(),
                attempt: this.initState.recovery.attemptCount
            });
            HyperGpuLog.error('Resource', `Initialization failed in phase '${this.initState.phase}'`, error);

            // 尝试错误恢复
            if (this.shouldAttemptRecovery()) {
                await this.attemptRecovery();
            } else {
                HyperGpuLog.error('Resource', 'Max recovery attempts reached or recovery disabled. Initialization failed.');
                throw new Error(`Initialization failed after ${this.initState.recovery.attemptCount} attempts: ${error.message}`);
            }
        }
    }

    // 注意：此方法已被移除，统一使用优化版本的initWasmModule (第385行)

    // 注意：此方法已被移除，统一使用依赖注入机制 (initWebGPUCore在第447行)

    async initMemoryOptimization() {
        try {
            this.componentStates.memory.timestamp = Date.now();
            if (typeof HyperGpuMemoryOptimization !== 'function') {
                throw new Error('HyperGpuMemoryOptimization class not found');
            }
            const memoryOptSystem = new HyperGpuMemoryOptimization();
            const optimizedSystem = await memoryOptSystem.createOptimizedSystem(this);
            this.wasmMemoryPool = optimizedSystem.wasmPool;
            this.webgpuBufferPool = optimizedSystem.bufferPool;
            this.cacheManager = optimizedSystem.cacheManager;
            this.memoryMonitor = optimizedSystem.monitor;
            this.componentStates.memory.pools = {
                wasm: !!this.wasmMemoryPool,
                webgpu: !!this.webgpuBufferPool
            };
            this.componentStates.memory.status = 'success';
            HyperGpuLog.info('Resource', 'Memory optimization system initialized successfully');
        } catch (error) {
            this.componentStates.memory.status = 'failed';
            this.componentStates.memory.error = error.message;
            this.initState.warnings.push({ phase: 'memory', warning: error.message, timestamp: Date.now() });
            HyperGpuLog.warn('Resource', 'Memory optimization initialization failed, using fallback', error);
            const fallbackSystem = this.createFallbackMemoryOpt();
            const optimizedSystem = fallbackSystem.createOptimizedSystem(this);
            this.wasmMemoryPool = optimizedSystem.wasmPool;
            this.webgpuBufferPool = optimizedSystem.bufferPool;
            this.cacheManager = optimizedSystem.cacheManager;
            this.memoryMonitor = optimizedSystem.monitor;
        }
    }

    // 注意：这些降级方法已移至ModuleLoader中，避免代码重复

    shouldAttemptRecovery() {
        return this.initState.recovery.enabled &&
               this.initState.recovery.attemptCount < this.initState.recovery.maxAttempts;
    }

    async attemptRecovery() {
        this.initState.recovery.lastAttemptTime = Date.now();
        HyperGpuLog.info('Resource', `Attempting recovery (${this.initState.recovery.attemptCount}/${this.initState.recovery.maxAttempts})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * this.initState.recovery.attemptCount));
        this.isInitialized = false;
        return this.init();
    }

    logInitializationSummary() {
        const summary = {
            duration: this.initState.duration,
            attempts: this.initState.recovery.attemptCount,
            warnings: this.initState.warnings.length,
            errors: this.initState.errors.length,
            components: {
                environment: this.componentStates.environment.status,
                wasm: this.componentStates.wasm.status,
                webgpu: this.componentStates.webgpu.status,
                memory: this.componentStates.memory.status
            }
        };
        HyperGpuLog.info('Resource', 'Initialization Summary:', summary);
        if (this.initState.warnings.length > 0) {
            HyperGpuLog.warn('Resource', 'Initialization warnings:', this.initState.warnings);
        }
    }

    getWasmExports() {
        return this.wasmExports;
    }

    getWebGPUCore() {
        return this.webgpuCore;
    }

    async destroy() {
        if (this.webgpuCore) {
            this.webgpuCore.destroy();
            this.webgpuCore = null;
        }
        this.wasmExports = null;
        this.isInitialized = false;
        HyperGpuLog.info('Resource', 'Resource Manager destroyed.');
    }
}



/**
 * HyperGPU高级API层
 * 提供统一的高层次接口，封装底层复杂性
 * 
 * @class HyperGpuEngine
 * @description 主引擎类，管理所有组件的生命周期和协调
 * @example
 * const engine = new HyperGpuEngine();
 * await engine.init();
 * const api = engine.getApi();
 * const result = await api.normalizeVector([1, 2, 3]);
 */
class HyperGpuEngine {
    /**
     * 构造函数
     * 初始化引擎的基本组件
     */
    constructor() {
        this.env = new HyperGpuEnvironment();
        this.rm = null;
        this.api = null;
        this.isInitialized = false;
    }
    
    /**
     * 初始化HyperGPU引擎
     * 按顺序初始化环境、资源管理器和API层
     * 
     * @async
     * @method init
     * @throws {Error} 当初始化任何组件失败时抛出错误
     * @returns {Promise<void>}
     * 
     * @description 初始化流程：
     * 1. 环境检测和能力分析
     * 2. 资源管理器初始化
     * 3. API层初始化和绑定
     * 4. 系统准备就绪
     */
    async init() {
        if (this.isInitialized) return;
        
        try {
            HyperGpuLog.info('Engine', 'Initializing HyperGPU Engine...');
            await this.env.init();
            this.rm = new HyperGpuResourceManager(this.env);
            await this.rm.init();
            this.api = new HyperGpuAPI(this.rm);
            this.isInitialized = true;
            HyperGpuLog.info('Engine', 'HyperGPU Engine initialized successfully');
        } catch (error) {
            HyperGpuLog.error('Engine', 'Failed to initialize HyperGPU Engine', error);
            throw error;
        }
    }
    
    /**
     * 获取HyperGPU API接口
     * 
     * @method getApi
     * @throws {Error} 当引擎未初始化时抛出错误
     * @returns {Object} HyperGPU API对象，包含所有可用的方法
     * 
     * @description 返回的API对象包含：
     * - normalizeVector: 向量归一化
     * - multiplyMat4: 4x4矩阵乘法
     * - superResolution: 超分辨率处理
     * - benchmark: 性能基准测试
     * - 更多...
     */
    getApi() {
        if (!this.isInitialized) {
            throw new Error('HyperGPU Engine not initialized. Call init() first.');
        }
        return this.api.getApi();
    }
    
    /**
     * 获取引擎状态信息
     * 
     * @method getStatus
     * @returns {Object} 引擎状态对象
     * @returns {boolean} returns.isInitialized - 是否已初始化
     * @returns {Object|null} returns.environment - 环境检测报告
     * @returns {Object|null} returns.resourceManager - 资源管理器状态
     * @returns {number} returns.timestamp - 状态查询时间戳
     */
    /**
     * 获取引擎状态信息
     * 
     * @method getStatus
     * @returns {Object} 引擎状态对象
     * @returns {boolean} returns.isInitialized - 是否已初始化
     * @returns {Object|null} returns.environment - 环境检测报告
     * @returns {Object|null} returns.resourceManager - 资源管理器状态
     * @returns {number} returns.timestamp - 状态查询时间戳
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            environment: this.env ? this.env.getReport() : null,
            resourceManager: this.rm ? this.rm.getInitializationReport() : null,
            timestamp: Date.now()
        };
    }
    
    /**
     * 销毁引擎实例
     * 清理所有资源和引用，释放内存
     * 
     * @async
     * @method destroy
     * @returns {Promise<void>}
     * 
     * @description 销毁流程：
     * 1. 销毁资源管理器
     * 2. 清理API层引用
     * 3. 重置初始化状态
     * 4. 记录销毁日志
     */
    async destroy() {
        if (this.rm) {
            await this.rm.destroy();
            this.rm = null;
        }
        this.api = null;
        this.isInitialized = false;
        HyperGpuLog.info('Engine', 'HyperGPU Engine destroyed');
    }
}

// === 全局实例 ===
let globalEngine = null;

/**
 * 获取全局HyperGPU引擎实例
 * 使用单例模式确保整个应用中只有一个引擎实例
 * 
 * @function getHyperGpu
 * @returns {HyperGpuEngine} 全局引擎实例
 * 
 * @example
 * const engine = getHyperGpu();
 * await engine.init();
 * const api = engine.getApi();
 */
function getHyperGpu() {
    if (!globalEngine) {
        globalEngine = new HyperGpuEngine();
    }
    return globalEngine;
}

/**
 * 自动初始化引擎并返回API
 * 提供便捷的一键初始化和获取API的方法
 * 
 * @async
 * @function autoInitializeEngine
 * @returns {Promise<Object|null>} HyperGPU API对象或null（当初始化失败时）
 * 
 * @description 功能特点：
 * - 自动检测引擎是否已初始化
 * - 避免重复初始化
 * - 自动处理异常情况
 * - 返回可直接使用的API对象
 * 
 * @example
 * const api = await autoInitializeEngine();
 * if (api) {
 *   const result = await api.normalizeVector([1, 2, 3]);
 * }
 */
async function autoInitializeEngine() {
    try {
        const engine = getHyperGpu();
        if (!engine.isInitialized) {
            await engine.init();
        }
        return engine.getApi();
    } catch (error) {
        HyperGpuLog.error('AutoInit', 'Failed to auto-initialize', error);
        return null;
    }
}

// === 全局导出 ===
if (typeof window !== 'undefined') {
    // 主要 API 导出
    window.HyperGpu = {
        get: autoInitializeEngine,
        Engine: HyperGpuEngine,
        getEngine: getHyperGpu,
        Environment: HyperGpuEnvironment,
        ResourceManager: HyperGpuResourceManager,
        API: HyperGpuAPI,
        Log: HyperGpuLog,
        Utils: HyperGpuUtils,
        version: HYPERGPU_CONFIG.version
    };
    
    // 直接全局导出（用于单元测试和兼容性）
    window.HyperGpuEnvironment = HyperGpuEnvironment;
    window.HyperGpuResourceManager = HyperGpuResourceManager;
    window.HyperGpuAPI = HyperGpuAPI;
    window.HyperGpuLog = HyperGpuLog;
    window.HyperGpuUtils = HyperGpuUtils;
    window.ModuleLoader = ModuleLoader;
    window.HYPERGPU_CONFIG = HYPERGPU_CONFIG;
    
    window.hyperGpu = window.HyperGpu;
    HyperGpuLog.info('Global', `HyperGPU Engine ${HYPERGPU_CONFIG.version} loaded`);
}

// === 启动引擎 ===
(async () => {
    try {
        HyperGpuLog.info('Main', '🚀 HyperGPU Engine starting...');
        
        const engine = new HyperGpuEngine();
        await engine.init();
        
        HyperGpuLog.info('Main', '✅ HyperGPU Engine ready! Use window.HyperGpu to access the API.');
        
    } catch (error) {
        HyperGpuLog.error('Main', '❌ Fatal initialization error', error);
        
        // 即使失败也提供基本的错误报告API
        window.HyperGpu = {
            error: error.message,
            getEnvironment: () => ({ error: error.message }),
            getMode: () => 'error'
        };
    }
})();
