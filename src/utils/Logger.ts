// Logger.ts - Structured logging utility
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

export class Logger {
  private static level: LogLevel = import.meta.env.PROD ? LogLevel.ERROR : LogLevel.INFO;
  
  static setLevel(level: LogLevel): void {
    this.level = level;
  }
  
  static error(message: string, ...args: any[]): void {
    if (this.level >= LogLevel.ERROR) {
      console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...args);
    }
  }
  
  static warn(message: string, ...args: any[]): void {
    if (this.level >= LogLevel.WARN) {
      console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args);
    }
  }
  
  static info(message: string, ...args: any[]): void {
    if (this.level >= LogLevel.INFO) {
      console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...args);
    }
  }
  
  static debug(message: string, ...args: any[]): void {
    if (this.level >= LogLevel.DEBUG) {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...args);
    }
  }
}
