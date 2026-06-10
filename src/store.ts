import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  type Area,
  type Enemy,
  type GameData,
  type Item,
  type Npc,
  type Quest,
  emptyGameData,
} from './types/model'

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
  // Item
  addItem: (item: Item) => void
  updateItem: (item: Item) => void
  deleteItem: (id: string) => void
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

      addItem: (item) => set((s) => ({ items: [...s.items, item] })),
      updateItem: (item) =>
        set((s) => ({ items: s.items.map((i) => (i.id === item.id ? item : i)) })),
      deleteItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

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
          items: data.items,
          quests: data.quests,
        }),
      exportData: () => {
        const { version, npcs, enemies, areas, items, quests } = get()
        return { version, npcs, enemies, areas, items, quests }
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
        items: s.items,
        quests: s.quests,
      }),
    },
  ),
)
