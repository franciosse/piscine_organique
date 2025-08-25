// lib/logger/logger.js
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

const isDev = process.env.NODE_ENV !== 'production';

const formatMessage = (level, message, ...args) => {
  const timestamp = new Date().toISOString();
  const color = {
    error: colors.red,
    warn: colors.yellow,
    info: colors.blue,
    debug: colors.gray
  }[level] || colors.reset;
  
  if (isDev) {
    return `${color}[${level.toUpperCase()}] ${timestamp}${colors.reset}`;
  }
  return `[${level.toUpperCase()}] ${timestamp}`;
};

const logger = {
  info: (message, ...args) => {
    console.log(formatMessage('info', message), message, ...args);
  },
  error: (message, ...args) => {
    console.error(formatMessage('error', message), message, ...args);
  },
  warn: (message, ...args) => {
    console.warn(formatMessage('warn', message), message, ...args);
  },
  debug: (message, ...args) => {
    if (isDev) {
      console.debug(formatMessage('debug', message), message, ...args);
    }
  },
};

export default logger;