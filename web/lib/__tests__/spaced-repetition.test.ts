import { describe, it, expect } from 'vitest';
import {
  mapConfidenceToQuality,
  calculateNextReview,
} from '../spaced-repetition';

describe('mapConfidenceToQuality', () => {
  it('maps correct + confidence 1 → quality 3', () => {
    expect(mapConfidenceToQuality(1, true)).toBe(3);
  });

  it('maps correct + confidence 2 → quality 3', () => {
    expect(mapConfidenceToQuality(2, true)).toBe(3);
  });

  it('maps correct + confidence 3 → quality 4', () => {
    expect(mapConfidenceToQuality(3, true)).toBe(4);
  });

  it('maps correct + confidence 4 → quality 4', () => {
    expect(mapConfidenceToQuality(4, true)).toBe(4);
  });

  it('maps correct + confidence 5 → quality 5 (perfect)', () => {
    expect(mapConfidenceToQuality(5, true)).toBe(5);
  });

  it('maps incorrect + confidence 1 → quality 2', () => {
    expect(mapConfidenceToQuality(1, false)).toBe(2);
  });

  it('maps incorrect + confidence 2 → quality 2', () => {
    expect(mapConfidenceToQuality(2, false)).toBe(2);
  });

  it('maps incorrect + confidence 3 → quality 1', () => {
    expect(mapConfidenceToQuality(3, false)).toBe(1);
  });

  it('maps incorrect + confidence 4 → quality 1', () => {
    expect(mapConfidenceToQuality(4, false)).toBe(1);
  });

  it('maps incorrect + confidence 5 → quality 0 (hypercorrection)', () => {
    expect(mapConfidenceToQuality(5, false)).toBe(0);
  });
});

describe('calculateNextReview', () => {
  describe('correct responses (quality >= 3)', () => {
    it('rep 0 → interval 1 day (first correct)', () => {
      const result = calculateNextReview({
        repetitionNumber: 0,
        easeFactor: 2.5,
        intervalDays: 1,
        quality: 4,
      });
      expect(result.repetitionNumber).toBe(1);
      expect(result.intervalDays).toBe(1);
    });

    it('rep 1 → interval 3 days (second correct)', () => {
      const result = calculateNextReview({
        repetitionNumber: 1,
        easeFactor: 2.5,
        intervalDays: 1,
        quality: 4,
      });
      expect(result.repetitionNumber).toBe(2);
      expect(result.intervalDays).toBe(3);
    });

    it('rep 2+ → interval = round(prev * EF)', () => {
      const result = calculateNextReview({
        repetitionNumber: 2,
        easeFactor: 2.5,
        intervalDays: 3,
        quality: 4,
      });
      expect(result.repetitionNumber).toBe(3);
      expect(result.intervalDays).toBe(Math.round(3 * 2.5)); // 8
    });

    it('adjusts ease factor upward for quality 5', () => {
      const result = calculateNextReview({
        repetitionNumber: 2,
        easeFactor: 2.5,
        intervalDays: 3,
        quality: 5,
      });
      // EF' = 2.5 + (0.1 - 0*(0.08 + 0*0.02)) = 2.6
      expect(result.easeFactor).toBeCloseTo(2.6);
    });

    it('adjusts ease factor for quality 3', () => {
      const result = calculateNextReview({
        repetitionNumber: 2,
        easeFactor: 2.5,
        intervalDays: 3,
        quality: 3,
      });
      // EF' = 2.5 + (0.1 - 2*(0.08 + 2*0.02)) = 2.5 + (0.1 - 0.24) = 2.36
      expect(result.easeFactor).toBeCloseTo(2.36);
    });

    it('clamps ease factor at minimum 1.3', () => {
      const result = calculateNextReview({
        repetitionNumber: 2,
        easeFactor: 1.3,
        intervalDays: 3,
        quality: 3,
      });
      expect(result.easeFactor).toBe(1.3);
    });
  });

  describe('incorrect responses (quality < 3)', () => {
    it('resets repetition to 0', () => {
      const result = calculateNextReview({
        repetitionNumber: 5,
        easeFactor: 2.5,
        intervalDays: 30,
        quality: 2,
      });
      expect(result.repetitionNumber).toBe(0);
    });

    it('resets interval to 1', () => {
      const result = calculateNextReview({
        repetitionNumber: 5,
        easeFactor: 2.5,
        intervalDays: 30,
        quality: 1,
      });
      expect(result.intervalDays).toBe(1);
    });

    it('keeps ease factor unchanged on failure', () => {
      const result = calculateNextReview({
        repetitionNumber: 3,
        easeFactor: 2.1,
        intervalDays: 10,
        quality: 0,
      });
      expect(result.easeFactor).toBe(2.1);
    });
  });

  describe('edge cases', () => {
    it('quality 0 (hypercorrection) resets fully', () => {
      const result = calculateNextReview({
        repetitionNumber: 10,
        easeFactor: 2.8,
        intervalDays: 100,
        quality: 0,
      });
      expect(result.repetitionNumber).toBe(0);
      expect(result.intervalDays).toBe(1);
      expect(result.easeFactor).toBe(2.8);
    });

    it('sets nextReviewAt in the future', () => {
      const before = new Date();
      const result = calculateNextReview({
        repetitionNumber: 0,
        easeFactor: 2.5,
        intervalDays: 1,
        quality: 4,
      });
      expect(result.nextReviewAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime()
      );
    });

    it('boundary: quality exactly 3 counts as correct', () => {
      const result = calculateNextReview({
        repetitionNumber: 0,
        easeFactor: 2.5,
        intervalDays: 1,
        quality: 3,
      });
      expect(result.repetitionNumber).toBe(1);
    });

    it('boundary: quality exactly 2 counts as incorrect', () => {
      const result = calculateNextReview({
        repetitionNumber: 3,
        easeFactor: 2.5,
        intervalDays: 10,
        quality: 2,
      });
      expect(result.repetitionNumber).toBe(0);
    });

    it('long interval chain grows correctly', () => {
      let rep = 0;
      let ef = 2.5;
      let interval = 1;

      // Simulate 5 correct answers with quality 4
      for (let i = 0; i < 5; i++) {
        const result = calculateNextReview({
          repetitionNumber: rep,
          easeFactor: ef,
          intervalDays: interval,
          quality: 4,
        });
        rep = result.repetitionNumber;
        ef = result.easeFactor;
        interval = result.intervalDays;
      }

      // After 5 correct: intervals should be 1, 3, then growing
      expect(rep).toBe(5);
      expect(interval).toBeGreaterThan(3);
      expect(ef).toBeLessThanOrEqual(2.5); // quality 4 doesn't increase EF much
    });
  });
});
