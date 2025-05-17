import { IsEnum, IsNotEmpty } from 'class-validator';
import { Role } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRoleDto {
  @ApiProperty({
    description: 'The new role for the user',
    enum: Role,
    example: Role.PATIENT,
  })
  @IsNotEmpty()
  @IsEnum(Role, {
    message: `Role must be one of the following: ${Object.values(Role).join(', ')}`,
  })
  role: Role;
}