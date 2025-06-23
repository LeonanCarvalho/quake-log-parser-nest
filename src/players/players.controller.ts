import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PlayersService } from './players.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Player } from './entities/player.entity';

@ApiTags('players')
@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo jogador.' })
  @ApiResponse({ status: 201, description: 'O jogador foi criado com sucesso.', type: Player })
  @ApiResponse({ status: 409, description: 'Um jogador com este nome já existe.' })
  create(@Body() createPlayerDto: CreatePlayerDto) {
    return this.playersService.create(createPlayerDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os jogadores.' })
  @ApiResponse({ status: 200, description: 'Lista de jogadores.', type: [Player] })
  findAll() {
    return this.playersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um jogador pelo seu ID.' })
  @ApiParam({ name: 'id', description: 'ID único do jogador' })
  @ApiResponse({ status: 200, description: 'Dados do jogador.', type: Player })
  @ApiResponse({ status: 404, description: 'Jogador não encontrado.' })
  findOne(@Param('id') id: string) {
    return this.playersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza os dados de um jogador.' })
  @ApiParam({ name: 'id', description: 'ID único do jogador' })
  @ApiResponse({ status: 200, description: 'Jogador atualizado com sucesso.', type: Player })
  @ApiResponse({ status: 404, description: 'Jogador não encontrado.' })
  update(@Param('id') id: string, @Body() updatePlayerDto: UpdatePlayerDto) {
    return this.playersService.update(id, updatePlayerDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove um jogador.' })
  @ApiParam({ name: 'id', description: 'ID único do jogador' })
  @ApiResponse({ status: 200, description: 'Jogador removido com sucesso.' })
  @ApiResponse({ status: 404, description: 'Jogador não encontrado.' })
  remove(@Param('id') id: string) {
    return this.playersService.remove(id);
  }
}
