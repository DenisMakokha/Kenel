import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    const secret = this.configService.get<string>('PII_ENCRYPTION_KEY');
    if (!secret) {
      throw new Error('PII_ENCRYPTION_KEY is not configured');
    }

    this.key = crypto.scryptSync(secret, 'kenels-lms-pii', 32);
  }

  encrypt(plainText: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);

    const encrypted = Buffer.concat([
      cipher.update(plainText, 'utf8'),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return [
      iv.toString('base64'),
      encrypted.toString('base64'),
      authTag.toString('base64'),
    ].join(':');
  }

  decrypt(payload: string): string {
    const parts = payload.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted payload');
    }

    const [ivB64, dataB64, tagB64] = parts;
    const iv = Buffer.from(ivB64, 'base64');
    const encrypted = Buffer.from(dataB64, 'base64');
    const authTag = Buffer.from(tagB64, 'base64');

    const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }
}
