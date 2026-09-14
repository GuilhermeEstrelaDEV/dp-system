import {
  assertExternalDemoEnvironment,
  requireExternalReviewerCredentials,
} from './external-demo-environment';

const valid = {
  NODE_ENV: 'production',
  DEPLOYMENT_ENV: 'external-demo',
  EXTERNAL_DEMO_MODE: 'true',
  DEMO_ENV: 'external-demo',
  DEMO_MODE: 'true',
  DEMO_SEED_ENABLED: 'true',
  EXTERNAL_DEMO_CONFIRM_DATABASE: 'dp_system_external_demo',
  DATABASE_URL: 'postgresql://external_demo@private-db.example:5432/dp_system_external_demo',
};
const reviewerPassword = 'x'.repeat(20);

describe('external demo environment gate', () => {
  it('accepts only the explicit external-demo target', () => {
    expect(() => assertExternalDemoEnvironment(valid)).not.toThrow();
  });

  it.each([
    { ...valid, EXTERNAL_DEMO_MODE: 'false' },
    { ...valid, DEPLOYMENT_ENV: 'production' },
    {
      ...valid,
      DATABASE_URL: 'postgresql://external_demo@localhost:5432/dp_system_external_demo',
    },
    {
      ...valid,
      DATABASE_URL: 'postgresql://external_demo@private-db.example:5432/company_data',
    },
  ])('fails closed for an invalid target', (environment) => {
    expect(() => assertExternalDemoEnvironment(environment)).toThrow('Demo externa recusada');
  });

  it('requires a distinct fictitious reviewer credential', () => {
    expect(
      requireExternalReviewerCredentials({
        ...valid,
        EXTERNAL_DEMO_REVIEWER_EMAIL: 'reviewer.demo@dp-system.local',
        EXTERNAL_DEMO_REVIEWER_PASSWORD: reviewerPassword,
      }),
    ).toEqual({
      email: 'reviewer.demo@dp-system.local',
      password: reviewerPassword,
    });
  });

  it.each([
    ['admin.demo@dp-system.local', reviewerPassword],
    ['reviewer.demo@dp-system.local', 'DemoAdmin#not-allowed'],
    ['reviewer@example.com', reviewerPassword],
  ])('rejects local or non-fictitious reviewer credentials', (email, password) => {
    expect(() =>
      requireExternalReviewerCredentials({
        ...valid,
        EXTERNAL_DEMO_REVIEWER_EMAIL: email,
        EXTERNAL_DEMO_REVIEWER_PASSWORD: password,
      }),
    ).toThrow('Reviewer recusado');
  });
});
