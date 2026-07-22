import { PasswordHasherService } from './password-hasher.service';

describe('PasswordHasherService', () => {
  const service = new PasswordHasherService();

  it('hashes without storing plaintext and verifies the password', async () => {
    const hash = await service.hash('correct-password');
    expect(hash).toMatch(/^scrypt\$/);
    expect(hash).not.toContain('correct-password');
    await expect(service.verify('correct-password', hash)).resolves.toBe(true);
    await expect(service.verify('wrong-password', hash)).resolves.toBe(false);
  });

  it('rejects malformed hashes', async () => {
    await expect(service.verify('password', 'invalid')).resolves.toBe(false);
  });
});
