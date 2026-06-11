import type { Area, Enemy, Npc, Objective } from '../types/model'

interface Refs {
  npcs: Npc[]
  enemies: Enemy[]
  areas: Area[]
}

/** Görev hedefinden okunabilir özet üretir. Örn: "5 adet Fare öldür". */
export function objectiveSummary(objective: Objective, refs: Refs): string {
  switch (objective.type) {
    case 'TALK_TO_NPC': {
      const npc = refs.npcs.find((n) => n.id === objective.targetNpcId)
      return `${npc?.name ?? '???'} ile konuş`
    }
    case 'KILL_ENEMY': {
      const enemy = refs.enemies.find((e) => e.id === objective.targetEnemyId)
      return `${objective.amount} adet ${enemy?.name ?? '???'} öldür`
    }
    case 'EXPLORE_AREA': {
      const area = refs.areas.find((a) => a.id === objective.targetAreaId)
      return `${area?.name ?? '???'} bölgesini keşfet`
    }
  }
}
