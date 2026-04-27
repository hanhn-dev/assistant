import { Injectable } from '@nestjs/common';
import type { MindMap, StoryModeExport, StorySlide } from '@a7t/api';

@Injectable()
export class StoryExportService {
  create(map: MindMap): StoryModeExport {
    const childrenByParent = new Map<string | null, typeof map.nodes>();

    for (const node of map.nodes) {
      const children = childrenByParent.get(node.parentId) ?? [];
      children.push(node);
      childrenByParent.set(node.parentId, children);
    }

    const slides: StorySlide[] = [];
    const walk = (parentId: string | null) => {
      const children = childrenByParent.get(parentId) ?? [];

      for (const child of children) {
        slides.push({
          id: child.id,
          title: child.title,
          icon: child.icon,
          doodleDataUrl: child.doodleDataUrl,
          sticker: child.sticker,
          depth: child.depth,
          childrenCount: childrenByParent.get(child.id)?.length ?? 0,
        });
        walk(child.id);
      }
    };

    walk(null);

    return {
      mindMapId: map.id,
      title: map.title,
      theme: map.theme,
      slides,
    };
  }
}