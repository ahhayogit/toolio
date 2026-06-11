import type { GameData } from '../types/model'

export interface Issue {
  questId?: string
  message: string
}

/**
 * Kırık referansları bulur (silinmiş NPC/düşman/göreve işaret eden görevler).
 * Engelleyici değil; sadece uyarı amaçlı gösterilir.
 */
export function findIssues(data: GameData): Issue[] {
  const issues: Issue[] = []
  const npcIds = new Set(data.npcs.map((n) => n.id))
  const enemyIds = new Set(data.enemies.map((e) => e.id))
  const areaIds = new Set(data.areas.map((a) => a.id))
  const materialIds = new Set(data.materials.map((m) => m.id))
  const itemIds = new Set(data.items.map((i) => i.id))
  const questIds = new Set(data.quests.map((q) => q.id))

  // Item materyalleri silinmiş materyale işaret ediyor mu?
  for (const it of data.items) {
    for (const m of it.materials) {
      if (!materialIds.has(m.materialId)) {
        issues.push({ message: `"${it.name || it.id}" item'ının bir materyali tanımlı değil` })
      }
    }
  }

  for (const q of data.quests) {
    const label = q.title || q.id
    if (!q.giverNpcId || !npcIds.has(q.giverNpcId)) {
      issues.push({ questId: q.id, message: `"${label}" görevini veren NPC tanımlı değil` })
    }
    if (q.dependsOnQuestId && !questIds.has(q.dependsOnQuestId)) {
      issues.push({ questId: q.id, message: `"${label}" bağımlı olduğu görev bulunamadı` })
    }
    if (q.rewardItemId && !itemIds.has(q.rewardItemId)) {
      issues.push({ questId: q.id, message: `"${label}" ödül item'ı tanımlı değil` })
    }
    if (q.rewardMaterialId && !materialIds.has(q.rewardMaterialId)) {
      issues.push({ questId: q.id, message: `"${label}" ödül materyali tanımlı değil` })
    }
    if (q.objective.type === 'TALK_TO_NPC' && !npcIds.has(q.objective.targetNpcId)) {
      issues.push({ questId: q.id, message: `"${label}" hedef NPC tanımlı değil` })
    }
    if (q.objective.type === 'KILL_ENEMY' && !enemyIds.has(q.objective.targetEnemyId)) {
      issues.push({ questId: q.id, message: `"${label}" hedef düşman tanımlı değil` })
    }
    if (q.objective.type === 'EXPLORE_AREA' && !areaIds.has(q.objective.targetAreaId)) {
      issues.push({ questId: q.id, message: `"${label}" hedef bölge tanımlı değil` })
    }
  }
  return issues
}
