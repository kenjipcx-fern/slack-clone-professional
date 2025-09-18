import { cn, formatTime, getInitials, truncate, generateAvatarColor } from '../utils';

describe('Utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('px-2 py-1', 'px-3')).toBe('py-1 px-3');
    });

    it('should handle conditional classes', () => {
      expect(cn('base-class', true && 'conditional-class')).toBe(
        'base-class conditional-class',
      );
      expect(cn('base-class', false && 'conditional-class')).toBe('base-class');
    });
  });

  describe('formatTime', () => {
    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-01T12:00:00.000Z'));
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('should format recent time as "now"', () => {
      const recentTime = new Date('2024-01-01T11:59:30.000Z');
      expect(formatTime(recentTime)).toBe('now');
    });

    it('should format minutes ago', () => {
      const minutesAgo = new Date('2024-01-01T11:55:00.000Z');
      expect(formatTime(minutesAgo)).toBe('5m ago');
    });

    it('should format hours ago', () => {
      const hoursAgo = new Date('2024-01-01T10:00:00.000Z');
      expect(formatTime(hoursAgo)).toBe('2h ago');
    });

    it('should format days ago', () => {
      const daysAgo = new Date('2023-12-30T12:00:00.000Z');
      expect(formatTime(daysAgo)).toBe('2d ago');
    });
  });

  describe('getInitials', () => {
    it('should get initials from full name', () => {
      expect(getInitials('John Doe')).toBe('JD');
    });

    it('should get initials from single name', () => {
      expect(getInitials('Alice')).toBe('A');
    });

    it('should limit to 2 characters', () => {
      expect(getInitials('Alice Johnson Smith')).toBe('AJ');
    });

    it('should handle empty string', () => {
      expect(getInitials('')).toBe('');
    });
  });

  describe('truncate', () => {
    it('should truncate long text', () => {
      expect(truncate('This is a long message', 10)).toBe('This is a ...');
    });

    it('should not truncate short text', () => {
      expect(truncate('Short', 10)).toBe('Short');
    });

    it('should handle exact length', () => {
      expect(truncate('Exactly10!', 10)).toBe('Exactly10!');
    });
  });

  describe('generateAvatarColor', () => {
    it('should generate consistent colors for same seed', () => {
      const color1 = generateAvatarColor('user123');
      const color2 = generateAvatarColor('user123');
      expect(color1).toBe(color2);
    });

    it('should generate different colors for different seeds', () => {
      const color1 = generateAvatarColor('user1');
      const color2 = generateAvatarColor('user2');
      expect(color1).not.toBe(color2);
    });

    it('should return valid hex color', () => {
      const color = generateAvatarColor('test');
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });
});
