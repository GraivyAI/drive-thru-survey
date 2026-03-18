import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const traceId = uuidv4();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException
      ? exception.message
      : 'Internal server error';

    const errorName = exception instanceof HttpException
      ? HttpStatus[status] || 'Error'
      : 'INTERNAL_SERVER_ERROR';

    if (status >= 500) {
      this.logger.error({ traceId, status, message, stack: (exception as Error)?.stack });
    }

    response.status(status).json({
      statusCode: status,
      error: errorName,
      message,
      traceId,
    });
  }
}
