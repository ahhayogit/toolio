import { z } from 'zod'

/* ----------------------------------------------------------------------------
 * Dirençler (resistance)
 * -------------------------------------------------------------------------- */

export const RESISTANCE_TYPES = ['fire', 'ice', 'electric', 'poison', 'acid'] as const
export type ResistanceType = (typeof RESISTANCE_TYPES)[number]

export const RESISTANCE_LABELS: Record<ResistanceType, string> = {
  fire: 'Ateş',
  ice: 'Buz',
  electric: 'Elektrik',
  poison: 'Zehir',
  acid: 'Asit',
}

export const resistancesSchema = z.object({
  fire: z.number().default(0),
  ice: z.number().default(0),
  electric: z.number().default(0),
  poison: z.number().default(0),
  acid: z.number().default(0),
})
export type Resistances = z.infer<typeof resistancesSchema>

export const emptyResistances = (): Resistances => ({
  fire: 0,
  ice: 0,
  electric: 0,
  poison: 0,
  acid: 0,
})

/* ----------------------------------------------------------------------------
 * Enemy (düşman)
 * -------------------------------------------------------------------------- */

export const enemySchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'İsim gerekli'),
  health: z.number().min(0).default(100),
  mana: z.number().min(0).default(0),
  armor: z.number().min(0).default(0),
  resistances: resistancesSchema,
})
export type Enemy = z.infer<typeof enemySchema>

/* ----------------------------------------------------------------------------
 * NPC
 * Görevler quest tarafında "giverNpcId" ile tutulur; tek doğru kaynak orası.
 * Böylece NPC <-> görev senkronizasyon hatası olmaz.
 * -------------------------------------------------------------------------- */

export const npcSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'İsim gerekli'),
  dialogues: z.array(z.string()).default([]),
})
export type Npc = z.infer<typeof npcSchema>

/* ----------------------------------------------------------------------------
 * Area (bölge) — keşif görevlerinin hedefi
 * -------------------------------------------------------------------------- */

export const areaSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'İsim gerekli'),
  description: z.string().default(''),
})
export type Area = z.infer<typeof areaSchema>

/* ----------------------------------------------------------------------------
 * Quest (görev) + hedef tipleri (objective)
 * -------------------------------------------------------------------------- */

export const QUEST_TYPES = ['TALK_TO_NPC', 'KILL_ENEMY', 'EXPLORE_AREA'] as const
export type QuestType = (typeof QUEST_TYPES)[number]

export const QUEST_TYPE_LABELS: Record<QuestType, string> = {
  TALK_TO_NPC: 'NPC ile konuş',
  KILL_ENEMY: 'Düşman öldür',
  EXPLORE_AREA: 'Alan keşfet',
}

export const objectiveSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('TALK_TO_NPC'), targetNpcId: z.string() }),
  z.object({ type: z.literal('KILL_ENEMY'), targetEnemyId: z.string(), amount: z.number().min(1).default(1) }),
  z.object({ type: z.literal('EXPLORE_AREA'), targetAreaId: z.string().default('') }),
])
export type Objective = z.infer<typeof objectiveSchema>

export const defaultObjective = (type: QuestType): Objective => {
  switch (type) {
    case 'TALK_TO_NPC':
      return { type: 'TALK_TO_NPC', targetNpcId: '' }
    case 'KILL_ENEMY':
      return { type: 'KILL_ENEMY', targetEnemyId: '', amount: 1 }
    case 'EXPLORE_AREA':
      return { type: 'EXPLORE_AREA', targetAreaId: '' }
  }
}

export const questSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Başlık gerekli'),
  giverNpcId: z.string().default(''),
  requiredLevel: z.number().min(1).default(1),
  dependsOnQuestId: z.string().nullable().default(null),
  rewardExp: z.number().min(0).default(0),
  rewardItem: z.string().default(''),
  objective: objectiveSchema,
})
export type Quest = z.infer<typeof questSchema>

/* ----------------------------------------------------------------------------
 * Tüm oyun verisi (export edilen JSON'un kökü)
 * -------------------------------------------------------------------------- */

export const gameDataSchema = z.object({
  version: z.literal(1).default(1),
  npcs: z.array(npcSchema).default([]),
  enemies: z.array(enemySchema).default([]),
  areas: z.array(areaSchema).default([]),
  quests: z.array(questSchema).default([]),
})
export type GameData = z.infer<typeof gameDataSchema>

export const emptyGameData = (): GameData => ({
  version: 1,
  npcs: [],
  enemies: [],
  areas: [],
  quests: [],
})
