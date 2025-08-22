/* tslint:disable */
/* eslint-disable */
/**
 * 初始化 Wasm 模块（在 JS 中调用，用于初始化内存和日志）
 */
export function init_wasm(): void;
/**
 * 向量归一化（预处理核心函数，3D专用）
 * 输入：向量数据指针（JS 中的 Float32Array 内存地址，包含3个元素）
 * 输出：无（直接修改输入内存）
 */
export function normalize_vector(vec_ptr: number): void;
/**
 * 通用向量归一化
 * 输入: ptr -> 指向 Float32Array 起始位置的指针，len -> 数组的长度（必须 > 0）
 * 输出: 无（就地归一化）
 */
export function normalize_vector_generic(ptr: number, len: number): void;
/**
 * 向量加法（通用维度）
 * 输入: a_ptr -> 向量A指针，b_ptr -> 向量B指针，len -> 向量长度
 * 输出: result_ptr -> 结果向量指针（A + B）
 */
export function vector_add(a_ptr: number, b_ptr: number, result_ptr: number, len: number): void;
/**
 * 向量减法（通用维度）
 * 输入: a_ptr -> 向量A指针，b_ptr -> 向量B指针，len -> 向量长度
 * 输出: result_ptr -> 结果向量指针（A - B）
 */
export function vector_sub(a_ptr: number, b_ptr: number, result_ptr: number, len: number): void;
/**
 * 向量数乘（通用维度）
 * 输入: scalar -> 标量，vec_ptr -> 向量指针，len -> 向量长度
 * 输出: result_ptr -> 结果向量指针（scalar * 向量）
 */
export function vector_scale(scalar: number, vec_ptr: number, result_ptr: number, len: number): void;
/**
 * 向量点积（通用维度）
 * 输入: a_ptr -> 向量A指针，b_ptr -> 向量B指针，len -> 向量长度
 * 输出: 点积结果（标量）
 */
export function vector_dot(a_ptr: number, b_ptr: number, len: number): number;
/**
 * 3D向量叉积
 * 输入: a_ptr -> 3D向量A指针，b_ptr -> 3D向量B指针
 * 输出: result_ptr -> 结果向量指针（A × B）
 */
export function vector_cross_3d(a_ptr: number, b_ptr: number, result_ptr: number): void;
/**
 * 矩阵乘法（3D 变换核心计算，4x4矩阵专用）
 * 输入：mat_a_ptr, mat_b_ptr -> 矩阵指针（16个f32，行优先），result_ptr -> 结果指针
 */
export function multiply_mat4(mat_a_ptr: number, mat_b_ptr: number, result_ptr: number): void;
/**
 * 通用 4x4 矩阵乘法
 * 输入: a_ptr, b_ptr -> 4x4矩阵指针，c_ptr -> 结果矩阵指针（C = A*B）
 */
export function multiply_mat4_generic(a_ptr: number, b_ptr: number, c_ptr: number): void;
/**
 * 矩阵转置（通用m×n矩阵）
 * 输入: mat_ptr -> 矩阵指针，rows -> 行数，cols -> 列数
 * 输出: result_ptr -> 转置矩阵指针（cols×rows）
 */
export function matrix_transpose(mat_ptr: number, rows: number, cols: number, result_ptr: number): void;
/**
 * 2x2矩阵行列式
 * 输入: mat_ptr -> 2x2矩阵指针（4个元素）
 * 输出: 行列式值
 */
export function matrix_det_2x2(mat_ptr: number): number;
/**
 * 3x3矩阵行列式（按第一行展开）
 * 输入: mat_ptr -> 3x3矩阵指针（9个元素）
 * 输出: 行列式值
 */
export function matrix_det_3x3(mat_ptr: number): number;
/**
 * 2x2矩阵逆（若可逆）
 * 输入: mat_ptr -> 2x2矩阵指针，result_ptr -> 逆矩阵指针
 * 输出: 是否可逆（true=成功）
 */
export function matrix_inv_2x2(mat_ptr: number, result_ptr: number): boolean;
/**
 * 二次型计算（x^T A x）
 * 输入: x_ptr -> 向量x指针（n元素），a_ptr -> n×n矩阵A指针，n -> 维度
 * 输出: 二次型结果（标量）
 */
export function quadratic_form(x_ptr: number, a_ptr: number, n: number): number;
/**
 * 粒子物理模拟预处理（筛选有效粒子并计算初始速度）
 */
export function preprocess_particles(particles_ptr: number, count: number, min_mass: number): ProcessedParticles;
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
 */
export function enhance_video_frame(input_data_ptr: number, in_width: number, in_height: number, out_width: number, out_height: number): ProcessedImage;
/**
 * 图像超分辨率 (双三次插值)
 */
export function super_resolution_bicubic(input_ptr: number, in_width: number, in_height: number, out_width: number, out_height: number): ProcessedImage;
/**
 * 处理后的图像数据结构（RGBA格式）
 */
export class ProcessedImage {
  private constructor();
  free(): void;
  readonly ptr: number;
  readonly len: number;
}
/**
 * 处理后的粒子数据结构
 * 内存布局：每个粒子占7个f32元素，顺序为：[x, y, z, mass, vx, vy, vz]
 */
export class ProcessedParticles {
  private constructor();
  free(): void;
  /**
   * 手动释放内存（也可自动释放）
   */
  free(): void;
  readonly ptr: number;
  readonly len: number;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly init_wasm: () => void;
  readonly normalize_vector: (a: number) => void;
  readonly normalize_vector_generic: (a: number, b: number) => void;
  readonly vector_add: (a: number, b: number, c: number, d: number) => void;
  readonly vector_sub: (a: number, b: number, c: number, d: number) => void;
  readonly vector_scale: (a: number, b: number, c: number, d: number) => void;
  readonly vector_dot: (a: number, b: number, c: number) => number;
  readonly vector_cross_3d: (a: number, b: number, c: number) => void;
  readonly multiply_mat4: (a: number, b: number, c: number) => void;
  readonly matrix_transpose: (a: number, b: number, c: number, d: number) => void;
  readonly matrix_det_2x2: (a: number) => number;
  readonly matrix_det_3x3: (a: number) => number;
  readonly matrix_inv_2x2: (a: number, b: number) => number;
  readonly quadratic_form: (a: number, b: number, c: number) => number;
  readonly __wbg_processedparticles_free: (a: number, b: number) => void;
  readonly processedparticles_free: (a: number) => void;
  readonly preprocess_particles: (a: number, b: number, c: number) => number;
  readonly __wbg_processedimage_free: (a: number, b: number) => void;
  readonly processedimage_ptr: (a: number) => number;
  readonly processedimage_len: (a: number) => number;
  readonly enhance_video_frame: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly super_resolution_bicubic: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly multiply_mat4_generic: (a: number, b: number, c: number) => void;
  readonly processedparticles_ptr: (a: number) => number;
  readonly processedparticles_len: (a: number) => number;
  readonly __wbindgen_export_0: WebAssembly.Table;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
