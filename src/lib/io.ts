import { gameDataSchema, type GameData } from '../types/model'

/** GameData'yı düzgün biçimlendirilmiş JSON olarak indirir. */
export function downloadJson(data: GameData, filename = 'rpg-data.json'): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/**
 * Seçilen dosyayı okur, JSON'a çevirir ve şemaya göre doğrular.
 * Geçersizse hata fırlatır (mesajı UI'da gösteriyoruz).
 */
export async function parseJsonFile(file: File): Promise<GameData> {
  const text = await file.text()
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error('Dosya geçerli bir JSON değil.')
  }
  const result = gameDataSchema.safeParse(json)
  if (!result.success) {
    const first = result.error.issues[0]
    throw new Error(
      `JSON şemaya uymuyor${first ? `: ${first.path.join('.')} — ${first.message}` : '.'}`,
    )
  }
  return result.data
}
