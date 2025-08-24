// ==UserScript==
// @name         Vector Math WASM Library
// @namespace    https://github.com/kiwifruit13/wasm-lib
// @version      1.0.0
// @description  WebGPU WASM Core Library - Vector Math & Image Processing (For @require)
// @author       kiwifruit13
// @license      MIT
// ==/UserScript==

(function(globalThis) {
    'use strict';

    // ================================
    // WASM 胶水代码开始 (基于 020.txt)
    // ================================
    
    let wasm;

    const cachedTextDecoder = (typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', { ignoreBOM: true, fatal: true }) : { decode: () => { throw Error('TextDecoder not available') } } );

    if (typeof TextDecoder !== 'undefined') { cachedTextDecoder.decode(); };

    let cachedUint8ArrayMemory0 = null;

    function getUint8ArrayMemory0() {
        if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
            cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
        }
        return cachedUint8ArrayMemory0;
    }

    function getStringFromWasm0(ptr, len) {
        ptr = ptr >>> 0;
        return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
    }

    // ================================
    // 向量数学函数
    // ================================
    
    function init_wasm() {
        wasm.init_wasm();
    }

    function normalize_vector(vec_ptr) {
        wasm.normalize_vector(vec_ptr);
    }

    function normalize_vector_generic(ptr, len) {
        wasm.normalize_vector_generic(ptr, len);
    }

    function vector_add(a_ptr, b_ptr, result_ptr, len) {
        wasm.vector_add(a_ptr, b_ptr, result_ptr, len);
    }

    function vector_sub(a_ptr, b_ptr, result_ptr, len) {
        wasm.vector_sub(a_ptr, b_ptr, result_ptr, len);
    }

    function vector_scale(scalar, vec_ptr, result_ptr, len) {
        wasm.vector_scale(scalar, vec_ptr, result_ptr, len);
    }

    function vector_dot(a_ptr, b_ptr, len) {
        const ret = wasm.vector_dot(a_ptr, b_ptr, len);
        return ret;
    }

    function vector_cross_3d(a_ptr, b_ptr, result_ptr) {
        wasm.vector_cross_3d(a_ptr, b_ptr, result_ptr);
    }

    // ================================
    // 矩阵运算函数
    // ================================
    
    function multiply_mat4(mat_a_ptr, mat_b_ptr, result_ptr) {
        wasm.multiply_mat4(mat_a_ptr, mat_b_ptr, result_ptr);
    }

    function multiply_mat4_generic(a_ptr, b_ptr, c_ptr) {
        wasm.multiply_mat4(a_ptr, b_ptr, c_ptr);
    }

    function matrix_transpose(mat_ptr, rows, cols, result_ptr) {
        wasm.matrix_transpose(mat_ptr, rows, cols, result_ptr);
    }

    function matrix_det_2x2(mat_ptr) {
        const ret = wasm.matrix_det_2x2(mat_ptr);
        return ret;
    }

    function matrix_det_3x3(mat_ptr) {
        const ret = wasm.matrix_det_3x3(mat_ptr);
        return ret;
    }

    function matrix_inv_2x2(mat_ptr, result_ptr) {
        const ret = wasm.matrix_inv_2x2(mat_ptr, result_ptr);
        return ret !== 0;
    }

    function quadratic_form(x_ptr, a_ptr, n) {
        const ret = wasm.quadratic_form(x_ptr, a_ptr, n);
        return ret;
    }

    // ================================
    // 处理后的图像数据结构
    // ================================
    
    const ProcessedImageFinalization = (typeof FinalizationRegistry === 'undefined')
        ? { register: () => {}, unregister: () => {} }
        : new FinalizationRegistry(ptr => wasm.__wbg_processedimage_free(ptr >>> 0, 1));

    class ProcessedImage {
        static __wrap(ptr) {
            ptr = ptr >>> 0;
            const obj = Object.create(ProcessedImage.prototype);
            obj.__wbg_ptr = ptr;
            ProcessedImageFinalization.register(obj, obj.__wbg_ptr, obj);
            return obj;
        }

        __destroy_into_raw() {
            const ptr = this.__wbg_ptr;
            this.__wbg_ptr = 0;
            ProcessedImageFinalization.unregister(this);
            return ptr;
        }

        free() {
            const ptr = this.__destroy_into_raw();
            wasm.__wbg_processedimage_free(ptr, 0);
        }

        get ptr() {
            const ret = wasm.processedimage_ptr(this.__wbg_ptr);
            return ret >>> 0;
        }

        get len() {
            const ret = wasm.processedimage_len(this.__wbg_ptr);
            return ret >>> 0;
        }
    }

    // ================================
    // 处理后的粒子数据结构
    // ================================
    
    const ProcessedParticlesFinalization = (typeof FinalizationRegistry === 'undefined')
        ? { register: () => {}, unregister: () => {} }
        : new FinalizationRegistry(ptr => wasm.__wbg_processedparticles_free(ptr >>> 0, 1));

    class ProcessedParticles {
        static __wrap(ptr) {
            ptr = ptr >>> 0;
            const obj = Object.create(ProcessedParticles.prototype);
            obj.__wbg_ptr = ptr;
            ProcessedParticlesFinalization.register(obj, obj.__wbg_ptr, obj);
            return obj;
        }

        __destroy_into_raw() {
            const ptr = this.__wbg_ptr;
            this.__wbg_ptr = 0;
            ProcessedParticlesFinalization.unregister(this);
            return ptr;
        }

        free() {
            const ptr = this.__destroy_into_raw();
            wasm.__wbg_processedparticles_free(ptr, 0);
        }

        get ptr() {
            const ret = wasm.processedimage_ptr(this.__wbg_ptr);
            return ret >>> 0;
        }

        get len() {
            const ret = wasm.processedimage_len(this.__wbg_ptr);
            return ret >>> 0;
        }
    }

    // ================================
    // 粒子和图像处理函数
    // ================================
    
    function preprocess_particles(particles_ptr, count, min_mass) {
        const ret = wasm.preprocess_particles(particles_ptr, count, min_mass);
        return ProcessedParticles.__wrap(ret);
    }

    function enhance_video_frame(input_data_ptr, in_width, in_height, out_width, out_height) {
        const ret = wasm.enhance_video_frame(input_data_ptr, in_width, in_height, out_width, out_height);
        return ProcessedImage.__wrap(ret);
    }

    function super_resolution_bicubic(input_ptr, in_width, in_height, out_width, out_height) {
        const ret = wasm.super_resolution_bicubic(input_ptr, in_width, in_height, out_width, out_height);
        return ProcessedImage.__wrap(ret);
    }

    // ================================
    // WASM 加载和初始化逻辑
    // ================================
    
    async function __wbg_load(module, imports) {
        if (typeof Response === 'function' && module instanceof Response) {
            if (typeof WebAssembly.instantiateStreaming === 'function') {
                try {
                    return await WebAssembly.instantiateStreaming(module, imports);
                } catch (e) {
                    if (module.headers.get('Content-Type') != 'application/wasm') {
                        console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);
                    } else {
                        throw e;
                    }
                }
            }

            const bytes = await module.arrayBuffer();
            return await WebAssembly.instantiate(bytes, imports);
        } else {
            const instance = await WebAssembly.instantiate(module, imports);

            if (instance instanceof WebAssembly.Instance) {
                return { instance, module };
            } else {
                return instance;
            }
        }
    }

    function __wbg_get_imports() {
        const imports = {};
        imports.wbg = {};
        imports.wbg.__wbindgen_init_externref_table = function() {
            const table = wasm.__wbindgen_export_0;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
            ;
        };
        imports.wbg.__wbindgen_throw = function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        };

        return imports;
    }

    function __wbg_init_memory(imports, memory) {
        // 内存初始化逻辑
    }

    function __wbg_finalize_init(instance, module) {
        wasm = instance.exports;
        cachedUint8ArrayMemory0 = null;
        wasm.__wbindgen_start();
        return wasm;
    }

    // ================================
    // 自定义初始化函数（解决非模块化问题）
    // ================================
    
    // WASM 文件 URL（使用 jsDelivr CDN）
    // 基于用户的实际 GitHub 仓库：kiwifruit13/wasm
    const WASM_URL = 'https://cdn.jsdelivr.net/gh/kiwifruit13/wasm@main/webgpu_wasm_core_bg.wasm';

    async function __wbg_init_custom(wasmUrl) {
        if (wasm !== undefined) return wasm;

        const url = wasmUrl || WASM_URL;
        const imports = __wbg_get_imports();
        __wbg_init_memory(imports);

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch WASM module: ${response.status} ${response.statusText}`);
            }

            const { instance, module } = await __wbg_load(response, imports);
            return __wbg_finalize_init(instance, module);
        } catch (error) {
            console.error('WASM initialization failed:', error);
            throw error;
        }
    }

    // 同步初始化函数
    function initSync(module) {
        if (wasm !== undefined) return wasm;

        const imports = __wbg_get_imports();
        __wbg_init_memory(imports);

        if (!(module instanceof WebAssembly.Module)) {
            module = new WebAssembly.Module(module);
        }

        const instance = new WebAssembly.Instance(module, imports);
        return __wbg_finalize_init(instance, module);
    }

    // ================================
    // 创建全局库对象
    // ================================
    
    const VectorMathWasmLib = {
        // 初始化状态
        _initialized: false,
        ready: null,
        
        // 手动设置 WASM URL
        setWasmUrl: function(url) {
            if (this._initialized) {
                console.warn('WASM library already initialized. URL change will not take effect.');
                return;
            }
            WASM_URL = url;
        },

        // 初始化函数
        init: function(wasmUrl) {
            if (this._initialized) {
                return this.ready;
            }

            this.ready = __wbg_init_custom(wasmUrl).then(initializedWasm => {
                this._initialized = true;
                console.log('Vector Math WASM Library initialized successfully!');
                return initializedWasm;
            }).catch(error => {
                console.error('Vector Math WASM Library initialization failed:', error);
                throw error;
            });

            return this.ready;
        },

        // 获取 WASM 内存操作函数
        getMemory: function() {
            if (!wasm) throw new Error('WASM not initialized. Call init() first.');
            return {
                buffer: wasm.memory.buffer,
                getUint8Array: getUint8ArrayMemory0
            };
        },

        // ================================
        // 向量数学 API
        // ================================
        vector: {
            init: init_wasm,
            normalize: normalize_vector,
            normalizeGeneric: normalize_vector_generic,
            add: vector_add,
            sub: vector_sub,
            scale: vector_scale,
            dot: vector_dot,
            cross3d: vector_cross_3d
        },

        // ================================
        // 矩阵运算 API  
        // ================================
        matrix: {
            multiply4x4: multiply_mat4,
            multiply4x4Generic: multiply_mat4_generic,
            transpose: matrix_transpose,
            det2x2: matrix_det_2x2,
            det3x3: matrix_det_3x3,
            inv2x2: matrix_inv_2x2,
            quadraticForm: quadratic_form
        },

        // ================================
        // 图像处理 API
        // ================================
        image: {
            enhanceVideoFrame: enhance_video_frame,
            superResolutionBicubic: super_resolution_bicubic,
            ProcessedImage: ProcessedImage
        },

        // ================================
        // 粒子处理 API
        // ================================
        particles: {
            preprocess: preprocess_particles,
            ProcessedParticles: ProcessedParticles
        },

        // ================================
        // 工具函数
        // ================================
        utils: {
            // 同步初始化（如果已有 WASM 模块）
            initSync: initSync,
            
            // 检查是否已初始化
            isInitialized: function() {
                return VectorMathWasmLib._initialized && wasm !== undefined;
            },

            // 获取原始 wasm 对象（高级用法）
            getWasm: function() {
                if (!wasm) throw new Error('WASM not initialized. Call init() first.');
                return wasm;
            }
        }
    };

    // ================================
    // 立即初始化（可选）
    // ================================
    
    // 自动开始初始化过程（但不阻塞）
    VectorMathWasmLib.ready = VectorMathWasmLib.init();

    // ================================
    // 暴露到全局作用域
    // ================================
    
    // 主库对象
    globalThis.VectorMathWasmLib = VectorMathWasmLib;
    
    // 为了兼容，也将类直接暴露到全局
    globalThis.ProcessedImage = ProcessedImage;
    globalThis.ProcessedParticles = ProcessedParticles;

    // 调试信息
    console.log('Vector Math WASM Library loaded. Use VectorMathWasmLib.ready.then() to wait for initialization.');

})(typeof window !== 'undefined' ? window : globalThis);