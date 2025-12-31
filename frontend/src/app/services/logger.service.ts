import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { LogLevel } from '../model/shared.model';

@Injectable({
    providedIn: 'root'
})
export class LoggerService {
    private level: LogLevel = LogLevel.INFO;

    constructor() {
        this.level = environment.production ? LogLevel.WARN : LogLevel.DEBUG;
    }

    log(message: string, context?: any): void {
        this.info(message, context);
    }

    debug(message: string, context?: any): void {
        if (this.shouldLog(LogLevel.DEBUG)) {
            console.debug(this.format('DEBUG', message), context || '');
        }
    }

    info(message: string, context?: any): void {
        if (this.shouldLog(LogLevel.INFO)) {
            console.info(this.format('INFO', message), context || '');
        }
    }

    warn(message: string, context?: any): void {
        if (this.shouldLog(LogLevel.WARN)) {
            console.warn(this.format('WARN', message), context || '');
        }
    }

    error(message: string, context?: any): void {
        if (this.shouldLog(LogLevel.ERROR)) {
            console.error(this.format('ERROR', message), context || '');
        }
    }

    private shouldLog(level: LogLevel): boolean {
        return level >= this.level;
    }

    private format(level: string, message: string): string {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] [${level}] ${message}`;
    }
}
