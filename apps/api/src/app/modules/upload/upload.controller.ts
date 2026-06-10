import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { mkdirSync, writeFileSync } from 'fs';
import { extname, join } from 'path';
import { put } from '@vercel/blob';

const onVercel = (): boolean => !!process.env['VERCEL'];
const useVercelBlob = (): boolean => !!process.env['BLOB_READ_WRITE_TOKEN'];

@Controller('upload')
export class UploadController {
  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
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
  async uploadImage(@UploadedFile() file: Express.Multer.File): Promise<{ url: string }> {
    if (!file) throw new BadRequestException('Geen bestand geüpload');

    const ext = extname(file.originalname).toLowerCase();
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;

    // Debug: log token presence (not value)
    console.log('[upload] VERCEL=', process.env['VERCEL'], 'HAS_BLOB_TOKEN=', !!process.env['BLOB_READ_WRITE_TOKEN']);

    if (useVercelBlob()) {
      const blob = await put(filename, file.buffer, {
        access: 'public',
        contentType: file.mimetype,
      });
      return { url: blob.url };
    }

    if (onVercel()) {
      throw new InternalServerErrorException(
        'Opslag niet geconfigureerd: voeg een Vercel Blob Store toe aan dit project.',
      );
    }

    // Local dev: write to disk
    const dest = join(process.cwd(), 'uploads');
    mkdirSync(dest, { recursive: true });
    writeFileSync(join(dest, filename), new Uint8Array(file.buffer));
    return { url: `/uploads/${filename}` };
  }
}
