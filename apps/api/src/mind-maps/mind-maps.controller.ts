import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';

import type {
  CreateMindMapDto,
  CreateMindMapNodeDto,
  UpdateMindMapNodeDto,
  UpdateMindMapThemeDto,
} from '@a7t/api';

import { MindMapsService } from './application/mind-maps.service';

@Controller('mind-maps')
export class MindMapsController {
  constructor(private readonly mindMaps: MindMapsService) {}

  @Post()
  create(@Body() input: CreateMindMapDto) {
    return this.mindMaps.create(input);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mindMaps.findOne(id);
  }

  @Post(':id/nodes')
  addNode(@Param('id') id: string, @Body() input: CreateMindMapNodeDto) {
    return this.mindMaps.addNode(id, input);
  }

  @Patch(':id/nodes/:nodeId')
  updateNode(
    @Param('id') id: string,
    @Param('nodeId') nodeId: string,
    @Body() input: UpdateMindMapNodeDto,
  ) {
    return this.mindMaps.updateNode(id, nodeId, input);
  }

  @Patch(':id/theme')
  updateTheme(@Param('id') id: string, @Body() input: UpdateMindMapThemeDto) {
    return this.mindMaps.updateTheme(id, input);
  }

  @Post(':id/layout')
  autoArrange(@Param('id') id: string) {
    return this.mindMaps.autoArrange(id);
  }

  @Get(':id/story')
  exportStory(@Param('id') id: string) {
    return this.mindMaps.exportStory(id);
  }
}