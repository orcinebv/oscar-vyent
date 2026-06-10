import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SettingsService } from './settings.service';
import { AppSetting } from './app-setting.entity';

const mockRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  save: jest.fn(),
};

describe('SettingsService', () => {
  let service: SettingsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: getRepositoryToken(AppSetting), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
  });

  describe('get()', () => {
    it('returns the value when key exists', async () => {
      mockRepo.findOne.mockResolvedValue({ key: 'mail.to', value: 'test@example.nl' });

      const result = await service.get('mail.to');

      expect(result).toBe('test@example.nl');
      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { key: 'mail.to' } });
    });

    it('returns null when key does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      const result = await service.get('nonexistent.key');

      expect(result).toBeNull();
    });
  });

  describe('set()', () => {
    it('saves a new key-value pair', async () => {
      mockRepo.save.mockResolvedValue({});

      await service.set('mail.to', 'new@example.nl');

      expect(mockRepo.save).toHaveBeenCalledWith({ key: 'mail.to', value: 'new@example.nl' });
    });

    it('overwrites an existing key (upsert via save)', async () => {
      mockRepo.save.mockResolvedValue({});

      await service.set('mail.to', 'updated@example.nl');

      expect(mockRepo.save).toHaveBeenCalledWith({ key: 'mail.to', value: 'updated@example.nl' });
    });
  });

  describe('getAll()', () => {
    it('returns all settings as a key-value record', async () => {
      mockRepo.find.mockResolvedValue([
        { key: 'mail.to', value: 'test@example.nl' },
        { key: 'another.key', value: 'some-value' },
      ]);

      const result = await service.getAll();

      expect(result).toEqual({
        'mail.to': 'test@example.nl',
        'another.key': 'some-value',
      });
    });

    it('returns an empty object when no settings exist', async () => {
      mockRepo.find.mockResolvedValue([]);

      const result = await service.getAll();

      expect(result).toEqual({});
    });
  });
});
