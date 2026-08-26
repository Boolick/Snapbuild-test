import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorResponse } from '../../common/interfaces/api-response.interface';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message = exception.message;
    let error: string | string[] | undefined;

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const resObj = exceptionResponse as { message?: string | string[]; error?: string };
      message =
        (Array.isArray(resObj.message) ? resObj.message.join(', ') : resObj.message) || message;
      error = resObj.error || undefined;
    }

    this.logger.warn(
      `[${request.method}] ${request.url} -> Status: ${status} | Message: ${JSON.stringify(message)}`,
    );

    const errorPayload: ApiErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: Array.isArray(message) ? message.join(', ') : message,
      error,
    };

    response.status(status).json(errorPayload);
  }
}
