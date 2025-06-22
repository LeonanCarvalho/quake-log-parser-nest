import { Controller, Get, Post, Param, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MatchesService } from './matches.service';

@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('logFile'))
  uploadLogFile(@UploadedFile() file: Express.Multer.File) {
    return this.matchesService.processLogFile(file.buffer);
  }

  @Get()
  findAll() {
    return this.matchesService.findAll();
  }

  @Get(':id/report')
  getMatchReport(@Param('id') id: string) {
    return this.matchesService.getMatchReport(id);
  }
}
