import type { MindMapSticker } from '../entities/mind-map.entity';

export class CreateMindMapNodeDto {
  parentId!: string;
  title?: string;
  icon?: string;
  doodleDataUrl?: string;
  sticker?: MindMapSticker | string;
  source?: 'manual' | 'voice' | 'doodle' | 'sticker';
}