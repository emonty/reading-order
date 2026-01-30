import loader from '@/loader';

describe('Data JSON', () => {
  it('can be loaded', async () => {
    const module = await import('../../public/data.json');
    const file = module.default;
    expect(file).toBeInstanceOf(Object);
    loader(file);
  });
});
