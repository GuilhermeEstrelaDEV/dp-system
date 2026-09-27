import configuration from './configuration';

describe('configuration', () => {
  const previousPort = process.env.PORT;
  const previousApiPort = process.env.API_PORT;

  afterEach(() => {
    if (previousPort === undefined) delete process.env.PORT;
    else process.env.PORT = previousPort;
    if (previousApiPort === undefined) delete process.env.API_PORT;
    else process.env.API_PORT = previousApiPort;
  });

  it('prefers the provider-managed PORT over the local API_PORT', () => {
    process.env.PORT = '10000';
    process.env.API_PORT = '53000';

    expect(configuration().app.port).toBe(10000);
  });

  it('preserves API_PORT for local environments', () => {
    delete process.env.PORT;
    process.env.API_PORT = '53000';

    expect(configuration().app.port).toBe(53000);
  });
});
