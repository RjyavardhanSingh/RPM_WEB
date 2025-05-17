import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import * as admin from 'firebase-admin';
import { clerkClient } from '@clerk/clerk-sdk-node'; // lowercase c, not ClerkClient
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CombinedAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prismaService: PrismaService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if endpoint is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // Allow public endpoints without authentication
      return true;
    }

    const request = context.switchToHttp().getRequest();
    
    // Extract the token from Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    // Determine if it's a Firebase or Clerk token and process accordingly
    try {
      // Try Firebase token validation first (for mobile app)
      try {
        console.log("Trying Firebase authentication...");
        const decodedToken = await admin.auth().verifyIdToken(token);
        const uid = decodedToken.uid;
        
        // Find the user in your database by ID (Firebase uses your user ID)
        const user = await this.prismaService.user.findUnique({
          where: { id: uid },
        });
        
        if (!user) {
          throw new UnauthorizedException('User not found');
        }
        
        request.user = user;
        console.log("Firebase authentication successful for user:", user.id);
        return true;
      } catch (firebaseError) {
        console.log("Firebase auth failed, trying Clerk:", firebaseError.message);
        
        // If Firebase fails, try Clerk token validation (for web app)
        try {
          // Use the correct method - there's no verifyToken() on sessions
          const clerkSession = await clerkClient.verifyToken(token);
          
          // Find user by Clerk ID
          const user = await this.prismaService.user.findUnique({
            where: { clerkId: clerkSession.sub },
          });
          
          if (!user) {
            throw new UnauthorizedException('User not found');
          }
          
          request.user = user;
          console.log("Clerk authentication successful for user:", user.id);
          return true;
        } catch (clerkError) {
          console.error("All authentication methods failed");
          throw new UnauthorizedException('Invalid token');
        }
      }
    } catch (error) {
      console.error("Authentication failed:", error);
      throw new UnauthorizedException('Authentication failed');
    }
  }
}