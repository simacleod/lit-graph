// src/log.ts

// Generate a simple numeric hash of the node ID for color generation
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

// ANSI escape codes for 256-color foreground
function ansiColorForNode(id: string): string {
  const hash = hashString(id);
  const base = 16;
  const range = 216;
  const colorIndex = base + (hash % range);
  return `\x1b[38;5;${colorIndex}m`;
}
// CSS HSL color for browser console
function cssColorForNode(id: string): string {
  const hash = hashString(id);
  const hue = hash % 360;
  return `color: hsl(${hue}, 60%, 50%)`;
}

const RESET = '\x1b[0m';
const levelAnsiColors: Record<string, string> = {
  debug: '\x1b[34m', // blue
  info: '\x1b[36m', // cyan
  warn: '\x1b[33m', // yellow
  error: '\x1b[31m', // red
};
const levelCssStyles: Record<string, string> = {
  debug: 'color: blue',
  info: 'color: teal',
  warn: 'color: orange',
  error: 'color: red',
};

let logLevel = 'info';
export function setLogLevel(level: string) {
  logLevel = level;
}

// Detect browser vs terminal
const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

function createLogger(id: string) {
  const ansiNodeColor = ansiColorForNode(id);
  const cssNodeStyle = cssColorForNode(id);
  const levels = ['debug', 'info', 'warn', 'error'];
  const shouldLog = (level: string) => levels.indexOf(level) >= levels.indexOf(logLevel);

  const makeLogger = (level: string, fn: (...args: any[]) => void) => {
    if (isBrowser) {
      // Browser console: use CSS styling with %c
      const levelStyle = levelCssStyles[level] || '';
      return (...args: any[]) => {
        if (!shouldLog(level)) return;
        const prefix = `%c[${level.toUpperCase()}]%c [${id}] --`;
        fn(prefix, levelStyle, cssNodeStyle, ...args);
      };
    } else {
      // Terminal: use ANSI escapes
      const levelAnsi = levelAnsiColors[level] || '';
      return (...args: any[]) => {
        if (!shouldLog(level)) return;
        const prefix = `[${levelAnsi}${level.toUpperCase()}${RESET}:${ansiNodeColor}node ${id}${RESET}] --`;
        fn(prefix, ...args);
      };
    }
  };

  return {
    debug: makeLogger('debug', console.debug),
    info: makeLogger('info', console.info),
    warn: makeLogger('warn', console.warn),
    error: makeLogger('error', console.error),
  };
}

export function installElementLogger(instance: any, id?: string) {
  const nodeId = instance.__nodeId || id || instance.id || instance.localName || instance.constructor.name;
  if (!instance.__nodeId) instance.__nodeId = nodeId;
  if (!instance.log) {
    Object.defineProperty(instance, 'log', {
      value: createLogger(nodeId),
      writable: false,
      configurable: false,
      enumerable: false,
    });
  }
}

export function installHeadlessLogger(instance: any, id: string) {
  const nodeId = id;
  if (!instance.__nodeId) instance.__nodeId = nodeId;
  if (!instance.log) {
    Object.defineProperty(instance, 'log', {
      value: createLogger(nodeId),
      writable: false,
      configurable: false,
      enumerable: false,
    });
  }
}
