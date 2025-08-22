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
/**
 * 初始化 Wasm 模块（在 JS 中调用，用于初始化内存和日志）
 */
export function init_wasm() {
    wasm.init_wasm();
}

/**
 * 向量归一化（预处理核心函数，3D专用）
 * 输入：向量数据指针（JS 中的 Float32Array 内存地址，包含3个元素）
 * 输出：无（直接修改输入内存）
 * @param {number} vec_ptr
 */
export function normalize_vector(vec_ptr) {
    wasm.normalize_vector(vec_ptr);
}

/**
 * 通用向量归一化
 * 输入: ptr -> 指向 Float32Array 起始位置的指针，len -> 数组的长度（必须 > 0）
 * 输出: 无（就地归一化）
 * @param {number} ptr
 * @param {number} len
 */
export function normalize_vector_generic(ptr, len) {
    wasm.normalize_vector_generic(ptr, len);
}

/**
 * 向量加法（通用维度）
 * 输入: a_ptr -> 向量A指针，b_ptr -> 向量B指针，len -> 向量长度
 * 输出: result_ptr -> 结果向量指针（A + B）
 * @param {number} a_ptr
 * @param {number} b_ptr
 * @param {number} result_ptr
 * @param {number} len
 */
export function vector_add(a_ptr, b_ptr, result_ptr, len) {
    wasm.vector_add(a_ptr, b_ptr, result_ptr, len);
}

/**
 * 向量减法（通用维度）
 * 输入: a_ptr -> 向量A指针，b_ptr -> 向量B指针，len -> 向量长度
 * 输出: result_ptr -> 结果向量指针（A - B）
 * @param {number} a_ptr
 * @param {number} b_ptr
 * @param {number} result_ptr
 * @param {number} len
 */
export function vector_sub(a_ptr, b_ptr, result_ptr, len) {
    wasm.vector_sub(a_ptr, b_ptr, result_ptr, len);
}

/**
 * 向量数乘（通用维度）
 * 输入: scalar -> 标量，vec_ptr -> 向量指针，len -> 向量长度
 * 输出: result_ptr -> 结果向量指针（scalar * 向量）
 * @param {number} scalar
 * @param {number} vec_ptr
 * @param {number} result_ptr
 * @param {number} len
 */
export function vector_scale(scalar, vec_ptr, result_ptr, len) {
    wasm.vector_scale(scalar, vec_ptr, result_ptr, len);
}

/**
 * 向量点积（通用维度）
 * 输入: a_ptr -> 向量A指针，b_ptr -> 向量B指针，len -> 向量长度
 * 输出: 点积结果（标量）
 * @param {number} a_ptr
 * @param {number} b_ptr
 * @param {number} len
 * @returns {number}
 */
export function vector_dot(a_ptr, b_ptr, len) {
    const ret = wasm.vector_dot(a_ptr, b_ptr, len);
    return ret;
}

/**
 * 3D向量叉积
 * 输入: a_ptr -> 3D向量A指针，b_ptr -> 3D向量B指针
 * 输出: result_ptr -> 结果向量指针（A × B）
 * @param {number} a_ptr
 * @param {number} b_ptr
 * @param {number} result_ptr
 */
export function vector_cross_3d(a_ptr, b_ptr, result_ptr) {
    wasm.vector_cross_3d(a_ptr, b_ptr, result_ptr);
}

/**
 * 矩阵乘法（3D 变换核心计算，4x4矩阵专用）
 * 输入：mat_a_ptr, mat_b_ptr -> 矩阵指针（16个f32，行优先），result_ptr -> 结果指针
 * @param {number} mat_a_ptr
 * @param {number} mat_b_ptr
 * @param {number} result_ptr
 */
export function multiply_mat4(mat_a_ptr, mat_b_ptr, result_ptr) {
    wasm.multiply_mat4(mat_a_ptr, mat_b_ptr, result_ptr);
}

/**
 * 通用 4x4 矩阵乘法
 * 输入: a_ptr, b_ptr -> 4x4矩阵指针，c_ptr -> 结果矩阵指针（C = A*B）
 * @param {number} a_ptr
 * @param {number} b_ptr
 * @param {number} c_ptr
 */
export function multiply_mat4_generic(a_ptr, b_ptr, c_ptr) {
    wasm.multiply_mat4(a_ptr, b_ptr, c_ptr);
}

/**
 * 矩阵转置（通用m×n矩阵）
 * 输入: mat_ptr -> 矩阵指针，rows -> 行数，cols -> 列数
 * 输出: result_ptr -> 转置矩阵指针（cols×rows）
 * @param {number} mat_ptr
 * @param {number} rows
 * @param {number} cols
 * @param {number} result_ptr
 */
export function matrix_transpose(mat_ptr, rows, cols, result_ptr) {
    wasm.matrix_transpose(mat_ptr, rows, cols, result_ptr);
}

/**
 * 2x2矩阵行列式
 * 输入: mat_ptr -> 2x2矩阵指针（4个元素）
 * 输出: 行列式值
 * @param {number} mat_ptr
 * @returns {number}
 */
export function matrix_det_2x2(mat_ptr) {
    const ret = wasm.matrix_det_2x2(mat_ptr);
    return ret;
}

/**
 * 3x3矩阵行列式（按第一行展开）
 * 输入: mat_ptr -> 3x3矩阵指针（9个元素）
 * 输出: 行列式值
 * @param {number} mat_ptr
 * @returns {number}
 */
export function matrix_det_3x3(mat_ptr) {
    const ret = wasm.matrix_det_3x3(mat_ptr);
    return ret;
}

/**
 * 2x2矩阵逆（若可逆）
 * 输入: mat_ptr -> 2x2矩阵指针，result_ptr -> 逆矩阵指针
 * 输出: 是否可逆（true=成功）
 * @param {number} mat_ptr
 * @param {number} result_ptr
 * @returns {boolean}
 */
export function matrix_inv_2x2(mat_ptr, result_ptr) {
    const ret = wasm.matrix_inv_2x2(mat_ptr, result_ptr);
    return ret !== 0;
}

/**
 * 二次型计算（x^T A x）
 * 输入: x_ptr -> 向量x指针（n元素），a_ptr -> n×n矩阵A指针，n -> 维度
 * 输出: 二次型结果（标量）
 * @param {number} x_ptr
 * @param {number} a_ptr
 * @param {number} n
 * @returns {number}
 */
export function quadratic_form(x_ptr, a_ptr, n) {
    const ret = wasm.quadratic_form(x_ptr, a_ptr, n);
    return ret;
}

/**
 * 粒子物理模拟预处理（筛选有效粒子并计算初始速度）
 * @param {number} particles_ptr
 * @param {number} count
 * @param {number} min_mass
 * @returns {ProcessedParticles}
 */
export function preprocess_particles(particles_ptr, count, min_mass) {
    const ret = wasm.preprocess_particles(particles_ptr, count, min_mass);
    return ProcessedParticles.__wrap(ret);
}

/**
 * 为视频帧处理优化的超分辨率函数
 * 输入:
 *   input_data_ptr: 指向 Uint8Array 数据的指针 (RGBA)
 *   in_width:     输入图像宽度
 *   in_height:    输入图像高度
 *   out_width:    输出图像期望宽度
 *   out_height:   输出图像期望高度
 * 输出:
 *   ProcessedImage: 包含处理后图像数据的结构体
 * @param {number} input_data_ptr
 * @param {number} in_width
 * @param {number} in_height
 * @param {number} out_width
 * @param {number} out_height
 * @returns {ProcessedImage}
 */
export function enhance_video_frame(input_data_ptr, in_width, in_height, out_width, out_height) {
    const ret = wasm.enhance_video_frame(input_data_ptr, in_width, in_height, out_width, out_height);
    return ProcessedImage.__wrap(ret);
}

/**
 * 图像超分辨率 (双三次插值)
 * @param {number} input_ptr
 * @param {number} in_width
 * @param {number} in_height
 * @param {number} out_width
 * @param {number} out_height
 * @returns {ProcessedImage}
 */
export function super_resolution_bicubic(input_ptr, in_width, in_height, out_width, out_height) {
    const ret = wasm.super_resolution_bicubic(input_ptr, in_width, in_height, out_width, out_height);
    return ProcessedImage.__wrap(ret);
}

const ProcessedImageFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_processedimage_free(ptr >>> 0, 1));
/**
 * 处理后的图像数据结构（RGBA格式）
 */
export class ProcessedImage {

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
    /**
     * @returns {number}
     */
    get ptr() {
        const ret = wasm.processedimage_ptr(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get len() {
        const ret = wasm.processedimage_len(this.__wbg_ptr);
        return ret >>> 0;
    }
}

const ProcessedParticlesFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_processedparticles_free(ptr >>> 0, 1));
/**
 * 处理后的粒子数据结构
 * 内存布局：每个粒子占7个f32元素，顺序为：[x, y, z, mass, vx, vy, vz]
 */
export class ProcessedParticles {

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
    /**
     * 手动释放内存（也可自动释放）
     */
    free() {
        wasm.processedparticles_free(this.__wbg_ptr);
    }
    /**
     * @returns {number}
     */
    get ptr() {
        const ret = wasm.processedimage_ptr(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get len() {
        const ret = wasm.processedimage_len(this.__wbg_ptr);
        return ret >>> 0;
    }
}

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

}

function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    __wbg_init.__wbindgen_wasm_module = module;
    cachedUint8ArrayMemory0 = null;


    wasm.__wbindgen_start();
    return wasm;
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (typeof module !== 'undefined') {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();

    __wbg_init_memory(imports);

    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }

    const instance = new WebAssembly.Instance(module, imports);

    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (typeof module_or_path !== 'undefined') {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (typeof module_or_path === 'undefined') {
        module_or_path = new URL('webgpu_wasm_core_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    __wbg_init_memory(imports);

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync };
export default __wbg_init;
