import { useState } from 'react'
import { useStore } from '../store'
import { newId } from '../lib/id'
import { type Area } from '../types/model'
import { Button, EmptyState, Field, Modal, TextArea, TextInput } from './ui'

export function AreasTab() {
  const areas = useStore((s) => s.areas)
  const quests = useStore((s) => s.quests)
  const deleteArea = useStore((s) => s.deleteArea)
  const [editing, setEditing] = useState<Area | 'new' | null>(null)

  return (
    <div className="flex flex-col gap-3">
      <Button variant="primary" onClick={() => setEditing('new')}>
        + Yeni Bölge
      </Button>

      {areas.length === 0 ? (
        <EmptyState text="Henüz bölge yok. Keşif görevlerinde kullanmak için bölge ekle." />
      ) : (
        areas.map((area) => {
          const usedBy = quests.filter(
            (q) => q.objective.type === 'EXPLORE_AREA' && q.objective.targetAreaId === area.id,
          ).length
          return (
            <div
              key={area.id}
              className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-4 py-3"
            >
              <button className="flex-1 text-left" onClick={() => setEditing(area)}>
                <div className="font-medium text-slate-100">{area.name}</div>
                <div className="text-xs text-slate-500">
                  {usedBy} keşif görevinde · {area.id}
                </div>
              </button>
              <Button
                variant="danger"
                onClick={() => {
                  if (confirm(`"${area.name}" silinsin mi?`)) deleteArea(area.id)
                }}
              >
                Sil
              </Button>
            </div>
          )
        })
      )}

      {editing && (
        <AreaForm
          initial={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function AreaForm({ initial, onClose }: { initial: Area | null; onClose: () => void }) {
  const addArea = useStore((s) => s.addArea)
  const updateArea = useStore((s) => s.updateArea)

  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')

  const save = () => {
    if (!name.trim()) {
      alert('İsim gerekli.')
      return
    }
    const area: Area = {
      id: initial?.id ?? newId('area'),
      name: name.trim(),
      description: description.trim(),
    }
    if (initial) updateArea(area)
    else addArea(area)
    onClose()
  }

  return (
    <Modal
      title={initial ? 'Bölge Düzenle' : 'Yeni Bölge'}
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
            placeholder="Örn: Karanlık Orman"
          />
        </Field>
        <Field label="Açıklama" hint="İsteğe bağlı — bölge hakkında not.">
          <TextArea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Örn: Kuzeydeki tehlikeli orman..."
          />
        </Field>
        {initial && <p className="text-xs text-slate-500">id: {initial.id}</p>}
      </div>
    </Modal>
  )
}
