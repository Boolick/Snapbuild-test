import {
  AiImageGenerationRequest,
  AiImageEditRequest,
} from '../domain/ai-request.interface';
import { AiImageResponse } from '../domain/ai-response.interface';

export interface ImageGenerationProvider {
  readonly providerName: string;
  generateImage(request: AiImageGenerationRequest): Promise<AiImageResponse>;
  editImage(request: AiImageEditRequest): Promise<AiImageResponse>;
}
