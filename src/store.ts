import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { newId } from './lib/id'
import {
  ITEM_SLOT_LABELS,
  type Affix,
  type Area,
  type Enemy,
  type GameData,
  type Item,
  type ItemSlot,
  type Material,
  type Npc,
  type Quest,
  emptyGameData,
  gameDataSchema,
} from './types/model'

// Temel üretim materyalinin ürettiği kıyafet slotları (zırh hariç).
const CLOTHING_SLOTS: ItemSlot[] = ['gloves', 'pants', 'jacket', 'shoes']

/**
 * Bir materyale ait otomatik üretilen item'ları güncel tutar.
 * - Materyal "temel üretim materyali" ise her kıyafet slotu için bir item olur.
 * - İsim/slot/level materyalden türetilir; mevcut zırh ve ek materyaller korunur.
 * - Materyal temel değilse, o materyale ait üretilen item'lar kaldırılır.
 */
function syncGeneratedItems(items: Item[], material: Material): Item[] {
  const others = items.filter((i) => i.baseMaterialId !== material.id)
  if (!material.isBaseMaterial) return others

  const existing = items.filter((i) => i.baseMaterialId === material.id)
  const generated = CLOTHING_SLOTS.map((slot) => {
    const prev = existing.find((i) => i.slot === slot)
    return {
      id: prev?.id ?? newId('item'),
      name: `${material.name} ${ITEM_SLOT_LABELS[slot]}`,
      slot,
      level: material.level,
      armor: prev?.armor ?? 0,
      materials: prev?.materials ?? [{ materialId: material.id, quantity: 1 }],
      baseMaterialId: material.id,
      price: prev?.price ?? 0,
    }
  })
  return [...others, ...generated]
}

interface Actions {
  // NPC
  addNpc: (npc: Npc) => void
  updateNpc: (npc: Npc) => void
  deleteNpc: (id: string) => void
  // Enemy
  addEnemy: (enemy: Enemy) => void
  updateEnemy: (enemy: Enemy) => void
  deleteEnemy: (id: string) => void
  // Area
  addArea: (area: Area) => void
  updateArea: (area: Area) => void
  deleteArea: (id: string) => void
  // Material
  addMaterial: (material: Material) => void
  updateMaterial: (material: Material) => void
  deleteMaterial: (id: string) => void
  // Item
  addItem: (item: Item) => void
  updateItem: (item: Item) => void
  deleteItem: (id: string) => void
  // Affix (efsun / ön ek / son ek)
  addAffix: (affix: Affix) => void
  setAffixes: (affixes: Affix[]) => void
  updateAffix: (affix: Affix) => void
  deleteAffix: (id: string) => void
  // Quest
  addQuest: (quest: Quest) => void
  updateQuest: (quest: Quest) => void
  deleteQuest: (id: string) => void
  // Veri işlemleri
  loadData: (data: GameData) => void
  exportData: () => GameData
  resetAll: () => void
}

type Store = GameData & Actions

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...emptyGameData(),

      addNpc: (npc) => set((s) => ({ npcs: [...s.npcs, npc] })),
      updateNpc: (npc) =>
        set((s) => ({ npcs: s.npcs.map((n) => (n.id === npc.id ? npc : n)) })),
      deleteNpc: (id) => set((s) => ({ npcs: s.npcs.filter((n) => n.id !== id) })),

      addEnemy: (enemy) => set((s) => ({ enemies: [...s.enemies, enemy] })),
      updateEnemy: (enemy) =>
        set((s) => ({ enemies: s.enemies.map((e) => (e.id === enemy.id ? enemy : e)) })),
      deleteEnemy: (id) => set((s) => ({ enemies: s.enemies.filter((e) => e.id !== id) })),

      addArea: (area) => set((s) => ({ areas: [...s.areas, area] })),
      updateArea: (area) =>
        set((s) => ({ areas: s.areas.map((a) => (a.id === area.id ? area : a)) })),
      deleteArea: (id) => set((s) => ({ areas: s.areas.filter((a) => a.id !== id) })),

      addMaterial: (material) =>
        set((s) => ({
          materials: [...s.materials, material],
          items: syncGeneratedItems(s.items, material),
        })),
      updateMaterial: (material) =>
        set((s) => ({
          materials: s.materials.map((m) => (m.id === material.id ? material : m)),
          items: syncGeneratedItems(s.items, material),
        })),
      deleteMaterial: (id) =>
        set((s) => ({
          materials: s.materials.filter((m) => m.id !== id),
          // Bu materyalden üretilmiş item'ları da kaldır.
          items: s.items.filter((i) => i.baseMaterialId !== id),
        })),

      addItem: (item) => set((s) => ({ items: [...s.items, item] })),
      updateItem: (item) =>
        set((s) => ({ items: s.items.map((i) => (i.id === item.id ? item : i)) })),
      deleteItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

      addAffix: (affix) => set((s) => ({ affixes: [...s.affixes, affix] })),
      setAffixes: (list) => set({ affixes: list }),
      updateAffix: (affix) =>
        set((s) => ({ affixes: s.affixes.map((a) => (a.id === affix.id ? affix : a)) })),
      deleteAffix: (id) => set((s) => ({ affixes: s.affixes.filter((a) => a.id !== id) })),

      addQuest: (quest) => set((s) => ({ quests: [...s.quests, quest] })),
      updateQuest: (quest) =>
        set((s) => ({ quests: s.quests.map((q) => (q.id === quest.id ? quest : q)) })),
      deleteQuest: (id) =>
        set((s) => ({
          // Silinen göreve bağımlı olanların bağını da temizle.
          quests: s.quests
            .filter((q) => q.id !== id)
            .map((q) => (q.dependsOnQuestId === id ? { ...q, dependsOnQuestId: null } : q)),
        })),

      loadData: (data) =>
        set({
          version: data.version,
          npcs: data.npcs,
          enemies: data.enemies,
          areas: data.areas,
          materials: data.materials,
          items: data.items,
          affixes: data.affixes,
          quests: data.quests,
        }),
      exportData: () => {
        const { version, npcs, enemies, areas, materials, items, affixes, quests } = get()
        return { version, npcs, enemies, areas, materials, items, affixes, quests }
      },
      resetAll: () => set(emptyGameData()),
    }),
    {
      name: 'toolio-data',
      // Sadece verileri kalıcı yap, fonksiyonları değil.
      partialize: (s) => ({
        version: s.version,
        npcs: s.npcs,
        enemies: s.enemies,
        areas: s.areas,
        materials: s.materials,
        items: s.items,
        affixes: s.affixes,
        quests: s.quests,
      }),
      // Eski/eksik kayıtlı veriyi şemadan geçirip varsayılanları doldur
      // (ör. eski item'larda olmayan `materials` -> []). Aksi halde beyaz ekran.
      merge: (persisted, current) => {
        const parsed = gameDataSchema.safeParse(persisted)
        return parsed.success ? { ...current, ...parsed.data } : current
      },
    },
  ),
)
