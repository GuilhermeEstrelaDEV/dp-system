import { Test } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { RouteClassificationVerifierService } from './route-classification-verifier.service';

describe('RouteClassificationVerifierService', () => {
  it('reconciles every production controller and handler with an explicit policy', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    try {
      const inventory = moduleRef.get(RouteClassificationVerifierService).assertComplete();
      expect(new Set(inventory.map(({ controller }) => controller)).size).toBe(26);
      expect(inventory).toHaveLength(165);
      expect(
        inventory.filter(({ classification }) => classification === 'PUBLIC_EXPLICIT'),
      ).toHaveLength(4);
      expect(
        inventory.filter(({ classification }) => classification === 'AUTHENTICATED'),
      ).toHaveLength(5);
      expect(
        inventory.filter(({ classification }) => classification === 'CAPABILITY_PROTECTED'),
      ).toHaveLength(156);
      expect(
        inventory.filter(({ classification }) => classification === 'LEGACY_DEFERRED'),
      ).toHaveLength(0);
      expect(
        inventory.filter(({ classification }) => classification === 'BLOCKED_UNCLASSIFIED'),
      ).toHaveLength(0);
    } finally {
      await moduleRef.close();
    }
  });
});
