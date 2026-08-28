import axios from 'axios';
import { Logger } from '@nestjs/common';

let queueLock: Promise<void> = Promise.resolve();

async function acquireSlot<T>(fn: () => Promise<T>): Promise<T> {
  const previous = queueLock;
  let release: () => void;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  queueLock = previous.then(() => current);

  await previous;
  try {
    return await fn();
  } finally {
    setTimeout(() => release(), 1500);
  }
}

export async function renderDiffusionImage(
  prompt: string,
  width: number,
  height: number,
  seed: number,
  logger: Logger,
): Promise<string> {
  return acquireSlot(async () => {
    const encodedPrompt = encodeURIComponent(prompt);

    // Primary: Flux model with retry
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const fluxUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`;
        const response = await axios.get(fluxUrl, {
          responseType: 'arraybuffer',
          timeout: 35000,
        });
        const base64 = Buffer.from(response.data).toString('base64');
        return `data:image/jpeg;base64,${base64}`;
      } catch (fluxErr: unknown) {
        const is429 =
          axios.isAxiosError(fluxErr) &&
          (fluxErr.response?.status === 429 || fluxErr.status === 429);
        if (is429 && attempt < 3) {
          logger.warn(`[Diffusion] Rate limit (429), retrying attempt ${attempt}/3...`);
          await new Promise((r) => setTimeout(r, attempt * 2000));
          continue;
        }
        break;
      }
    }

    // Fallback: Turbo model
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const turboUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=turbo`;
        const response = await axios.get(turboUrl, {
          responseType: 'arraybuffer',
          timeout: 20000,
        });
        const base64 = Buffer.from(response.data).toString('base64');
        return `data:image/jpeg;base64,${base64}`;
      } catch (turboErr: unknown) {
        const is429 =
          axios.isAxiosError(turboErr) &&
          (turboErr.response?.status === 429 || turboErr.status === 429);
        if (is429 && attempt < 2) {
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }
        throw turboErr;
      }
    }

    throw new Error('Neural image rendering attempts timed out.');
  });
}

export function resolveDimensions(aspectRatio?: string): {
  width: number;
  height: number;
  aspectRatio: string;
} {
  switch (aspectRatio) {
    case '16:9':
      return { width: 1280, height: 720, aspectRatio: '16:9' };
    case '9:16':
      return { width: 720, height: 1280, aspectRatio: '9:16' };
    case '4:3':
      return { width: 1024, height: 768, aspectRatio: '4:3' };
    case '3:4':
      return { width: 768, height: 1024, aspectRatio: '3:4' };
    case '1:1':
    default:
      return { width: 1024, height: 1024, aspectRatio: '1:1' };
  }
}
