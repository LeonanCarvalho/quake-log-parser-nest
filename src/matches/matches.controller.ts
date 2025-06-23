import { Controller, Get, Post, Param, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { MatchesService } from './matches.service';

@ApiTags('matches')
@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('logFile'))
  @ApiOperation({ summary: 'Processa um arquivo de log de partidas.' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Arquivo processado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Arquivo inválido.' })
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
