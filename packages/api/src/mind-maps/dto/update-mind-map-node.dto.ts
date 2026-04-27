import type { MindMapSticker } from '../entities/mind-map.entity';

export class UpdateMindMapNodeDto {
  title?: string;
  icon?: string | null;
  doodleDataUrl?: string | null;
  sticker?: MindMapSticker | string | null;
  x?: number;
  y?: number;
}