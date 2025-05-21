function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

function getColorForNode(id: string): string {
  const base = 16;
  const range = 216;
  const hash = hashString(id);
  const colorIndex = base + (hash % range);
  return `\x1b[38;5;${colorIndex}m`;
}

const levelColors: Record<string, string> = {
  debug: '\x1b[34m',
  info: '\x1b[36m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
};
const RESET = '\x1b[0m';

let log_level = 'info'

export function setLogLevel(level: string) {log_level = level;}

function createLogger(id: string) {
  const nodeColor = getColorForNode(id);
  const levels = ['debug', 'info', 'warn', 'error'];
  const shouldLog = (level: string) => levels.indexOf(level) >= levels.indexOf(log_level);
  const logWithLevel = (level: string, fn: (...args: any[]) => void) =>
    (...args: any[]) => {
      if (shouldLog(level)) {
        const levelColor = levelColors[level];
        const prefix = `[${levelColor}${level.toUpperCase()}${RESET}: ${nodeColor}node ${id}${RESET}] -- `;
        fn(prefix, ...args);
      }
    };
  return {
    debug: logWithLevel('debug', console.debug),
    info:  logWithLevel('info',  console.info),
    warn:  logWithLevel('warn',  console.warn),
    error: logWithLevel('error', console.error),
  };
}

export function installElementLogger(instance: any, getLevel: () => string) {
  if (!instance.__nodeId) {
    instance.__nodeId = instance.id || instance.localName || instance.tagName || instance.constructor.name;
  }
  if (!instance.log) {
    Object.defineProperty(instance, 'log', {
      value: createLogger(instance.__nodeId, getLevel),
      writable: false,
      configurable: false,
      enumerable: false,
    });
  }
}

export function installHeadlessLogger(instance: any, id: string, getLevel: () => string) {
  instance.__nodeId = id;
  if (!instance.log) {
    Object.defineProperty(instance, 'log', {
      value: createLogger(id, getLevel),
      writable: false,
      configurable: false,
      enumerable: false,
    });
  }
}
