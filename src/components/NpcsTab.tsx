import { useState } from 'react'
import { useStore } from '../store'
import { newId } from '../lib/id'
import { confirmDialog, notify } from '../lib/ui-store'
import { type Npc } from '../types/model'
import {
  Button,
  EmptyState,
  Field,
  Modal,
  NumberInput,
  SearchInput,
  TextArea,
  TextInput,
} from './ui'

export function NpcsTab() {
  const npcs = useStore((s) => s.npcs)
  const quests = useStore((s) => s.quests)
  const deleteNpc = useStore((s) => s.deleteNpc)
  const [editing, setEditing] = useState<Npc | 'new' | null>(null)
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const filtered = q ? npcs.filter((n) => n.name.toLowerCase().includes(q)) : npcs

  return (
    <div className="flex flex-col gap-3">
      <Button variant="primary" onClick={() => setEditing('new')}>
        + Yeni NPC
      </Button>

      {npcs.length > 0 && (
        <SearchInput value={query} onChange={setQuery} placeholder="NPC ara..." />
      )}

      {npcs.length === 0 ? (
        <EmptyState text="Henüz NPC yok. Başlamak için yeni bir NPC ekle." />
      ) : filtered.length === 0 ? (
        <EmptyState text="Aramayla eşleşen NPC yok." />
      ) : (
        filtered.map((npc) => {
          const givenQuests = quests.filter((quest) => quest.giverNpcId === npc.id)
          return (
            <div
              key={npc.id}
              className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3"
            >
              <span className="text-xl">🧑</span>
              <button className="min-w-0 flex-1 text-left" onClick={() => setEditing(npc)}>
                <div className="truncate font-medium text-slate-100">{npc.name}</div>
                <div className="text-xs text-slate-500">
                  Lv {npc.level} · {npc.dialogues.length} replik · {givenQuests.length} görev verir
                </div>
              </button>
              <Button
                variant="danger"
                onClick={async () => {
                  if (await confirmDialog(`"${npc.name}" silinsin mi?`)) deleteNpc(npc.id)
                }}
              >
                Sil
              </Button>
            </div>
          )
        })
      )}

      {editing && (
        <NpcForm initial={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />
      )}
    </div>
  )
}

function NpcForm({ initial, onClose }: { initial: Npc | null; onClose: () => void }) {
  const addNpc = useStore((s) => s.addNpc)
  const updateNpc = useStore((s) => s.updateNpc)

  const [name, setName] = useState(initial?.name ?? '')
  const [level, setLevel] = useState(initial?.level ?? 1)
  const [dialogues, setDialogues] = useState<string[]>(initial?.dialogues ?? [''])

  const save = () => {
    if (!name.trim()) {
      notify('İsim gerekli.', 'error')
      return
    }
    const npc: Npc = {
      id: initial?.id ?? newId('npc'),
      name: name.trim(),
      level,
      dialogues: dialogues.map((d) => d.trim()).filter(Boolean),
    }
    if (initial) updateNpc(npc)
    else addNpc(npc)
    notify('NPC kaydedildi.')
    onClose()
  }

  return (
    <Modal
      title={initial ? 'NPC Düzenle' : 'Yeni NPC'}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Vazgeç</Button>
          <Button variant="primary" onClick={save}>
            Kaydet
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="İsim">
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Örn: Demirci Hasan"
          />
        </Field>

        <Field label="Seviye">
          <NumberInput min={1} value={level} onChange={(e) => setLevel(Number(e.target.value))} />
        </Field>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-300">Sohbet replikleri</span>
          {dialogues.map((line, i) => (
            <div key={i} className="flex gap-2">
              <TextArea
                value={line}
                onChange={(e) =>
                  setDialogues((prev) => prev.map((l, idx) => (idx === i ? e.target.value : l)))
                }
                placeholder={`Replik ${i + 1}`}
              />
              <Button
                variant="danger"
                className="self-start"
                onClick={() => setDialogues((prev) => prev.filter((_, idx) => idx !== i))}
              >
                ✕
              </Button>
            </div>
          ))}
          <Button onClick={() => setDialogues((prev) => [...prev, ''])}>+ Replik ekle</Button>
        </div>

        {initial && <p className="text-xs text-slate-500">id: {initial.id}</p>}
      </div>
    </Modal>
  )
}
