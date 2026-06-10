import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getAll(): Promise<Record<string, string>> {
    return this.settingsService.getAll();
  }

  @Patch()
  @UseGuards(JwtAuthGuard)
  async update(@Body() body: Record<string, string>): Promise<{ ok: boolean }> {
    for (const [k, v] of Object.entries(body)) {
      await this.settingsService.set(k, v);
    }
    return { ok: true };
  }
}
