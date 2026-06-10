import { useState } from 'react'
import { useStore } from '../store'
import { newId } from '../lib/id'
import { ITEM_SLOTS, ITEM_SLOT_LABELS, type Item, type ItemSlot } from '../types/model'
import {
  Button,
  EmptyState,
  Field,
  Modal,
  NumberInput,
  SegmentedControl,
  TextInput,
} from './ui'

export function ItemsTab() {
  const items = useStore((s) => s.items)
  const deleteItem = useStore((s) => s.deleteItem)
  const [editing, setEditing] = useState<Item | 'new' | null>(null)

  return (
    <div className="flex flex-col gap-3">
      <Button variant="primary" onClick={() => setEditing('new')}>
        + Yeni Item
      </Button>

      {items.length === 0 ? (
        <EmptyState text="Henüz item yok. Yeni bir zırh parçası ekle." />
      ) : (
        items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-4 py-3"
          >
            <button className="flex-1 text-left" onClick={() => setEditing(item)}>
              <div className="font-medium text-slate-100">{item.name}</div>
              <div className="text-xs text-slate-500">
                {ITEM_SLOT_LABELS[item.slot]} · Lv {item.level} · 🛡 {item.armor} · {item.id}
              </div>
            </button>
            <Button
              variant="danger"
              onClick={() => {
                if (confirm(`"${item.name}" silinsin mi?`)) deleteItem(item.id)
              }}
            >
              Sil
            </Button>
          </div>
        ))
      )}

      {editing && (
        <ItemForm
          initial={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function ItemForm({ initial, onClose }: { initial: Item | null; onClose: () => void }) {
  const addItem = useStore((s) => s.addItem)
  const updateItem = useStore((s) => s.updateItem)

  const [name, setName] = useState(initial?.name ?? '')
  const [slot, setSlot] = useState<ItemSlot>(initial?.slot ?? 'gloves')
  const [level, setLevel] = useState(initial?.level ?? 1)
  const [armor, setArmor] = useState(initial?.armor ?? 0)

  const save = () => {
    if (!name.trim()) {
      alert('İsim gerekli.')
      return
    }
    const item: Item = {
      id: initial?.id ?? newId('item'),
      name: name.trim(),
      slot,
      level,
      armor,
    }
    if (initial) updateItem(item)
    else addItem(item)
    onClose()
  }

  return (
    <Modal
      title={initial ? 'Item Düzenle' : 'Yeni Item'}
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
            placeholder="Örn: Demir Eldiven"
          />
        </Field>

        <Field label="Nereye giyilecek">
          <SegmentedControl
            value={slot}
            onChange={setSlot}
            options={ITEM_SLOTS.map((s) => ({ value: s, label: ITEM_SLOT_LABELS[s] }))}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Seviye">
            <NumberInput min={1} value={level} onChange={(e) => setLevel(Number(e.target.value))} />
          </Field>
          <Field label="Zırh">
            <NumberInput value={armor} onChange={(e) => setArmor(Number(e.target.value))} />
          </Field>
        </div>

        {initial && <p className="text-xs text-slate-500">id: {initial.id}</p>}
      </div>
    </Modal>
  )
}
