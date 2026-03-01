import { describe, it, expect } from 'vitest';
import {
  calculateEndTime,
  convert12HourTo24Hour,
  convert24HourTo12Hour,
  isTimeConflict,
} from '../time.utils';

describe('time.utils', () => {
  // -----------------------------------------------------------------------
  // calculateEndTime
  // -----------------------------------------------------------------------
  describe('calculateEndTime', () => {
    it('returns empty string for empty input', () => {
      expect(calculateEndTime('', 30)).toBe('');
    });

    it('adds 30 minutes to a morning time', () => {
      expect(calculateEndTime('9:00 AM', 30)).toBe('9:30 AM');
    });

    it('adds 60 minutes to a morning time', () => {
      expect(calculateEndTime('10:00 AM', 60)).toBe('11:00 AM');
    });

    it('handles noon crossing (AM to PM)', () => {
      expect(calculateEndTime('11:30 AM', 60)).toBe('12:30 PM');
    });

    it('adds time to 12:00 PM correctly', () => {
      expect(calculateEndTime('12:00 PM', 30)).toBe('12:30 PM');
    });

    it('adds time in the afternoon', () => {
      expect(calculateEndTime('2:00 PM', 45)).toBe('2:45 PM');
    });

    it('handles 12:00 AM (midnight) correctly', () => {
      expect(calculateEndTime('12:00 AM', 60)).toBe('1:00 AM');
    });

    it('adds 15 minutes properly', () => {
      expect(calculateEndTime('3:45 PM', 15)).toBe('4:00 PM');
    });
  });

  // -----------------------------------------------------------------------
  // convert12HourTo24Hour
  // -----------------------------------------------------------------------
  describe('convert12HourTo24Hour', () => {
    it('converts 12:00 AM to 00:00', () => {
      expect(convert12HourTo24Hour('12:00 AM')).toBe('00:00');
    });

    it('converts 12:30 AM to 00:30', () => {
      expect(convert12HourTo24Hour('12:30 AM')).toBe('00:30');
    });

    it('converts 1:00 AM to 01:00', () => {
      expect(convert12HourTo24Hour('1:00 AM')).toBe('01:00');
    });

    it('converts 12:00 PM to 12:00', () => {
      expect(convert12HourTo24Hour('12:00 PM')).toBe('12:00');
    });

    it('converts 1:00 PM to 13:00', () => {
      expect(convert12HourTo24Hour('1:00 PM')).toBe('13:00');
    });

    it('converts 11:59 PM to 23:59', () => {
      expect(convert12HourTo24Hour('11:59 PM')).toBe('23:59');
    });

    it('converts 9:30 AM to 09:30', () => {
      expect(convert12HourTo24Hour('9:30 AM')).toBe('09:30');
    });
  });

  // -----------------------------------------------------------------------
  // convert24HourTo12Hour
  // -----------------------------------------------------------------------
  describe('convert24HourTo12Hour', () => {
    it('converts 00:00 to 12:00 AM', () => {
      expect(convert24HourTo12Hour('00:00')).toBe('12:00 AM');
    });

    it('converts 01:00 to 1:00 AM', () => {
      expect(convert24HourTo12Hour('01:00')).toBe('1:00 AM');
    });

    it('converts 12:00 to 12:00 PM', () => {
      expect(convert24HourTo12Hour('12:00')).toBe('12:00 PM');
    });

    it('converts 13:00 to 1:00 PM', () => {
      expect(convert24HourTo12Hour('13:00')).toBe('1:00 PM');
    });

    it('converts 23:59 to 11:59 PM', () => {
      expect(convert24HourTo12Hour('23:59')).toBe('11:59 PM');
    });

    it('converts 09:30 to 9:30 AM', () => {
      expect(convert24HourTo12Hour('09:30')).toBe('9:30 AM');
    });
  });

  // -----------------------------------------------------------------------
  // isTimeConflict
  // -----------------------------------------------------------------------
  describe('isTimeConflict', () => {
    it('detects overlapping meetings', () => {
      // 9:00-10:00 overlaps with 9:30-10:30
      expect(isTimeConflict('9:00 AM', 60, '9:30 AM', 60)).toBe(true);
    });

    it('detects one meeting inside another', () => {
      // 9:00-11:00 contains 10:00-10:30
      expect(isTimeConflict('9:00 AM', 120, '10:00 AM', 30)).toBe(true);
    });

    it('detects no conflict for back-to-back meetings', () => {
      // 9:00-10:00 does NOT overlap with 10:00-11:00
      expect(isTimeConflict('9:00 AM', 60, '10:00 AM', 60)).toBe(false);
    });

    it('detects no conflict for separate meetings', () => {
      // 9:00-10:00 does NOT overlap with 2:00-3:00
      expect(isTimeConflict('9:00 AM', 60, '2:00 PM', 60)).toBe(false);
    });

    it('detects conflict across AM/PM boundary', () => {
      // 11:00-12:30 overlaps with 12:00-1:00
      expect(isTimeConflict('11:00 AM', 90, '12:00 PM', 60)).toBe(true);
    });
  });
});
