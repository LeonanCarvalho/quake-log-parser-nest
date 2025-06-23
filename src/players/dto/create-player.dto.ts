import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreatePlayerDto {
  @ApiProperty({
    description: 'O nome único do jogador.',
    example: 'Isgalamido',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;
}
