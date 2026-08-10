export const API_CONFIG = {
  TIMEOUT: 30_000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1_000,
  HEADERS: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
} as const
