// src/logger.ts
import { LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import { LoggingWinston } from '@google-cloud/logging-winston';

const winstonLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(), // Keeps logs structured
  ),
  transports: [
    new winston.transports.Console(),
    new LoggingWinston({
      projectId: process.env.GCP_PROJECT_ID,
      keyFilename: process.env.GCP_KEY_FILE_PATH,
    }),
  ],
});

export class Logger implements LoggerService {
  constructor(private service?: string) { }

  log(message: string) {
    winstonLogger.info(message, { service: this.service });
  }

  error(message: string, error: any) {
    winstonLogger.error(message, {
      service: this.service,
      error: {
        message: error?.message,
        stack: error?.stack,
        ...error
      },
    });
  }

  warn(message: string) {
    winstonLogger.warn(message, { service: this.service });
  }

  debug(message: string) {
    winstonLogger.debug(message, { service: this.service });
  }

  verbose(message: string) {
    winstonLogger.verbose(message, { service: this.service });
  }
}
