import { normalizeDateInput } from './normalizeDateInput';

describe('normalizeDateInput', () => {

  it('parses YYYY-MM-DD string', () => {
    const res = normalizeDateInput('2024-01-01');
    expect(res.ok).toBe(true);
    if (!res.ok) throw new Error('expected success');
    expect(res.date.toISOString().startsWith('2024-01-01')).toBe(true);
  });

  it('parses Excel serial number', () => {
    // 2024-01-01 = 45292
    const res = normalizeDateInput(45292);
    expect(res.ok).toBe(true);
    if (!res.ok) throw new Error('expected success');
    expect(res.date.toISOString().startsWith('2024-01-01')).toBe(true);
  });

  it('errors on invalid input', () => {
    const res = normalizeDateInput('not-a-date');
    expect(res.ok).toBe(false);
  });
});
