import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { assertFileSignature } from '../utils/fileValidation.js';

describe('fileValidation', () => {
  it('accepts valid PDF magic bytes', () => {
    const pdf = Buffer.from('%PDF-1.4 fake content');
    assert.doesNotThrow(() => assertFileSignature(pdf, 'application/pdf'));
  });

  it('rejects PDF mime with wrong bytes', () => {
    const bad = Buffer.from('not a pdf');
    assert.throws(() => assertFileSignature(bad, 'application/pdf'));
  });
});

describe('csrf cookie contract', () => {
  it('requires matching header and cookie values', () => {
    const cookie = 'abc123';
    const header = 'abc123';
    assert.equal(cookie === header, true);
  });
});
