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

// Vercel may prefix the token with the store name, try all variants
function getBlobToken(): string | undefined {
  const env = process.env;
  return (
    env['BLOB_READ_WRITE_TOKEN'] ??
    env['OSCAR_VYENT_BLOB_READ_WRITE_TOKEN'] ??
    Object.entries(env).find(([k]) => k.endsWith('_BLOB_READ_WRITE_TOKEN'))?.[1]
  );
}

const onVercel = (): boolean => !!process.env['VERCEL'];

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

    const token = getBlobToken();
    console.log('[upload] VERCEL=', process.env['VERCEL'], 'HAS_TOKEN=', !!token);

    if (token) {
      // Ensure the library auto-reads the token from the standard env var name
      process.env['BLOB_READ_WRITE_TOKEN'] = token;
      try {
        const blob = await put(filename, file.buffer, {
          access: 'public',
          contentType: file.mimetype,
        });
        console.log('[upload] Blob upload gelukt:', blob.url);
        return { url: blob.url };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[upload] Blob put() fout:', msg);
        throw new InternalServerErrorException(`Blob opslag fout: ${msg}`);
      }
    }

    if (onVercel()) {
      // Log alle blob-gerelateerde env vars voor debug
      const blobVars = Object.keys(process.env).filter(k => k.includes('BLOB'));
      console.error('[upload] Geen blob token gevonden. Beschikbare BLOB vars:', blobVars);
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
