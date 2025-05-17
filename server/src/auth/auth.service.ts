// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { User, Role } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { ClerkUserDto } from './dto/clerk-user.dto';
import { UpdateRoleDto } from './dto/update-role.dto'; // Add this import
import { verifyMessage } from 'ethers';

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
  ) {}

  // Verify and decode Clerk JWT token
  async verifyClerkJwt(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  // Create or update a user from Clerk auth data
  async findOrCreateClerkUser(clerkUserData: ClerkUserDto): Promise<User> {
    const { clerkId, email, name, role = Role.USER } = clerkUserData;

    // Check if user exists by clerkId
    let user = await this.prismaService.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      // Check if email is already used
      if (email) {
        const existingUserWithEmail = await this.prismaService.user.findUnique({
          where: { email },
        });
        
        if (existingUserWithEmail) {
          // Connect existing user with clerk ID
          user = await this.prismaService.user.update({
            where: { id: existingUserWithEmail.id },
            data: { clerkId },
          });
          return user;
        }
      }

      // Create new user
      user = await this.prismaService.user.create({
        data: {
          clerkId,
          email,
          name,
          role,
        },
      });
    }

    return user;
  }

  // Generate nonce for Web3 authentication
  async generateWeb3Nonce(walletAddress: string): Promise<string> {
    const nonce = Math.random().toString(36).substring(2, 15);
    return `Sign this message to authenticate with RPM: ${nonce}`;
  }

  // Verify Web3 signature and authenticate user
  async verifyWeb3Signature(walletAddress: string, signature: string, message: string): Promise<{ user: User; token: string }> {
    // Verify the signature using ethers
    const recoveredAddress = verifyMessage(message, signature);
    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      throw new UnauthorizedException('Invalid signature');
    }
    
    // Find or create user by wallet address
    let user = await this.prismaService.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() },
    });

    if (!user) {
      // Create new user
      user = await this.prismaService.user.create({
        data: {
          walletAddress: walletAddress.toLowerCase(),
          name: `User-${walletAddress.substring(0, 6)}`,
          role: Role.USER,
        },
      });
    }

    // Generate JWT token
    const token = this.jwtService.sign({
      sub: user.id,
      walletAddress: user.walletAddress,
      role: user.role,
    });

    return { user, token };
  }

  // Register a new user
  async register(createUserDto: CreateUserDto): Promise<User> {
    const { email, walletAddress } = createUserDto;

    // Check if email already exists
    if (email) {
      const existingUserWithEmail = await this.prismaService.user.findUnique({
        where: { email },
      });
      
      if (existingUserWithEmail) {
        throw new ConflictException('Email already in use');
      }
    }

    // Check if wallet address already exists
    if (walletAddress) {
      const existingUserWithWallet = await this.prismaService.user.findUnique({
        where: { walletAddress: walletAddress.toLowerCase() },
      });
      
      if (existingUserWithWallet) {
        throw new ConflictException('Wallet address already in use');
      }
    }

    // Create user
    const user = await this.prismaService.user.create({
      data: {
        ...createUserDto,
        walletAddress: walletAddress ? walletAddress.toLowerCase() : undefined,
      },
    });

    return user;
  }

  // Update user role
  async updateUserRole(userId: string, newRole: Role): Promise<User> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (!Object.values(Role).includes(newRole)) {
      throw new ConflictException(`Invalid role: ${newRole}. Must be one of ${Object.values(Role).join(', ')}`);
    }

    return this.prismaService.user.update({
      where: { id: userId },
      data: { role: newRole },
    });
  }

  // Get user by ID - Fixed to handle null safely
  async getUserById(id: string): Promise<User> {
    const user = await this.prismaService.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }
}