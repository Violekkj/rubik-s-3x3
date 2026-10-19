import { describe, it, expect } from 'vitest';
import { ImageProcessor } from '../../src/features/profile/imageProcessor';

describe('Profile Logic & Validation', () => {
  it('validates WCA ID pattern correctly', () => {
    const WCA_REGEX = /^\d{4}[A-Z]{4}\d{2}$/;
    expect(WCA_REGEX.test('2015HUNG01')).toBe(true);
    expect(WCA_REGEX.test('2007VALK01')).toBe(true);
    expect(WCA_REGEX.test('2022SILV03')).toBe(true);
    
    // Invalid patterns
    expect(WCA_REGEX.test('2015hung01')).toBe(false); // lowercase
    expect(WCA_REGEX.test('201HUNG01')).toBe(false); // only 3 digits year
    expect(WCA_REGEX.test('2015HUN01')).toBe(false); // only 3 letters name
    expect(WCA_REGEX.test('2015HUNG1')).toBe(false); // only 1 digit seq
    expect(WCA_REGEX.test('invalid')).toBe(false);
  });

  it('validates Nickname pattern correctly (2-24 chars, letters, numbers, _, -, .)', () => {
    const NICK_REGEX = /^[a-zA-Z0-9_.-]{2,24}$/;
    expect(NICK_REGEX.test('cubelab')).toBe(true);
    expect(NICK_REGEX.test('speed_cuber.99')).toBe(true);
    expect(NICK_REGEX.test('c-1')).toBe(true);
    expect(NICK_REGEX.test('a')).toBe(false); // too short (<2)
    expect(NICK_REGEX.test('a'.repeat(25))).toBe(false); // too long (>24)
    expect(NICK_REGEX.test('cube lover')).toBe(false); // space not allowed
    expect(NICK_REGEX.test('cube@lab')).toBe(false); // @ not allowed in body
  });

  it('validates ImageProcessor file formats and size constraints', () => {
    const validJpeg = new File(['dummy'], 'photo.jpg', { type: 'image/jpeg' });
    const validPng = new File(['dummy'], 'photo.png', { type: 'image/png' });
    const validWebp = new File(['dummy'], 'photo.webp', { type: 'image/webp' });
    const invalidGif = new File(['dummy'], 'photo.gif', { type: 'image/gif' });

    expect(ImageProcessor.validateFile(validJpeg).valid).toBe(true);
    expect(ImageProcessor.validateFile(validPng).valid).toBe(true);
    expect(ImageProcessor.validateFile(validWebp).valid).toBe(true);
    expect(ImageProcessor.validateFile(invalidGif).valid).toBe(false);
    expect(ImageProcessor.validateFile(invalidGif).error).toContain('Formato inválido');

    // Test size > 8MB
    const bigFile = {
      name: 'big.jpg',
      type: 'image/jpeg',
      size: 9 * 1024 * 1024,
    } as unknown as File;
    const sizeCheck = ImageProcessor.validateFile(bigFile);
    expect(sizeCheck.valid).toBe(false);
    expect(sizeCheck.error).toContain('8 MB');
  });

  it('calculates best PB accurately between auto and manual', () => {
    // PB selector logic: auto vs manual vs best
    const pickPb = (mode: 'auto' | 'manual' | 'best', autoVal?: number, manualVal?: number) => {
      if (mode === 'auto') return autoVal;
      if (mode === 'manual') return manualVal;
      if (autoVal !== undefined && manualVal !== undefined) {
        return Math.min(autoVal, manualVal);
      }
      return autoVal ?? manualVal;
    };

    // Both present
    expect(pickPb('auto', 11500, 10200)).toBe(11500);
    expect(pickPb('manual', 11500, 10200)).toBe(10200);
    expect(pickPb('best', 11500, 10200)).toBe(10200);
    expect(pickPb('best', 9800, 10200)).toBe(9800);

    // Only one present
    expect(pickPb('best', 12000, undefined)).toBe(12000);
    expect(pickPb('best', undefined, 11000)).toBe(11000);
    expect(pickPb('best', undefined, undefined)).toBeUndefined();
  });

  it('calculates goal progress percentage and completion status', () => {
    const calcProgress = (targetMs: number, bestMs?: number) => {
      if (!bestMs) return { percent: 0, completed: false };
      if (bestMs <= targetMs) return { percent: 100, completed: true };
      // Progressive curve towards target
      const baseline = targetMs * 2;
      const progress = Math.max(0, Math.min(99, Math.round(((baseline - bestMs) / (baseline - targetMs)) * 100)));
      return { percent: progress, completed: false };
    };

    // Sub-20 goal (target = 20000ms)
    // Completed: best is 18.5s
    const done = calcProgress(20000, 18500);
    expect(done.completed).toBe(true);
    expect(done.percent).toBe(100);

    // In progress: best is 25s (halfway from baseline 40s to 20s)
    const inProg = calcProgress(20000, 25000);
    expect(inProg.completed).toBe(false);
    expect(inProg.percent).toBe(75);

    // No solves yet
    const none = calcProgress(20000, undefined);
    expect(none.completed).toBe(false);
    expect(none.percent).toBe(0);
  });
});
