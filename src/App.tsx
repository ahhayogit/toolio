import { useMemo, useRef, useState } from 'react'
import { useStore } from './store'
import { downloadJson, parseJsonFile } from './lib/io'
import { findIssues } from './lib/validate'
import { objectiveSummary } from './lib/summary'
import { notify, confirmDialog } from './lib/ui-store'
import { Button, ConfirmDialog, Toasts } from './components/ui'
import { NpcsTab } from './components/NpcsTab'
import { EnemiesTab } from './components/EnemiesTab'
import { AreasTab } from './components/AreasTab'
import { MaterialsTab } from './components/MaterialsTab'
import { ItemsTab } from './components/ItemsTab'
import { AffixesTab } from './components/AffixesTab'
import { QuestsTab } from './components/QuestsTab'

type Tab = 'npcs' | 'enemies' | 'areas' | 'materials' | 'items' | 'affixes' | 'quests'

export default function App() {
  const [tab, setTab] = useState<Tab>('npcs')
  const fileRef = useRef<HTMLInputElement>(null)

  const npcs = useStore((s) => s.npcs)
  const enemies = useStore((s) => s.enemies)
  const areas = useStore((s) => s.areas)
  const materials = useStore((s) => s.materials)
  const items = useStore((s) => s.items)
  const affixes = useStore((s) => s.affixes)
  const quests = useStore((s) => s.quests)
  const exportData = useStore((s) => s.exportData)
  const loadData = useStore((s) => s.loadData)
  const resetAll = useStore((s) => s.resetAll)

  const issues = useMemo(
    () => findIssues({ version: 1, npcs, enemies, areas, materials, items, affixes, quests }),
    [npcs, enemies, areas, materials, items, affixes, quests],
  )

  const handleExport = () => {
    const data = exportData()
    // Her göreve okunabilir otomatik özeti de ekleyerek dışa aktar.
    const withSummary = {
      ...data,
      quests: data.quests.map((q) => ({
        ...q,
        summary: objectiveSummary(q.objective, data),
      })),
    }
    downloadJson(withSummary)
    notify('JSON indirildi.')
  }

  const handleImport = async (file: File) => {
    try {
      const data = await parseJsonFile(file)
      loadData(data)
      notify('JSON yüklendi.')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Dosya okunamadı.', 'error')
    }
  }

  const tabs: { key: Tab; label: string; icon: string; count: number }[] = [
    { key: 'npcs', label: 'NPC', icon: '🧑', count: npcs.length },
    { key: 'enemies', label: 'Düşman', icon: '👹', count: enemies.length },
    { key: 'areas', label: 'Bölge', icon: '🗺️', count: areas.length },
    { key: 'materials', label: 'Materyal', icon: '🧵', count: materials.length },
    { key: 'items', label: 'Item', icon: '🛡️', count: items.length },
    { key: 'affixes', label: 'Ek', icon: '✨', count: affixes.length },
    { key: 'quests', label: 'Görev', icon: '📜', count: quests.length },
  ]

  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col">
      {/* Üst bar */}
      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-2 border-b border-slate-800 bg-slate-950/90 px-4 py-3 backdrop-blur">
        <h1 className="mr-auto text-lg font-bold tracking-tight">
          Toolio <span className="text-sky-400">RPG</span>
        </h1>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleImport(file)
            e.target.value = ''
          }}
        />
        <Button onClick={() => fileRef.current?.click()}>📂 Aç</Button>
        <Button variant="primary" onClick={handleExport}>
          💾 Kaydet
        </Button>
        <Button
          variant="danger"
          onClick={async () => {
            if (await confirmDialog('Tüm veriler silinsin mi? Bu geri alınamaz.', 'Temizle')) {
              resetAll()
              notify('Tüm veriler temizlendi.', 'info')
            }
          }}
        >
          🗑 Temizle
        </Button>
      </header>

      {/* Sekmeler */}
      <nav className="sticky top-[57px] z-10 flex overflow-x-auto border-b border-slate-800 bg-slate-950/90 px-1 backdrop-blur">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex min-w-[3.75rem] flex-1 flex-col items-center gap-0.5 border-b-2 px-1 py-2 transition-colors ${
              tab === t.key
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="text-lg leading-none">{t.icon}</span>
            <span className="whitespace-nowrap text-[11px] font-medium">
              {t.label}
              {t.count > 0 && <span className="opacity-60"> {t.count}</span>}
            </span>
          </button>
        ))}
      </nav>

      {/* Kırık referans uyarıları */}
      {issues.length > 0 && (
        <div className="mx-4 mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          <strong>⚠ {issues.length} uyarı:</strong>
          <ul className="mt-1 list-inside list-disc">
            {issues.slice(0, 5).map((iss, i) => (
              <li key={i}>{iss.message}</li>
            ))}
            {issues.length > 5 && <li>… ve {issues.length - 5} tane daha</li>}
          </ul>
        </div>
      )}

      {/* İçerik */}
      <main className="flex-1 px-4 py-4">
        {tab === 'npcs' && <NpcsTab />}
        {tab === 'enemies' && <EnemiesTab />}
        {tab === 'areas' && <AreasTab />}
        {tab === 'materials' && <MaterialsTab />}
        {tab === 'items' && <ItemsTab />}
        {tab === 'affixes' && <AffixesTab />}
        {tab === 'quests' && <QuestsTab />}
      </main>

      <footer className="px-4 py-4 text-center text-xs text-slate-600">
        Veriler tarayıcında otomatik saklanır · JSON ile yedekle/aktar
      </footer>

      <Toasts />
      <ConfirmDialog />
    </div>
  )
}
