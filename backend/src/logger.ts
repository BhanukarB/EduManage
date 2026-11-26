// src/logger.ts
import { LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import { LoggingWinston } from '@google-cloud/logging-winston';

const isDev = process.env.NODE_ENV !== 'production';

const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, service, error, ...meta }) => {
    const svc = service ? `[${String(service)}] ` : '';
    const errObj = error as { message?: string; stack?: string } | undefined;
    const errText = errObj?.stack
      ? `\n${errObj.stack}`
      : errObj?.message
        ? ` - ${errObj.message}`
        : '';
    const extra = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `${String(timestamp)} ${String(level)} ${svc}${String(message)}${errText}${extra}`;
  }),
);

const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json(), // Keeps logs structured
);

const transports: winston.transport[] = [new winston.transports.Console()];

if (!isDev && process.env.GCP_PROJECT_ID && process.env.GCP_KEY_FILE_PATH) {
  transports.push(
    new LoggingWinston({
      projectId: process.env.GCP_PROJECT_ID,
      keyFilename: process.env.GCP_KEY_FILE_PATH,
    }),
  );
}

const winstonLogger = winston.createLogger({
  level: isDev ? 'debug' : 'info',
  format: isDev ? devFormat : prodFormat,
  transports,
});

function serializeError(error: unknown): Record<string, unknown> | undefined {
  if (error === undefined || error === null) {
    return undefined;
  }
  if (error instanceof Error) {
    return {
      ...error,
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  if (typeof error === 'object') {
    return { ...(error as Record<string, unknown>) };
  }
  return { message: String(error) };
}

export class Logger implements LoggerService {
  constructor(private readonly service?: string) {}

  log(message: string): void {
    winstonLogger.info(message, { service: this.service });
  }

  error(message: string, error?: unknown): void {
    winstonLogger.error(message, {
      service: this.service,
      error: serializeError(error),
    });
  }

  warn(message: string): void {
    winstonLogger.warn(message, { service: this.service });
  }

  debug(message: string): void {
    winstonLogger.debug(message, { service: this.service });
  }

  verbose(message: string): void {
    winstonLogger.verbose(message, { service: this.service });
  }
}
