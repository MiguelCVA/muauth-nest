import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class CreateAuthDto {
  @ApiProperty({ description: 'User email for authentication' })
  @IsEmail()
  email: string;
}
