// src/auth/guards/web3-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class Web3AuthGuard extends AuthGuard('web3') {}