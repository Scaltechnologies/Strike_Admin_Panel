export const VALIDATION = {
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  },
  EMAIL: {
    MAX_LENGTH: 254,
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
  },
  PHONE: {
    PATTERN: /^\+?[1-9]\d{6,14}$/,
  },
  OTP: {
    LENGTH: 6,
  },
  SEARCH: {
    MIN_LENGTH: 2,
    DEBOUNCE_MS: 300,
  },
} as const
