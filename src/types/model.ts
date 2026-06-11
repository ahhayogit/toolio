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
  level: z.number().min(1).default(1),
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

export const MATERIAL_TYPES = ['maden', 'bitki', 'cevher'] as const
export type MaterialType = (typeof MATERIAL_TYPES)[number]

export const MATERIAL_TYPE_LABELS: Record<MaterialType, string> = {
  maden: 'Maden',
  bitki: 'Bitki',
  cevher: 'Cevher',
}

export const materialSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'İsim gerekli'),
  type: z.enum(MATERIAL_TYPES).default('maden'),
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
 * Affix (efsun / ön ek / son ek) — item'lara uygulanır.
 * Her efsun TEK bir statı belirli bir değerle artırır; stat türü ön/son eki belirler.
 * Örn: "Buz Hasarı Veren" (ön ek, hasarIce), "Ateş Direnci Artırıcı" (son ek, resistFire)
 * -------------------------------------------------------------------------- */

export const AFFIX_KINDS = ['prefix', 'suffix'] as const
export type AffixKind = (typeof AFFIX_KINDS)[number]

export const AFFIX_KIND_LABELS: Record<AffixKind, string> = {
  prefix: 'Ön ek',
  suffix: 'Son ek',
}

// Tüm efsun stat türleri. Sıra, formdaki gösterim sırasıdır.
export const AFFIX_STAT_KEYS = [
  // Ön ek — hasar
  'hasarFire',
  'hasarIce',
  'hasarElectric',
  'hasarAcid',
  'hasarPoison',
  'magicPhysical',
  'magicFire',
  'magicIce',
  'magicElectric',
  'magicAcid',
  'magicPoison',
  'maxDamage',
  // Son ek
  'attack',
  'defense',
  'armor',
  'resistFire',
  'resistIce',
  'resistElectric',
  'resistAcid',
  'resistPoison',
  'maxKudret',
  'maxEnergy',
  'healing',
  'critChance',
  'magicCrit',
  'moveSpeed',
  'critArmor',
] as const
export type AffixStat = (typeof AFFIX_STAT_KEYS)[number]

export const AFFIX_STAT_DEFS: Record<AffixStat, { label: string; kind: AffixKind }> = {
  hasarFire: { label: 'Ateş hasarı', kind: 'prefix' },
  hasarIce: { label: 'Buz hasarı', kind: 'prefix' },
  hasarElectric: { label: 'Elektrik hasarı', kind: 'prefix' },
  hasarAcid: { label: 'Asit hasarı', kind: 'prefix' },
  hasarPoison: { label: 'Zehir hasarı', kind: 'prefix' },
  magicPhysical: { label: 'Büyü hasarı (Fiziksel)', kind: 'prefix' },
  magicFire: { label: 'Büyü hasarı (Ateş)', kind: 'prefix' },
  magicIce: { label: 'Büyü hasarı (Buz)', kind: 'prefix' },
  magicElectric: { label: 'Büyü hasarı (Elektrik)', kind: 'prefix' },
  magicAcid: { label: 'Büyü hasarı (Asit)', kind: 'prefix' },
  magicPoison: { label: 'Büyü hasarı (Zehir)', kind: 'prefix' },
  maxDamage: { label: 'Maksimum hasar', kind: 'prefix' },
  attack: { label: 'Saldırı', kind: 'suffix' },
  defense: { label: 'Savunma', kind: 'suffix' },
  armor: { label: 'Zırh', kind: 'suffix' },
  resistFire: { label: 'Ateş direnci', kind: 'suffix' },
  resistIce: { label: 'Buz direnci', kind: 'suffix' },
  resistElectric: { label: 'Elektrik direnci', kind: 'suffix' },
  resistAcid: { label: 'Asit direnci', kind: 'suffix' },
  resistPoison: { label: 'Zehir direnci', kind: 'suffix' },
  maxKudret: { label: 'Maksimum kudret', kind: 'suffix' },
  maxEnergy: { label: 'Maksimum enerji', kind: 'suffix' },
  healing: { label: 'İyileştirme', kind: 'suffix' },
  critChance: { label: 'Kritik vuruş ihtimali', kind: 'suffix' },
  magicCrit: { label: 'Büyü kritik şansı', kind: 'suffix' },
  moveSpeed: { label: 'Hareket hızı', kind: 'suffix' },
  critArmor: { label: 'Kritik zırhı', kind: 'suffix' },
}

export const affixSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'İsim gerekli'),
  stat: z.enum(AFFIX_STAT_KEYS),
  value: z.number().default(0),
  level: z.number().min(1).default(1),
})
export type Affix = z.infer<typeof affixSchema>

/** Bir efsunun ön ek mi son ek mi olduğu, statından türetilir. */
export const affixKind = (affix: Affix): AffixKind =>
  AFFIX_STAT_DEFS[affix.stat]?.kind ?? 'suffix'

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

// Tek bir ödül girişi: ya item (opsiyonel ön/son ek + adet) ya materyal (adet).
export const questRewardSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('item'),
    itemId: z.string(),
    prefixId: z.string().nullable().default(null), // ön ek (item ile aynı seviye)
    suffixId: z.string().nullable().default(null), // son ek (item ile aynı seviye)
    quantity: z.number().min(1).default(1),
  }),
  z.object({
    kind: z.literal('material'),
    materialId: z.string(),
    quantity: z.number().min(1).default(1),
  }),
])
export type QuestReward = z.infer<typeof questRewardSchema>

export const questSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Başlık gerekli'),
  description: z.string().default(''),
  giverNpcId: z.string().default(''),
  requiredLevel: z.number().min(1).default(1),
  dependsOnQuestId: z.string().nullable().default(null),
  rewardExp: z.number().min(0).default(0),
  // Ödül olarak birden fazla item ve/veya materyal birlikte verilebilir.
  rewards: z.array(questRewardSchema).default([]),
  objective: objectiveSchema,
})
export type Quest = z.infer<typeof questSchema>

// Eski tek-ödül alanlarını (rewardItemId/rewardMaterialId vb.) yeni `rewards`
// dizisine taşıyan geriye dönük uyumluluk katmanı (persist & JSON import için).
const questSchemaCompat = z.preprocess((raw) => {
  if (raw && typeof raw === 'object' && !Array.isArray(raw) && !('rewards' in raw)) {
    const r = raw as Record<string, unknown>
    const rewards: unknown[] = []
    if (r.rewardItemId) {
      rewards.push({
        kind: 'item',
        itemId: r.rewardItemId,
        prefixId: r.rewardPrefixId ?? null,
        suffixId: r.rewardSuffixId ?? null,
        quantity: r.rewardQuantity ?? 1,
      })
    }
    if (r.rewardMaterialId) {
      rewards.push({
        kind: 'material',
        materialId: r.rewardMaterialId,
        quantity: r.rewardQuantity ?? 1,
      })
    }
    return { ...r, rewards }
  }
  return raw
}, questSchema)

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
  // Eski (çoklu-stat) efsun verisi yeni şemaya uymazsa tümünü düşür (diğer veriyi koru).
  affixes: z.array(affixSchema).catch([]),
  quests: z.array(questSchemaCompat).default([]),
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
