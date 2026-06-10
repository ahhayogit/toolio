import { useState } from 'react'
import { useStore } from '../store'
import { newId } from '../lib/id'
import { type Npc } from '../types/model'
import { Button, EmptyState, Field, Modal, TextArea, TextInput } from './ui'

export function NpcsTab() {
  const npcs = useStore((s) => s.npcs)
  const quests = useStore((s) => s.quests)
  const deleteNpc = useStore((s) => s.deleteNpc)
  const [editing, setEditing] = useState<Npc | 'new' | null>(null)

  return (
    <div className="flex flex-col gap-3">
      <Button variant="primary" onClick={() => setEditing('new')}>
        + Yeni NPC
      </Button>

      {npcs.length === 0 ? (
        <EmptyState text="Henüz NPC yok. Başlamak için yeni bir NPC ekle." />
      ) : (
        npcs.map((npc) => {
          const givenQuests = quests.filter((q) => q.giverNpcId === npc.id)
          return (
            <div
              key={npc.id}
              className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-4 py-3"
            >
              <button className="flex-1 text-left" onClick={() => setEditing(npc)}>
                <div className="font-medium text-slate-100">{npc.name}</div>
                <div className="text-xs text-slate-500">
                  {npc.dialogues.length} replik · {givenQuests.length} görev verir · {npc.id}
                </div>
              </button>
              <Button
                variant="danger"
                onClick={() => {
                  if (confirm(`"${npc.name}" silinsin mi?`)) deleteNpc(npc.id)
                }}
              >
                Sil
              </Button>
            </div>
          )
        })
      )}

      {editing && (
        <NpcForm
          initial={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function NpcForm({ initial, onClose }: { initial: Npc | null; onClose: () => void }) {
  const addNpc = useStore((s) => s.addNpc)
  const updateNpc = useStore((s) => s.updateNpc)

  const [name, setName] = useState(initial?.name ?? '')
  const [dialogues, setDialogues] = useState<string[]>(initial?.dialogues ?? [''])

  const save = () => {
    const cleanedDialogues = dialogues.map((d) => d.trim()).filter(Boolean)
    const npc: Npc = {
      id: initial?.id ?? newId('npc'),
      name: name.trim(),
      dialogues: cleanedDialogues,
    }
    if (!npc.name) {
      alert('İsim gerekli.')
      return
    }
    if (initial) updateNpc(npc)
    else addNpc(npc)
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
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn: Demirci Hasan" />
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
