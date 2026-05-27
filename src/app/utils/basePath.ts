// 单源 basePath 字面量。同时被客户端代码和 next.config.ts 消费。
// 修改 basePath 改这里一处即可；不要再写 env 字段或 process.env 注入。
// Standalone (Tauri / Docker root) 走根目录，不带前缀。
export const BASE_PATH = "";
