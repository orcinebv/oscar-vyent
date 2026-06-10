import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env['JWT_SECRET'] ?? 'change-me-in-production',
      // expiresIn as seconds (default 8h = 28800s); override via JWT_EXPIRES_IN env var
      signOptions: { expiresIn: parseInt(process.env['JWT_EXPIRES_IN'] ?? '28800', 10) },
    }),
  ],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  controllers: [AuthController],
  exports: [JwtAuthGuard],
})
export class AuthModule {}
