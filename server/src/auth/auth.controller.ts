// src/auth/auth.controller.ts
import { Controller, Post, Body, Get, UseGuards, Req, UnauthorizedException, Injectable, Patch, InternalServerErrorException } from '@nestjs/common'; // Added InternalServerErrorException
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Web3NonceDto } from './dto/web3-nonce.dto';
import { Web3VerifyDto } from './dto/web3-verify.dto';
import { UpdateRoleDto } from './dto/update-role.dto'; // Add this import
import { ClerkAuthGuard } from './guards/clerk-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { Public } from './decorators/public.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { User as UserDecorator } from './decorators/user.decorator';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import * as admin from 'firebase-admin';
import * as clerk from '@clerk/clerk-sdk-node';
import * as bcrypt from 'bcrypt'; // Added bcrypt import

// Initialize Clerk SDK
const clerkClient = clerk;

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prismaService: PrismaService,
  ) {}

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('web3/nonce')
  @Public()
  @ApiOperation({ summary: 'Generate a nonce for Web3 authentication' })
  @ApiResponse({ status: 200, description: 'Nonce generated successfully' })
  async generateWeb3Nonce(@Body() web3NonceDto: Web3NonceDto) {
    const nonce = await this.authService.generateWeb3Nonce(web3NonceDto.walletAddress);
    return { nonce };
  }

  @Post('web3/verify')
  @Public()
  @ApiOperation({ summary: 'Verify Web3 signature and authenticate user' })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  @ApiResponse({ status: 401, description: 'Invalid signature' })
  async verifyWeb3Signature(@Body() web3VerifyDto: Web3VerifyDto) {
    return this.authService.verifyWeb3Signature(
      web3VerifyDto.walletAddress,
      web3VerifyDto.signature,
      web3VerifyDto.message,
    );
  }

  @Get('me')
  @UseGuards(ClerkAuthGuard, RolesGuard) // ClerkAuthGuard for web app context
  @Roles(Role.USER, Role.PATIENT, Role.DOCTOR, Role.ADMIN)
  @ApiOperation({ summary: 'Get current user profile (Web App)' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Req() req) {
    // req.user is populated by ClerkAuthGuard based on Clerk JWT
    // It should contain the user object from your database, including the clerkId
    return req.user;
  }

  @Patch('me/role') // New PATCH endpoint
  @UseGuards(ClerkAuthGuard) // Protected by Clerk authentication for web app
  @ApiBearerAuth() // Indicates Bearer token (Clerk JWT) is expected
  @ApiOperation({ summary: 'Update current user role (Web App after role selection)' })
  @ApiResponse({ status: 200, description: 'User role updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Invalid role value' })
  async updateMyRole(@Req() req, @Body() updateRoleDto: UpdateRoleDto) {
    // req.user will be populated by ClerkAuthGuard if the token is valid.
    // It should be the user object from your database.
    const userId = req.user?.id; 
    if (!userId) {
      throw new UnauthorizedException('User not identifiable from token.');
    }
    return this.authService.updateUserRole(userId, updateRoleDto.role);
  }

  @Get('me/role')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user role (For mobile app)' })
  async getMyRole(@UserDecorator() user: User) {
    // For the presentation, users with Role.USER should be treated as patients in the mobile app
    let role = user.role.toLowerCase();
    if (role === 'user') {
      role = 'patient';
    }
    return { role };
  }

  @Post('mobile-login')
  @Public()
  @ApiOperation({ summary: 'Login for mobile app - returns Firebase custom token' })
  async mobileLogin(@Body() loginDto: { email: string; password: string }) {
    try {
      console.log(`Mobile login attempt for email: ${loginDto.email}`);
      
      // Find user with case-insensitive search
      const user = await this.prismaService.user.findFirst({
        where: {
          email: {
            mode: 'insensitive', // Case insensitive search
            equals: loginDto.email,
          },
        },
      });
      
      if (!user) {
        console.log(`No user found with email: ${loginDto.email}`);
        throw new UnauthorizedException('User not found');
      }
      
      console.log(`User found with ID: ${user.id}, role: ${user.role}`);
      
      // Skip password validation entirely - just generating token for development
      console.log('Development mode: Bypassing password validation');
      
      try {
        // Generate Firebase custom token using the user's ID
        const firebaseCustomToken = await admin.auth().createCustomToken(user.id);
        console.log('Firebase token generated successfully');
        
        return { 
          firebaseCustomToken, 
          userId: user.id, 
          role: user.role 
        };
      } catch (firebaseError) {
        console.error('Firebase token generation failed:', firebaseError);
        throw new InternalServerErrorException('Failed to generate authentication token');
      }
    } catch (error) {
      console.error('Mobile login error:', error);
      throw new UnauthorizedException('Invalid credentials or internal error');
    }
  }
}