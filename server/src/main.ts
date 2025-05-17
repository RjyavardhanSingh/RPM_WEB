// src/main.ts
import 'dotenv/config'; // Add this at the top
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service'; // Fix the import path

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS with specific options
  app.enableCors({
    origin: '*', // Wildcard for all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false, // Must be false when using '*'
  });
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  
  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('RPM API')
    .setDescription('Remote Patient Monitoring API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  // Create a test mobile user if in development mode
  if (process.env.NODE_ENV !== 'production') {
    try {
      const prisma = app.get(PrismaService);
      
      // Check if our test user already exists
      const testUser = await prisma.user.findFirst({
        where: { email: 'mobile@test.com' },
      });
      
      if (!testUser) {
        console.log('Creating test mobile user...');
        const user = await prisma.user.create({
          data: {
            email: 'mobile@test.com',
            name: 'Mobile Test User',
            role: 'PATIENT', // Or any role you want to test with
            // Add patient record if needed
            patient: {
              create: {
                dateOfBirth: new Date('1990-01-01'),
                gender: 'MALE',
              },
            },
          },
        });
        console.log(`Created test mobile user with ID: ${user.id}`);
      } else {
        console.log('Test mobile user already exists');
      }
    } catch (error) {
      console.error('Error creating test user:', error);
    }
  }
  
  // Start the server
  await app.listen(process.env.PORT || 5000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();