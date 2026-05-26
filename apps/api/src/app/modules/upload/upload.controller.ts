import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { mkdirSync } from 'fs';
import { extname, join } from 'path';

const uploadDest = (): string =>
  process.env['NODE_ENV'] === 'production'
    ? '/tmp/uploads'
    : join(process.cwd(), 'uploads');

@Controller('upload')
export class UploadController {
  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const dest = uploadDest();
          mkdirSync(dest, { recursive: true });
          cb(null, dest);
        },
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase();
          cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (file.mimetype.match(/^image\/(jpeg|jpg|png|gif|webp|avif)$/)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Alleen afbeeldingsbestanden zijn toegestaan (jpg, png, gif, webp)'), false);
        }
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File): { url: string } {
    if (!file) throw new BadRequestException('Geen bestand geüpload');
    return { url: `/uploads/${file.filename}` };
  }
}
