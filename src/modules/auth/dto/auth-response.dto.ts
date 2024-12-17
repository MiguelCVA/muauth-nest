import { ApiProperty } from '@nestjs/swagger';

export class AuthenticationResponseDto {
  @ApiProperty({
    description: 'Session token for authentication',
    example: 'sess_123456789',
  })
  session_token: string;

  @ApiProperty({
    description: 'Expiration date of the session token',
    example: '2024-12-31T23:59:59.999Z',
  })
  session_token_expires: Date;

  @ApiProperty({
    description: 'Indicates if this is a new user',
    example: true,
  })
  isNewUser: boolean;
}
