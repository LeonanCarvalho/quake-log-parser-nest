import { Module } from '@nestjs/common';
import { GameProcessorService } from './game-processor.service';

@Module({
  providers: [GameProcessorService],
  exports: [GameProcessorService],
})
export class GameModule {}
