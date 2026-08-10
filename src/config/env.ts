const env = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL as string) ?? '',
  appName: (import.meta.env.VITE_APP_NAME as string) || 'Strike Admin',
  environment: (import.meta.env.VITE_ENV as string) || 'development',
  version: (import.meta.env.VITE_APP_VERSION as string) || '1.0.0',
  isDevelopment: import.meta.env.DEV as boolean,
  isProduction: import.meta.env.PROD as boolean,
} as const

export default env
