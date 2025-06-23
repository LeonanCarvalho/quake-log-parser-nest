import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PlayersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPlayerDto: CreatePlayerDto) {
    try {
      return await this.prisma.player.create({
        data: createPlayerDto,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        // P2002 é o código de erro para violação de constraint única no Prisma.
        throw new ConflictException(`Player with name "${createPlayerDto.name}" already exists.`);
      }
      throw error;
    }
  }

  findAll() {
    return this.prisma.player.findMany();
  }

  async findOne(id: string) {
    const player = await this.prisma.player.findUnique({
      where: { id },
    });

    if (!player) {
      throw new NotFoundException(`Player with ID "${id}" not found.`);
    }
    return player;
  }

  async update(id: string, updatePlayerDto: UpdatePlayerDto) {
    await this.findOne(id);
    return this.prisma.player.update({
      where: { id },
      data: updatePlayerDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.player.delete({
      where: { id },
    });
    return { message: `Player with ID "${id}" successfully removed.` };
  }
}
