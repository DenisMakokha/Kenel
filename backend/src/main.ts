import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import type { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const isProd = (configService.get('NODE_ENV') || 'development') === 'production';

  // Security
  app.use(
    helmet({
      contentSecurityPolicy: isProd
        ? {
            directives: {
              defaultSrc: ["'self'"],
              imgSrc: ["'self'", 'data:'],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              connectSrc: ["'self'"],
            },
          }
        : false,
    }),
  );

  if (isProd) {
    app.use(
      helmet.hsts({
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      }),
    );
  }

  app.use(
    helmet.referrerPolicy({
      policy: 'strict-origin-when-cross-origin',
    }),
  );

  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });
  app.use(cookieParser());

  // CORS - auto-detect based on environment
  const corsOriginEnv = configService.get('CORS_ORIGIN') || configService.get('FRONTEND_URL') || 'http://localhost:5173';
  // Support multiple origins (comma-separated) or single origin
  const corsOrigins = corsOriginEnv.split(',').map((o: string) => o.trim());
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      // Check if origin is in the allowed list
      if (corsOrigins.some((allowed: string) => origin === allowed || origin.endsWith(allowed.replace('https://', '.')))) {
        return callback(null, true);
      }
      // For development, also allow localhost
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Global prefix
  app.setGlobalPrefix(configService.get('API_PREFIX') || 'api/v1');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger Documentation - only enable in development
  if (!isProd) {
    const config = new DocumentBuilder()
      .setTitle('Kenels Bureau LMS API')
      .setDescription('Loan Management System API Documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management')
      .addTag('clients', 'Client management')
      .addTag('loan-products', 'Loan product management')
      .addTag('applications', 'Loan applications')
      .addTag('loans', 'Loan management')
      .addTag('repayments', 'Repayment processing')
      .addTag('reports', 'Reports and analytics')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = configService.get('PORT') || 3000;
  await app.listen(port);

  console.log(`
    🚀 Kenels Bureau LMS API is running!
    
    📍 API: http://localhost:${port}/${configService.get('API_PREFIX') || 'api/v1'}
    ${!isProd ? `📚 Docs: http://localhost:${port}/api/docs` : '📚 Docs: Disabled in production'}
    🌍 Environment: ${configService.get('NODE_ENV') || 'development'}
    🕐 Started: ${new Date().toISOString()}
    📦 Build: CI/CD Pipeline v1.0
  `);
}

bootstrap();
