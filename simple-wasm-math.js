// ==UserScript==
// @name         Vector Math WASM Library (Simplified)
// @namespace    https://github.com/kiwifruit13/wasm-lib
// @version      1.0.0
// @description  Simplified WebGPU WASM Core Library for easy vector math operations
// @author       kiwifruit13
// @license      MIT
// ==/UserScript==

(function(globalThis) {
    'use strict';

    // 引入完整的库
    if (typeof VectorMathWasmLib === 'undefined') {
        throw new Error('请先加载完整的 VectorMathWasmLib 库文件');
    }

    // ================================
    // 简化的向量数学 API
    // ================================
    
    class SimpleVectorMath {
        constructor() {
            this.ready = VectorMathWasmLib.ready;
            this._wasm = null;
        }

        async _ensureReady() {
            if (!this._wasm) {
                await this.ready;
                this._wasm = VectorMathWasmLib.utils.getWasm();
            }
        }

        // 内存管理辅助函数
        _withMemory(arrays, callback) {
            const pointers = [];
            const memory = new Uint8Array(this._wasm.memory.buffer);

            try {
                // 分配内存并复制数据
                for (const arr of arrays) {
                    const ptr = this._wasm.__wbindgen_malloc(arr.byteLength);
                    memory.set(new Uint8Array(arr.buffer), ptr);
                    pointers.push({ ptr, size: arr.byteLength });
                }

                // 执行回调
                return callback(pointers, memory);

            } finally {
                // 释放所有内存
                for (const { ptr, size } of pointers) {
                    this._wasm.__wbindgen_free(ptr, size);
                }
            }
        }

        // 读取结果辅助函数
        _readResult(memory, ptr, length) {
            const bytes = memory.slice(ptr, ptr + length * 4); // Float32 = 4 bytes
            return new Float32Array(bytes.buffer.slice(0, length * 4));
        }

        // ================================
        // 向量运算 API
        // ================================

        /**
         * 向量加法
         * @param {Float32Array} vec1 - 第一个向量
         * @param {Float32Array} vec2 - 第二个向量
         * @returns {Promise<Float32Array>} 结果向量
         */
        async add(vec1, vec2) {
            await this._ensureReady();
            
            if (vec1.length !== vec2.length) {
                throw new Error('向量长度必须相同');
            }

            const result = new Float32Array(vec1.length);
            return this._withMemory([vec1, vec2, result], (pointers, memory) => {
                const [vec1Ptr, vec2Ptr, resultPtr] = pointers.map(p => p.ptr);
                
                VectorMathWasmLib.vector.add(vec1Ptr, vec2Ptr, resultPtr, vec1.length);
                return this._readResult(memory, resultPtr, vec1.length);
            });
        }

        /**
         * 向量减法
         * @param {Float32Array} vec1 - 被减向量
         * @param {Float32Array} vec2 - 减数向量
         * @returns {Promise<Float32Array>} 结果向量
         */
        async subtract(vec1, vec2) {
            await this._ensureReady();
            
            if (vec1.length !== vec2.length) {
                throw new Error('向量长度必须相同');
            }

            const result = new Float32Array(vec1.length);
            return this._withMemory([vec1, vec2, result], (pointers, memory) => {
                const [vec1Ptr, vec2Ptr, resultPtr] = pointers.map(p => p.ptr);
                
                VectorMathWasmLib.vector.sub(vec1Ptr, vec2Ptr, resultPtr, vec1.length);
                return this._readResult(memory, resultPtr, vec1.length);
            });
        }

        /**
         * 向量数乘
         * @param {Float32Array} vec - 向量
         * @param {number} scalar - 标量
         * @returns {Promise<Float32Array>} 结果向量
         */
        async scale(vec, scalar) {
            await this._ensureReady();

            const result = new Float32Array(vec.length);
            return this._withMemory([vec, result], (pointers, memory) => {
                const [vecPtr, resultPtr] = pointers.map(p => p.ptr);
                
                VectorMathWasmLib.vector.scale(scalar, vecPtr, resultPtr, vec.length);
                return this._readResult(memory, resultPtr, vec.length);
            });
        }

        /**
         * 向量点积
         * @param {Float32Array} vec1 - 第一个向量
         * @param {Float32Array} vec2 - 第二个向量
         * @returns {Promise<number>} 点积结果
         */
        async dot(vec1, vec2) {
            await this._ensureReady();
            
            if (vec1.length !== vec2.length) {
                throw new Error('向量长度必须相同');
            }

            return this._withMemory([vec1, vec2], (pointers) => {
                const [vec1Ptr, vec2Ptr] = pointers.map(p => p.ptr);
                return VectorMathWasmLib.vector.dot(vec1Ptr, vec2Ptr, vec1.length);
            });
        }

        /**
         * 向量归一化
         * @param {Float32Array} vec - 输入向量
         * @returns {Promise<Float32Array>} 归一化后的向量
         */
        async normalize(vec) {
            await this._ensureReady();

            return this._withMemory([vec], (pointers, memory) => {
                const [vecPtr] = pointers.map(p => p.ptr);
                
                VectorMathWasmLib.vector.normalizeGeneric(vecPtr, vec.length);
                return this._readResult(memory, vecPtr, vec.length);
            });
        }

        /**
         * 3D向量叉积
         * @param {Float32Array} vec1 - 第一个3D向量
         * @param {Float32Array} vec2 - 第二个3D向量
         * @returns {Promise<Float32Array>} 叉积结果
         */
        async cross3D(vec1, vec2) {
            await this._ensureReady();
            
            if (vec1.length !== 3 || vec2.length !== 3) {
                throw new Error('叉积只支持3D向量');
            }

            const result = new Float32Array(3);
            return this._withMemory([vec1, vec2, result], (pointers, memory) => {
                const [vec1Ptr, vec2Ptr, resultPtr] = pointers.map(p => p.ptr);
                
                VectorMathWasmLib.vector.cross3d(vec1Ptr, vec2Ptr, resultPtr);
                return this._readResult(memory, resultPtr, 3);
            });
        }

        /**
         * 计算向量长度（模）
         * @param {Float32Array} vec - 输入向量
         * @returns {Promise<number>} 向量长度
         */
        async length(vec) {
            const dotProduct = await this.dot(vec, vec);
            return Math.sqrt(dotProduct);
        }

        /**
         * 计算两个向量的距离
         * @param {Float32Array} vec1 - 第一个向量
         * @param {Float32Array} vec2 - 第二个向量
         * @returns {Promise<number>} 距离
         */
        async distance(vec1, vec2) {
            const diff = await this.subtract(vec1, vec2);
            return await this.length(diff);
        }

        /**
         * 向量线性插值
         * @param {Float32Array} vec1 - 起始向量
         * @param {Float32Array} vec2 - 结束向量
         * @param {number} t - 插值参数 [0, 1]
         * @returns {Promise<Float32Array>} 插值结果
         */
        async lerp(vec1, vec2, t) {
            if (t < 0 || t > 1) {
                throw new Error('插值参数t必须在[0,1]范围内');
            }

            const scaled1 = await this.scale(vec1, 1 - t);
            const scaled2 = await this.scale(vec2, t);
            return await this.add(scaled1, scaled2);
        }

        // ================================
        // 批量操作 API
        // ================================

        /**
         * 批量向量加法
         * @param {Float32Array[]} vectors - 向量数组
         * @returns {Promise<Float32Array>} 所有向量的和
         */
        async addMany(vectors) {
            if (vectors.length === 0) {
                throw new Error('向量数组不能为空');
            }

            let result = vectors[0];
            for (let i = 1; i < vectors.length; i++) {
                result = await this.add(result, vectors[i]);
            }
            return result;
        }

        /**
         * 计算向量数组的平均值
         * @param {Float32Array[]} vectors - 向量数组
         * @returns {Promise<Float32Array>} 平均向量
         */
        async average(vectors) {
            const sum = await this.addMany(vectors);
            return await this.scale(sum, 1.0 / vectors.length);
        }
    }

    // ================================
    // 矩阵运算简化 API
    // ================================

    class SimpleMatrixMath {
        constructor() {
            this.ready = VectorMathWasmLib.ready;
            this._wasm = null;
        }

        async _ensureReady() {
            if (!this._wasm) {
                await this.ready;
                this._wasm = VectorMathWasmLib.utils.getWasm();
            }
        }

        /**
         * 4x4矩阵乘法
         * @param {Float32Array} matA - 矩阵A (16个元素)
         * @param {Float32Array} matB - 矩阵B (16个元素)
         * @returns {Promise<Float32Array>} 结果矩阵
         */
        async multiply4x4(matA, matB) {
            await this._ensureReady();

            if (matA.length !== 16 || matB.length !== 16) {
                throw new Error('4x4矩阵必须包含16个元素');
            }

            const result = new Float32Array(16);
            const memory = new Uint8Array(this._wasm.memory.buffer);
            
            const matAPtr = this._wasm.__wbindgen_malloc(matA.byteLength);
            const matBPtr = this._wasm.__wbindgen_malloc(matB.byteLength);
            const resultPtr = this._wasm.__wbindgen_malloc(result.byteLength);

            try {
                memory.set(new Uint8Array(matA.buffer), matAPtr);
                memory.set(new Uint8Array(matB.buffer), matBPtr);

                VectorMathWasmLib.matrix.multiply4x4(matAPtr, matBPtr, resultPtr);

                const resultBytes = memory.slice(resultPtr, resultPtr + result.byteLength);
                return new Float32Array(resultBytes.buffer.slice(0, result.byteLength));

            } finally {
                this._wasm.__wbindgen_free(matAPtr, matA.byteLength);
                this._wasm.__wbindgen_free(matBPtr, matB.byteLength);
                this._wasm.__wbindgen_free(resultPtr, result.byteLength);
            }
        }

        /**
         * 计算2x2矩阵行列式
         * @param {Float32Array} mat - 2x2矩阵 (4个元素)
         * @returns {Promise<number>} 行列式值
         */
        async determinant2x2(mat) {
            await this._ensureReady();

            if (mat.length !== 4) {
                throw new Error('2x2矩阵必须包含4个元素');
            }

            const memory = new Uint8Array(this._wasm.memory.buffer);
            const matPtr = this._wasm.__wbindgen_malloc(mat.byteLength);

            try {
                memory.set(new Uint8Array(mat.buffer), matPtr);
                return VectorMathWasmLib.matrix.det2x2(matPtr);

            } finally {
                this._wasm.__wbindgen_free(matPtr, mat.byteLength);
            }
        }
    }

    // ================================
    // 创建简化的全局对象
    // ================================

    const SimpleWasmMath = {
        vector: new SimpleVectorMath(),
        matrix: new SimpleMatrixMath(),
        
        // 准备状态
        get ready() {
            return VectorMathWasmLib.ready;
        },

        // 工具函数
        utils: {
            /**
             * 创建3D向量
             * @param {number} x 
             * @param {number} y 
             * @param {number} z 
             * @returns {Float32Array}
             */
            vec3(x = 0, y = 0, z = 0) {
                return new Float32Array([x, y, z]);
            },

            /**
             * 创建2D向量
             * @param {number} x 
             * @param {number} y 
             * @returns {Float32Array}
             */
            vec2(x = 0, y = 0) {
                return new Float32Array([x, y]);
            },

            /**
             * 从数组创建向量
             * @param {number[]} arr 
             * @returns {Float32Array}
             */
            vec(arr) {
                return new Float32Array(arr);
            },

            /**
             * 创建4x4单位矩阵
             * @returns {Float32Array}
             */
            identity4x4() {
                return new Float32Array([
                    1, 0, 0, 0,
                    0, 1, 0, 0,
                    0, 0, 1, 0,
                    0, 0, 0, 1
                ]);
            },

            /**
             * 将向量转换为数组以便打印
             * @param {Float32Array} vec 
             * @returns {number[]}
             */
            toArray(vec) {
                return Array.from(vec);
            }
        }
    };

    // ================================
    // 暴露到全局作用域
    // ================================

    globalThis.SimpleWasmMath = SimpleWasmMath;

    // 为了方便，也创建一些全局快捷函数
    globalThis.vec3 = SimpleWasmMath.utils.vec3;
    globalThis.vec2 = SimpleWasmMath.utils.vec2;
    globalThis.vec = SimpleWasmMath.utils.vec;

    console.log('简化版 WASM 数学库已加载！使用 SimpleWasmMath 访问功能。');

})(typeof window !== 'undefined' ? window : globalThis);