/** Okunabilir, çakışmayan id üretir. Örn: npc_a1b2c3d4 */
export function newId(prefix: string): string {
  const uuid =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(16).slice(2)
  return `${prefix}_${uuid.replace(/-/g, '').slice(0, 8)}`
}
