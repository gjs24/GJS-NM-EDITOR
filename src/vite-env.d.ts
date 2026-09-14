/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE?: string;
  readonly VITE_ADMIN_PASSCODE?: string;
  readonly VITE_CASHFREE_APP_ID?: string;
  readonly VITE_CASHFREE_SECRET_KEY?: string;
  readonly VITE_CASHFREE_ENV?: 'sandbox' | 'production';
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_BASE_PATH?: string;
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
