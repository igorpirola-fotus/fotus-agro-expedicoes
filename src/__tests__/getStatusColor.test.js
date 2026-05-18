import { describe, it, expect } from 'vitest'
import { getStatusColor } from '../utils/getStatusColor.js'

describe('getStatusColor', () => {
  it('retorna cor correta para expedição aguardando aprovação', () => {
    const cls = getStatusColor('aguardando_aprovacao', 'expedition')
    expect(cls).toContain('purple')
  })
  it('retorna cor correta para ação concluída', () => {
    const cls = getStatusColor('concluida', 'action')
    expect(cls).toContain('emerald')
  })
  it('retorna cor correta para visita realizada', () => {
    const cls = getStatusColor('realizada', 'visit')
    expect(cls).toContain('emerald')
  })
  it('retorna fallback para status desconhecido', () => {
    const cls = getStatusColor('status_inexistente', 'expedition')
    expect(cls).toContain('gray')
  })
  it('retorna fallback para tipo desconhecido', () => {
    const cls = getStatusColor('concluida', 'tipo_invalido')
    expect(cls).toContain('gray')
  })
})
