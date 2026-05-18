import { describe, it, expect } from 'vitest'
import { formatDate, isOverdue, daysFromNow } from '../utils/formatDate.js'

describe('formatDate', () => {
  it('converte YYYY-MM-DD para DD/MM/YYYY', () => {
    expect(formatDate('2024-03-15')).toBe('15/03/2024')
  })
  it('retorna - para valor nulo', () => {
    expect(formatDate(null)).toBe('-')
    expect(formatDate(undefined)).toBe('-')
    expect(formatDate('')).toBe('-')
  })
  it('retorna o valor original se não for uma data válida', () => {
    expect(formatDate('invalid')).toBe('invalid')
  })
})

describe('isOverdue', () => {
  it('retorna false para datas futuras', () => {
    expect(isOverdue(daysFromNow(5))).toBe(false)
  })
  it('retorna true para datas passadas', () => {
    expect(isOverdue('2020-01-01')).toBe(true)
  })
  it('retorna false para valor nulo', () => {
    expect(isOverdue(null)).toBe(false)
  })
})

describe('daysFromNow', () => {
  it('retorna uma data no formato YYYY-MM-DD', () => {
    const result = daysFromNow(7)
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
