import { ConfigService } from '@nestjs/config';
import { CryptoService } from './crypto.service';

describe('CryptoService', () => {
  const secret = 'test-pii-encryption-key';

  const createService = () => {
    const config = {
      get: (key: string) => (key === 'PII_ENCRYPTION_KEY' ? secret : undefined),
    } as unknown as ConfigService;

    return new CryptoService(config);
  };

  it('encrypts and decrypts round-trip', () => {
    const service = createService();
    const plain = '0722123123|ID12345678|user@example.com';

    const cipher = service.encrypt(plain);
    expect(cipher).not.toBe(plain);

    const decrypted = service.decrypt(cipher);
    expect(decrypted).toBe(plain);
  });

  it('produces different ciphertext for same plaintext (random IV)', () => {
    const service = createService();
    const plain = 'same-plaintext';

    const c1 = service.encrypt(plain);
    const c2 = service.encrypt(plain);

    expect(c1).not.toBe(c2);
    expect(service.decrypt(c1)).toBe(plain);
    expect(service.decrypt(c2)).toBe(plain);
  });

  it('throws on invalid payload', () => {
    const service = createService();

    expect(() => service.decrypt('invalid')).toThrow();
  });
});
