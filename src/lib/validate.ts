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
  const affixById = new Map(data.affixes.map((a) => [a.id, a]))
  const itemById = new Map(data.items.map((i) => [i.id, i]))

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

    // Ödül ekleri: var olmalı, doğru türde olmalı ve item ile aynı seviyede olmalı.
    const rewardItem = q.rewardItemId ? itemById.get(q.rewardItemId) : undefined
    const checkRewardAffix = (affixId: string | null, kind: 'prefix' | 'suffix', adi: string) => {
      if (!affixId) return
      const affix = affixById.get(affixId)
      if (!affix || affix.kind !== kind) {
        issues.push({ questId: q.id, message: `"${label}" ödül ${adi} tanımlı değil` })
      } else if (!q.rewardItemId) {
        issues.push({ questId: q.id, message: `"${label}" ${adi} var ama ödül item değil` })
      } else if (rewardItem && affix.level !== rewardItem.level) {
        issues.push({ questId: q.id, message: `"${label}" ödül ${adi} item ile aynı seviyede değil` })
      }
    }
    checkRewardAffix(q.rewardPrefixId, 'prefix', 'ön eki')
    checkRewardAffix(q.rewardSuffixId, 'suffix', 'son eki')
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
