import type { GameData } from '../types/model'

export interface Issue {
  questId: string
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
  const questIds = new Set(data.quests.map((q) => q.id))

  for (const q of data.quests) {
    const label = q.title || q.id
    if (!q.giverNpcId || !npcIds.has(q.giverNpcId)) {
      issues.push({ questId: q.id, message: `"${label}" görevini veren NPC tanımlı değil` })
    }
    if (q.dependsOnQuestId && !questIds.has(q.dependsOnQuestId)) {
      issues.push({ questId: q.id, message: `"${label}" bağımlı olduğu görev bulunamadı` })
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
