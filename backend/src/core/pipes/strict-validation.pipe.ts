import { ValidationPipe, ValidationError, BadRequestException } from '@nestjs/common';

export class StrictValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        const formatErrors = (errors: ValidationError[]): string[] => {
          const messages: string[] = [];
          for (const err of errors) {
            if (err.constraints) {
              messages.push(...Object.values(err.constraints));
            }
            if (err.children && err.children.length > 0) {
              messages.push(...formatErrors(err.children));
            }
          }
          return messages;
        };

        const errorsList = formatErrors(validationErrors);
        return new BadRequestException({
          statusCode: 400,
          message: 'Validation failed',
          error: errorsList,
        });
      },
    });
  }
}
