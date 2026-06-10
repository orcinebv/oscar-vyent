import {
  Controller,
  Get,
  Patch,
  Body,
  Headers,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SettingsService } from './settings.service';
import { AppConfig } from '../../config/configuration';

@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly config: ConfigService<AppConfig>,
  ) {}

  @Get()
  async getAll(): Promise<Record<string, string>> {
    return this.settingsService.getAll();
  }

  @Patch()
  async update(
    @Headers('x-admin-key') key: string,
    @Body() body: Record<string, string>,
  ): Promise<{ ok: boolean }> {
    const adminKey = this.config.get('admin', { infer: true })?.apiKey;
    if (!adminKey || key !== adminKey) {
      throw new ForbiddenException('Ongeldig admin sleutel');
    }
    for (const [k, v] of Object.entries(body)) {
      await this.settingsService.set(k, v);
    }
    return { ok: true };
  }
}
