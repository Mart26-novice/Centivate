import { describe, it, expect } from 'vitest';
import { escapeHtml } from '../../api/lib/email';

describe('escapeHtml (assignment emails contain public complaint text)', () => {
  it('neutralises HTML and script injection', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(escapeHtml('<a href="https://evil.example">click</a>')).not.toContain('<a');
  });

  it('escapes quotes and ampersands, and tolerates null/undefined', () => {
    expect(escapeHtml(`Tom & "Jerry's"`)).toBe('Tom &amp; &quot;Jerry&#39;s&quot;');
    expect(escapeHtml(undefined)).toBe('');
    expect(escapeHtml(null)).toBe('');
  });
});
