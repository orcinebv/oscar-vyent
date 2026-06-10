import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

const mockJwtService = {
  sign: jest.fn().mockReturnValue('signed-jwt-token'),
};

const makeConfig = (adminOverrides: Record<string, unknown> = {}) => ({
  get: jest.fn((key: string) => {
    if (key === 'admin') {
      return { username: 'admin', passwordHash: '$2b$12$hashedpassword', ...adminOverrides };
    }
    return null;
  }),
});

describe('AuthService', () => {
  let service: AuthService;
  let config: ReturnType<typeof makeConfig>;

  beforeEach(async () => {
    jest.clearAllMocks();
    config = makeConfig();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('login()', () => {
    it('returns accessToken for valid credentials', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login('admin', 'admin123');

      expect(bcrypt.compare).toHaveBeenCalledWith('admin123', '$2b$12$hashedpassword');
      expect(mockJwtService.sign).toHaveBeenCalledWith({ sub: 'admin', role: 'admin' });
      expect(result.accessToken).toBe('signed-jwt-token');
    });

    it('throws UnauthorizedException for wrong username', async () => {
      await expect(service.login('wronguser', 'admin123')).rejects.toThrow(UnauthorizedException);
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException for wrong password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login('admin', 'wrongpassword')).rejects.toThrow(UnauthorizedException);
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when passwordHash is not configured', async () => {
      config.get.mockImplementation((key: string) => {
        if (key === 'admin') return { username: 'admin', passwordHash: '' };
        return null;
      });

      await expect(service.login('admin', 'admin123')).rejects.toThrow(UnauthorizedException);
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('JWT payload contains sub and role', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await service.login('admin', 'admin123');

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ sub: 'admin', role: 'admin' }),
      );
    });
  });
});
