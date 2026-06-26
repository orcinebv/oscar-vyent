import { Controller, Post, UseGuards, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { MailService } from './mail.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('test')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async testMail(): Promise<{ ok: boolean }> {
    try {
      await this.mailService.sendTest();
      return { ok: true };
    } catch (err) {
      throw new BadRequestException(`Testmail mislukt: ${String(err)}`);
    }
  }
}
