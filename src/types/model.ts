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
  level: z.number().min(1).default(1),
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
 * Material (üretim materyali) — item'ların yapımında kullanılır
 * -------------------------------------------------------------------------- */

export const materialSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'İsim gerekli'),
  description: z.string().default(''),
  level: z.number().min(1).default(1),
  // Açıkken bu materyal kendi level'inde 4 kıyafet item'ı (zırh hariç) üretir.
  isBaseMaterial: z.boolean().default(false),
})
export type Material = z.infer<typeof materialSchema>

/* ----------------------------------------------------------------------------
 * Item (giyilebilir eşya) — şimdilik sadece zırh parçaları, silah yok
 * -------------------------------------------------------------------------- */

export const ITEM_SLOTS = [
  'gloves',
  'pants',
  'jacket',
  'shoes',
  'armor',
  'ring',
  'necklace',
] as const
export type ItemSlot = (typeof ITEM_SLOTS)[number]

export const ITEM_SLOT_LABELS: Record<ItemSlot, string> = {
  gloves: 'Eldiven',
  pants: 'Pantolon',
  jacket: 'Ceket',
  shoes: 'Ayakkabı',
  armor: 'Zırh', // gövde zırhı / kalkan gibi
  ring: 'Yüzük',
  necklace: 'Kolye',
}

// Bir item'ın yapımında gereken materyal + miktar
export const itemMaterialSchema = z.object({
  materialId: z.string(),
  quantity: z.number().min(1).default(1),
})
export type ItemMaterial = z.infer<typeof itemMaterialSchema>

export const itemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'İsim gerekli'),
  slot: z.enum(ITEM_SLOTS),
  level: z.number().min(1).default(1),
  armor: z.number().min(0).default(0),
  materials: z.array(itemMaterialSchema).default([]),
  // Bir temel materyalden otomatik üretildiyse o materyalin id'si; manuel item'larda null.
  baseMaterialId: z.string().nullable().default(null),
})
export type Item = z.infer<typeof itemSchema>

/* ----------------------------------------------------------------------------
 * Affix (ön ek / son ek) — item'lara uygulanır. Etkiler sonra tanımlanacak.
 * Örn: "buz hasarlı" (ön ek), "zehir dirençli" (son ek)
 * -------------------------------------------------------------------------- */

export const AFFIX_KINDS = ['prefix', 'suffix'] as const
export type AffixKind = (typeof AFFIX_KINDS)[number]

export const AFFIX_KIND_LABELS: Record<AffixKind, string> = {
  prefix: 'Ön ek',
  suffix: 'Son ek',
}

// Elemental gruplar (fiziksel hasar, büyü hasarı, direnç) hepsi 5 element içerir
// ve resistancesSchema ile aynı şekle sahiptir. Eksikse hepsi 0'a düşer.
const elementalSchema = resistancesSchema.default({})

export const affixSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('prefix'),
    id: z.string(),
    name: z.string().min(1, 'İsim gerekli'),
    level: z.number().min(1).default(1),
    description: z.string().default(''),
    physicalDamage: elementalSchema, // fiziksel hasar (ateş/buz/elektrik/zehir/asit)
    magicDamage: elementalSchema, // büyü hasarı (ateş/buz/elektrik/zehir/asit)
    maxHealth: z.number().default(0), // maksimum can
  }),
  z.object({
    kind: z.literal('suffix'),
    id: z.string(),
    name: z.string().min(1, 'İsim gerekli'),
    level: z.number().min(1).default(1),
    description: z.string().default(''),
    attack: z.number().default(0), // saldırı değeri (float)
    defense: z.number().default(0), // savunma değeri (float)
    maxMana: z.number().default(0), // maksimum mana (kudret)
    resistance: elementalSchema, // direnç (ateş/buz/elektrik/zehir/asit)
    armor: z.number().default(0), // zırh (float)
  }),
])
export type Affix = z.infer<typeof affixSchema>

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
  description: z.string().default(''),
  giverNpcId: z.string().default(''),
  requiredLevel: z.number().min(1).default(1),
  dependsOnQuestId: z.string().nullable().default(null),
  rewardExp: z.number().min(0).default(0),
  // Ödül ya bir item ya da bir materyaldir (ikisi birden değil); ikisi de null olabilir.
  rewardItemId: z.string().nullable().default(null),
  rewardMaterialId: z.string().nullable().default(null),
  // Ödül item'ına uygulanan ekler (item ile aynı seviyede olmalı).
  rewardPrefixId: z.string().nullable().default(null),
  rewardSuffixId: z.string().nullable().default(null),
  rewardQuantity: z.number().min(1).default(1),
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
  materials: z.array(materialSchema).default([]),
  items: z.array(itemSchema).default([]),
  affixes: z.array(affixSchema).default([]),
  quests: z.array(questSchema).default([]),
})
export type GameData = z.infer<typeof gameDataSchema>

export const emptyGameData = (): GameData => ({
  version: 1,
  npcs: [],
  enemies: [],
  areas: [],
  materials: [],
  items: [],
  affixes: [],
  quests: [],
})
