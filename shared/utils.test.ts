import { calcPctChange } from './utils'
describe('calcPctChange', () => {
  test('handles zero prior and zero current', () => {
    expect(calcPctChange(0, 0)).toBe('0.0%')
  })
  test('handles zero prior with positive current', () => {
    expect(calcPctChange(100, 0)).toBe('+100.0%')
    expect(calcPctChange(50, 0)).toBe('+100.0%')
  })
  test('handles zero prior with negative current', () => {
    expect(calcPctChange(-100, 0)).toBe('-100.0%')
  })
  test('calculates positive percentage change correctly', () => {
    expect(calcPctChange(120, 100)).toBe('+20.0%')
    expect(calcPctChange(150, 100)).toBe('+50.0%')
    expect(calcPctChange(110, 100)).toBe('+10.0%')
  })
  test('calculates negative percentage change correctly', () => {
    expect(calcPctChange(80, 100)).toBe('-20.0%')
    expect(calcPctChange(50, 100)).toBe('-50.0%')
    expect(calcPctChange(90, 100)).toBe('-10.0%')
  })
  test('handles decimal values correctly', () => {
    expect(calcPctChange(102.5, 100)).toBe('+2.5%')
    expect(calcPctChange(97.3, 100)).toBe('-2.7%')
  })
  test('rounds to one decimal place', () => {
    expect(calcPctChange(101.23456, 100)).toBe('+1.2%')
    expect(calcPctChange(98.76543, 100)).toBe('-1.2%')
  })
  test('handles large percentage changes', () => {
    expect(calcPctChange(500, 100)).toBe('+400.0%')
    expect(calcPctChange(10, 100)).toBe('-90.0%')
  })
  test('handles small values', () => {
    expect(calcPctChange(0.02, 0.01)).toBe('+100.0%')
    expect(calcPctChange(0.005, 0.01)).toBe('-50.0%')
  })
  test('handles edge case: current is zero but prior is not', () => {
    expect(calcPctChange(0, 100)).toBe('-100.0%')
    expect(calcPctChange(0, 50)).toBe('-100.0%')
  })
});