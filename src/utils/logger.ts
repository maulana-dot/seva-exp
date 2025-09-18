type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  data?: unknown
}

class Logger {
  private isDevelopment = import.meta.env.DEV

  private log(level: LogLevel, message: string, data?: unknown): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      data,
    }

    if (this.isDevelopment) {
      const style = this.getConsoleStyle(level)
      console.log(
        `%c[${level.toUpperCase()}] ${entry.timestamp}`,
        style,
        message,
        data ? data : ''
      )
    }

    // In production, you might want to send logs to an external service
    if (!this.isDevelopment && level === 'error') {
      this.sendToLogService(entry)
    }
  }

  private getConsoleStyle(level: LogLevel): string {
    const styles = {
      debug: 'color: #6366f1',
      info: 'color: #059669',
      warn: 'color: #d97706',
      error: 'color: #dc2626',
    }
    return styles[level]
  }

  private sendToLogService(entry: LogEntry): void {
    // Implement external logging service integration
    // For now, just store in localStorage for debugging
    const logs = JSON.parse(localStorage.getItem('app_logs') || '[]')
    logs.push(entry)
    localStorage.setItem('app_logs', JSON.stringify(logs.slice(-100))) // Keep last 100 logs
  }

  debug(message: string, data?: unknown): void {
    this.log('debug', message, data)
  }

  info(message: string, data?: unknown): void {
    this.log('info', message, data)
  }

  warn(message: string, data?: unknown): void {
    this.log('warn', message, data)
  }

  error(message: string, data?: unknown): void {
    this.log('error', message, data)
  }
}

export const logger = new Logger()