import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { MindMapsService } from './application/mind-maps.service';
import { AutoLayoutService } from './domain/auto-layout.service';
import { MindMapRepository } from './domain/mind-map.repository';
import { ProgressionService } from './domain/progression.service';
import { StoryExportService } from './domain/story-export.service';
import { PrismaMindMapRepository } from './infrastructure/prisma-mind-map.repository';
import { MindMapsController } from './mind-maps.controller';
import { MindMapsGateway } from './mind-maps.gateway';

@Module({
  imports: [PrismaModule],
  controllers: [MindMapsController],
  providers: [
    MindMapsService,
    AutoLayoutService,
    ProgressionService,
    StoryExportService,
    MindMapsGateway,
    {
      provide: MindMapRepository,
      useClass: PrismaMindMapRepository,
    },
  ],
})
export class MindMapsModule {}