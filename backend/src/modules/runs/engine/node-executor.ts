import { Injectable, Logger } from '@nestjs/common';
import { NodeType } from '../../workflows/domain/port-type.enum';
import { WorkflowNode } from '../../workflows/domain/node.entity';
import { PresetsService } from '../../presets/services/presets.service';
import { AiGatewayService } from '../../ai/services/ai-gateway.service';
import { PromptRequestBuilder } from '../../ai/domain/prompt-builder';

export interface NodeExecutionInput {
  node: WorkflowNode;
  resolvedInputs: Record<string, any>;
  dataOverrides?: Record<string, any>;
}

export interface NodeExecutionOutput {
  outputs: Record<string, any>;
  metadata?: Record<string, any>;
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
    data: Record<string, any>,
    resolvedInputs: Record<string, any>,
  ): Promise<NodeExecutionOutput> {
    const promptText = (data.prompt || '').trim();
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
    data: Record<string, any>,
    resolvedInputs: Record<string, any>,
  ): Promise<NodeExecutionOutput> {
    const imageUrl =
      data.imageUrl ||
      'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800';

    return {
      outputs: {
        imageUrl,
        'image-out': imageUrl,
      },
    };
  }

  private async executeGenerateImageNode(
    data: Record<string, any>,
    resolvedInputs: Record<string, any>,
  ): Promise<NodeExecutionOutput> {
    // 1. Resolve prompt text: pull from upstream connected input or fallback to node's own prompt
    let userPrompt = '';
    if (resolvedInputs['text-in']) {
      userPrompt =
        typeof resolvedInputs['text-in'] === 'string'
          ? resolvedInputs['text-in']
          : resolvedInputs['text-in'].text || '';
    } else if (resolvedInputs.text) {
      userPrompt = resolvedInputs.text;
    } else if (data.prompt) {
      userPrompt = data.prompt;
    }

    // 2. Resolve Preset entity if specified
    const presetId = data.presetId;
    let preset = undefined;
    if (presetId) {
      try {
        preset = this.presetsService.findById(presetId);
      } catch (err) {
        this.logger.warn(`Preset ${presetId} not found, proceeding without preset.`);
      }
    }

    // 3. Request Builder: merges user prompt with Preset rules & references
    const aiRequest = PromptRequestBuilder.buildRequest(userPrompt, preset, {
      aspectRatio: data.aspectRatio,
      style: data.style,
      cfgScale: data.cfgScale,
      steps: data.steps,
      seed: data.seed,
    });

    // 4. Invoke AI Gateway (OpenAI / Stability / Replicate / Mock)
    const aiResponse = await this.aiGateway.generateImage(aiRequest);

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
    data: Record<string, any>,
    resolvedInputs: Record<string, any>,
  ): Promise<NodeExecutionOutput> {
    // 1. Resolve source image
    let sourceImageUrl = '';
    if (resolvedInputs['image-in']) {
      sourceImageUrl =
        typeof resolvedInputs['image-in'] === 'string'
          ? resolvedInputs['image-in']
          : resolvedInputs['image-in'].imageUrl || '';
    } else if (data.imageUrl) {
      sourceImageUrl = data.imageUrl;
    }

    if (!sourceImageUrl) {
      throw new Error(
        'EditImage node requires a source image (either connected from ImageInput or configured in node).',
      );
    }

    // 2. Resolve instruction prompt
    let instructionPrompt = '';
    if (resolvedInputs['text-in']) {
      instructionPrompt =
        typeof resolvedInputs['text-in'] === 'string'
          ? resolvedInputs['text-in']
          : resolvedInputs['text-in'].text || '';
    } else if (data.prompt) {
      instructionPrompt = data.prompt;
    }

    // 3. Invoke AI Edit Gateway
    const aiResponse = await this.aiGateway.editImage({
      inputImageUrl: sourceImageUrl,
      prompt: instructionPrompt || 'enhance details and style',
      strength: data.strength || 0.75,
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
    data: Record<string, any>,
    resolvedInputs: Record<string, any>,
  ): Promise<NodeExecutionOutput> {
    let resultImageUrl = '';
    if (resolvedInputs['image-in']) {
      resultImageUrl =
        typeof resolvedInputs['image-in'] === 'string'
          ? resolvedInputs['image-in']
          : resolvedInputs['image-in'].imageUrl || '';
    } else if (resolvedInputs.imageUrl) {
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
