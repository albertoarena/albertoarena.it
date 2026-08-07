import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { PDFDocument } from 'pdf-lib';

const PDF_PATH = join('public', 'downloads', 'spatie-event-sourcing-cheatsheet.pdf');

describe('spatie event sourcing cheat sheet PDF', () => {
  it('is committed to public/downloads', () => {
    expect(existsSync(PDF_PATH)).toBe(true);
  });

  it('is not empty or a stub', () => {
    const { size } = statSync(PDF_PATH);
    expect(size).toBeGreaterThan(10_000);
  });

  it('is a short printable reference, not a runaway document', async () => {
    const bytes = readFileSync(PDF_PATH);
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(1);
    expect(doc.getPageCount()).toBeLessThanOrEqual(4);
  });
});
