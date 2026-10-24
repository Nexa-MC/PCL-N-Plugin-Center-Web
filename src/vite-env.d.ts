/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BILLING_PROVIDER?: 'waffo' | 'paddle';
  /** Paddle 环境：sandbox 或 production；未设置时启动必须报错，禁止默认。 */
  readonly VITE_PADDLE_ENV: 'sandbox' | 'production';
  /** Paddle 客户端令牌（sandbox 令牌以 test_ 开头）。 */
  readonly VITE_PADDLE_CLIENT_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
