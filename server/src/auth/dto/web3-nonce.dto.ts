// src/auth/dto/web3-nonce.dto.ts
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Web3NonceDto {
  @ApiProperty()
  @IsString()
  walletAddress: string;
}