import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorResponse } from '../../common/interfaces/api-response.interface';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      exception instanceof Error ? exception.message : 'Internal server error occurred';

    this.logger.error(
      `[${request.method}] ${request.url} -> Unhandled Exception: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    const errorPayload: ApiErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      error: 'Internal Server Error',
    };

    response.status(status).json(errorPayload);
  }
}
