import { Injectable, Logger } from '@nestjs/common';
import { NodeType } from '../../workflows/domain/port-type.enum';
import { WorkflowNode } from '../../workflows/domain/node.entity';
import { PresetsService } from '../../presets/services/presets.service';
import { AiGatewayService } from '../../ai/services/ai-gateway.service';
import { PromptRequestBuilder } from '../../ai/domain/prompt-builder';

export interface NodeExecutionInput {
  node: WorkflowNode;
  resolvedInputs: Record<string, unknown>;
  dataOverrides?: Record<string, unknown>;
}

export interface NodeExecutionOutput {
  outputs: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class NodeExecutor {
  private readonly logger = new Logger(NodeExecutor.name);

  constructor(
    private readonly presetsService: PresetsService,
    private readonly aiGateway: AiGatewayService,
  ) {}

  async execute(input: NodeExecutionInput): Promise<NodeExecutionOutput> {
    const { node, resolvedInputs, dataOverrides } = input;
    const nodeData = { ...node.data, ...(dataOverrides || {}) };

    this.logger.log(`Executing node "${node.id}" of type [${node.type}]...`);

    switch (node.type) {
      case NodeType.PROMPT:
        return this.executePromptNode(nodeData, resolvedInputs);

      case NodeType.IMAGE_INPUT:
        return this.executeImageInputNode(nodeData, resolvedInputs);

      case NodeType.GENERATE_IMAGE:
        return this.executeGenerateImageNode(nodeData, resolvedInputs);

      case NodeType.EDIT_IMAGE:
        return this.executeEditImageNode(nodeData, resolvedInputs);

      case NodeType.RESULT:
        return this.executeResultNode(nodeData, resolvedInputs);

      default:
        throw new Error(`Unsupported node type: "${node.type}"`);
    }
  }

  private async executePromptNode(
    data: Record<string, unknown>,
    _resolvedInputs: Record<string, unknown>,
  ): Promise<NodeExecutionOutput> {
    const promptText = typeof data.prompt === 'string' ? data.prompt.trim() : '';
    return {
      outputs: {
        text: promptText,
        'text-out': promptText,
      },
      metadata: {
        characterCount: promptText.length,
      },
    };
  }

  private async executeImageInputNode(
    data: Record<string, unknown>,
    _resolvedInputs: Record<string, unknown>,
  ): Promise<NodeExecutionOutput> {
    const imageUrl =
      (typeof data.imageUrl === 'string' && data.imageUrl) ||
      'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800';

    return {
      outputs: {
        imageUrl,
        'image-out': imageUrl,
      },
    };
  }

  private async executeGenerateImageNode(
    data: Record<string, unknown>,
    resolvedInputs: Record<string, unknown>,
  ): Promise<NodeExecutionOutput> {
    // 1. Resolve prompt text: pull from upstream connected input or fallback to node's own prompt
    let userPrompt = '';
    const textIn = resolvedInputs['text-in'];
    const textVal = resolvedInputs.text;

    if (typeof textIn === 'string') {
      userPrompt = textIn;
    } else if (typeof textIn === 'object' && textIn !== null && 'text' in textIn) {
      userPrompt = String((textIn as Record<string, unknown>).text || '');
    } else if (typeof textVal === 'string') {
      userPrompt = textVal;
    } else if (typeof data.prompt === 'string') {
      userPrompt = data.prompt;
    }

    // 2. Resolve Preset entity if specified
    const presetId = typeof data.presetId === 'string' ? data.presetId : undefined;
    let preset = undefined;
    if (presetId) {
      try {
        preset = this.presetsService.findById(presetId);
      } catch {
        this.logger.warn(`Preset ${presetId} not found, proceeding without preset.`);
      }
    }

    // 3. Request Builder: merges user prompt with Preset rules & references
    const request = PromptRequestBuilder.buildRequest(userPrompt, preset, {
      aspectRatio:
        typeof data.aspectRatio === 'string'
          ? (data.aspectRatio as '1:1' | '16:9' | '9:16' | '4:3')
          : undefined,
      style: typeof data.style === 'string' ? data.style : undefined,
      cfgScale: typeof data.cfgScale === 'number' ? data.cfgScale : undefined,
      steps: typeof data.steps === 'number' ? data.steps : undefined,
      seed: typeof data.seed === 'number' ? data.seed : undefined,
    });

    // 4. Invoke AI Gateway (OpenAI / Stability / Replicate / Mock)
    const aiResponse = await this.aiGateway.generateImage(request);

    return {
      outputs: {
        imageUrl: aiResponse.imageUrl,
        'image-out': aiResponse.imageUrl,
        promptUsed: aiResponse.promptUsed,
        provider: aiResponse.provider,
        model: aiResponse.model,
      },
      metadata: {
        generationDurationMs: aiResponse.generationDurationMs,
        width: aiResponse.width,
        height: aiResponse.height,
        seed: aiResponse.seed,
      },
    };
  }

  private async executeEditImageNode(
    data: Record<string, unknown>,
    resolvedInputs: Record<string, unknown>,
  ): Promise<NodeExecutionOutput> {
    // 1. Resolve source image
    let sourceImageUrl = '';
    const imageIn = resolvedInputs['image-in'];
    if (typeof imageIn === 'string') {
      sourceImageUrl = imageIn;
    } else if (typeof imageIn === 'object' && imageIn !== null && 'imageUrl' in imageIn) {
      sourceImageUrl = String((imageIn as Record<string, unknown>).imageUrl || '');
    } else if (typeof data.imageUrl === 'string') {
      sourceImageUrl = data.imageUrl;
    }

    if (!sourceImageUrl) {
      throw new Error(
        'EditImage node requires a source image (either connected from ImageInput or configured in node).',
      );
    }

    // 2. Resolve instruction prompt
    let instructionPrompt = '';
    const textIn = resolvedInputs['text-in'];
    if (typeof textIn === 'string') {
      instructionPrompt = textIn;
    } else if (typeof textIn === 'object' && textIn !== null && 'text' in textIn) {
      instructionPrompt = String((textIn as Record<string, unknown>).text || '');
    } else if (typeof data.prompt === 'string') {
      instructionPrompt = data.prompt;
    }

    // 3. Invoke AI Edit Gateway
    const aiResponse = await this.aiGateway.editImage({
      inputImageUrl: sourceImageUrl,
      prompt: instructionPrompt || 'enhance details and style',
      strength: typeof data.strength === 'number' ? data.strength : 0.75,
    });

    return {
      outputs: {
        imageUrl: aiResponse.imageUrl,
        'image-out': aiResponse.imageUrl,
        promptUsed: aiResponse.promptUsed,
        provider: aiResponse.provider,
      },
      metadata: {
        generationDurationMs: aiResponse.generationDurationMs,
      },
    };
  }

  private async executeResultNode(
    _data: Record<string, unknown>,
    resolvedInputs: Record<string, unknown>,
  ): Promise<NodeExecutionOutput> {
    let resultImageUrl = '';
    const imageIn = resolvedInputs['image-in'];
    if (typeof imageIn === 'string') {
      resultImageUrl = imageIn;
    } else if (typeof imageIn === 'object' && imageIn !== null && 'imageUrl' in imageIn) {
      resultImageUrl = String((imageIn as Record<string, unknown>).imageUrl || '');
    } else if (typeof resolvedInputs.imageUrl === 'string') {
      resultImageUrl = resolvedInputs.imageUrl;
    }

    if (!resultImageUrl) {
      throw new Error('Result node did not receive an image from upstream node.');
    }

    return {
      outputs: {
        previewUrl: resultImageUrl,
        imageUrl: resultImageUrl,
      },
      metadata: {
        readyAt: new Date().toISOString(),
      },
    };
  }
}
