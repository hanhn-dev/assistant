import type { MindMapTheme } from '../entities/mind-map.entity';

export class CreateMindMapDto {
  title!: string;
  ownerName?: string;
  theme?: MindMapTheme;
}