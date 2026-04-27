import { Injectable, NotFoundException } from '@nestjs/common';

import type {
  CreateMindMapDto,
  CreateMindMapNodeDto,
  MindMap,
  StoryModeExport,
  UpdateMindMapNodeDto,
  UpdateMindMapThemeDto,
} from '@a7t/api';

import { AutoLayoutService } from '../domain/auto-layout.service';
import { MindMapRepository } from '../domain/mind-map.repository';
import { StoryExportService } from '../domain/story-export.service';
import { MindMapsGateway } from '../mind-maps.gateway';

@Injectable()
export class MindMapsService {
  constructor(
    private readonly repository: MindMapRepository,
    private readonly autoLayout: AutoLayoutService,
    private readonly storyExport: StoryExportService,
    private readonly gateway: MindMapsGateway,
  ) {}

  async create(input: CreateMindMapDto): Promise<MindMap> {
    const map = await this.repository.create({
      title: input.title?.trim() || 'My Big Idea',
      ownerName: input.ownerName?.trim() || undefined,
      theme: input.theme ?? 'space',
    });
    this.gateway.broadcastMap(map);
    return map;
  }

  async findOne(id: string): Promise<MindMap> {
    const map = await this.repository.findById(id);

    if (!map) {
      throw new NotFoundException('Mind map not found');
    }

    return map;
  }

  async addNode(
    mindMapId: string,
    input: CreateMindMapNodeDto,
  ): Promise<MindMap> {
    const map = await this.repository.addNode({
      mindMapId,
      parentId: input.parentId,
      title: input.title?.trim() || 'New idea',
      icon: input.icon ?? null,
      doodleDataUrl: input.doodleDataUrl ?? null,
      sticker: input.sticker ?? null,
    });
    this.gateway.broadcastMap(map);
    return map;
  }

  async updateNode(
    mindMapId: string,
    nodeId: string,
    input: UpdateMindMapNodeDto,
  ): Promise<MindMap> {
    const map = await this.repository.updateNode(mindMapId, nodeId, {
      ...input,
      title: input.title?.trim(),
    });
    this.gateway.broadcastMap(map);
    return map;
  }

  async updateTheme(
    mindMapId: string,
    input: UpdateMindMapThemeDto,
  ): Promise<MindMap> {
    const map = await this.repository.updateTheme(mindMapId, input.theme);
    this.gateway.broadcastMap(map);
    return map;
  }

  async autoArrange(mindMapId: string): Promise<MindMap> {
    const map = await this.findOne(mindMapId);
    const positions = this.autoLayout.arrange(map.nodes);
    const arranged = await this.repository.updateNodePositions(
      mindMapId,
      positions,
    );
    this.gateway.broadcastMap(arranged);
    return arranged;
  }

  async exportStory(mindMapId: string): Promise<StoryModeExport> {
    return this.storyExport.create(await this.findOne(mindMapId));
  }
}
