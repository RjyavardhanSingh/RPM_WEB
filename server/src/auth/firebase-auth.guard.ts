import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    private firebaseService: FirebaseService,
    private prismaService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    try {
      // Extract the token from Authorization header
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('Missing or invalid Authorization header');
      }
      
      const token = authHeader.split('Bearer ')[1];
      
      // Verify the Firebase ID token
      const decodedToken = await this.firebaseService.verifyIdToken(token);
      
      // The uid from decodedToken should correspond to your user's unique identifier
      // (Either Clerk ID or your internal user ID that you used when creating the custom token)
      const uid = decodedToken.uid;
      
      // Find the user in your database
      const user = await this.prismaService.user.findUnique({
        where: { clerkId: uid }, // Adjust this to match how you store the Firebase UID
      });
      
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      
      // Attach the user to the request object for use in controllers
      request.user = user;
      
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token: ' + error.message);
    }
  }
}