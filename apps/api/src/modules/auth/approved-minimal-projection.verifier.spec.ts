import {
  APPROVED_MINIMAL_ENDPOINTS,
  verifyApprovedMinimalProjection,
} from './approved-minimal-projection.verifier';
import { APPROVED_MINIMAL_PROJECTION_CATALOG } from './approved-minimal-projection.catalog';

describe('approved minimal projection verifier', () => {
  it('accepts only the 110 approved fields across 33 canonical endpoints', () => {
    expect(verifyApprovedMinimalProjection()).toEqual([]);
    expect(APPROVED_MINIMAL_PROJECTION_CATALOG).toHaveLength(110);
    expect(APPROVED_MINIMAL_ENDPOINTS).toHaveLength(33);
    expect(APPROVED_MINIMAL_PROJECTION_CATALOG.every(({ profile }) => profile === 'MINIMAL')).toBe(
      true,
    );
    expect(APPROVED_MINIMAL_PROJECTION_CATALOG.every(({ masking }) => masking === 'NONE')).toBe(
      true,
    );
  });
});
