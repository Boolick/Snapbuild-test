import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsObject } from 'class-validator';

export class RetryNodeDto {
  @ApiPropertyOptional({
    description: 'Optional overrides for node input data when retrying',
  })
  @IsOptional()
  @IsObject()
  dataOverrides?: Record<string, unknown>;
}
