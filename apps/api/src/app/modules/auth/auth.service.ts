import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AppConfig } from '../../config/configuration';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService<AppConfig>,
  ) {}

  async login(username: string, password: string): Promise<{ accessToken: string }> {
    const admin = this.config.get('admin', { infer: true })!;

    if (username !== admin.username) {
      throw new UnauthorizedException('Ongeldige gebruikersnaam of wachtwoord');
    }

    if (!admin.passwordHash) {
      throw new UnauthorizedException('Beheer is niet geconfigureerd');
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Ongeldige gebruikersnaam of wachtwoord');
    }

    const payload = { sub: username, role: 'admin' };
    const accessToken = this.jwtService.sign(payload);
    return { accessToken };
  }
}
