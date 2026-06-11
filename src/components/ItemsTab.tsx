import { useState } from 'react'
import { useStore } from '../store'
import { newId } from '../lib/id'
import { confirmDialog, notify } from '../lib/ui-store'
import {
  ITEM_SLOTS,
  ITEM_SLOT_LABELS,
  type Item,
  type ItemMaterial,
  type ItemSlot,
} from '../types/model'
import {
  Button,
  Combobox,
  EmptyState,
  Field,
  Modal,
  NumberInput,
  SearchInput,
  SegmentedControl,
  TextInput,
} from './ui'

const ITEM_SLOT_ICONS: Record<ItemSlot, string> = {
  gloves: '🧤',
  pants: '👖',
  jacket: '🧥',
  shoes: '👟',
  armor: '🛡️',
  ring: '💍',
  necklace: '📿',
}

export function ItemsTab() {
  const items = useStore((s) => s.items)
  const deleteItem = useStore((s) => s.deleteItem)
  const [editing, setEditing] = useState<Item | 'new' | null>(null)
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const filtered = q ? items.filter((it) => it.name.toLowerCase().includes(q)) : items
  // Slot sırasına göre gruplandır (boş gruplar gizlenir).
  const groups = ITEM_SLOTS.map((slot) => ({
    slot,
    rows: filtered.filter((it) => it.slot === slot),
  })).filter((g) => g.rows.length > 0)

  return (
    <div className="flex flex-col gap-3">
      <Button variant="primary" onClick={() => setEditing('new')}>
        + Yeni Item
      </Button>

      {items.length > 0 && (
        <SearchInput value={query} onChange={setQuery} placeholder="Item ara..." />
      )}

      {items.length === 0 ? (
        <EmptyState text="Henüz item yok. Yeni bir item ekle ya da Materyal'den temel materyal üret." />
      ) : filtered.length === 0 ? (
        <EmptyState text="Aramayla eşleşen item yok." />
      ) : (
        groups.map((group) => (
          <div key={group.slot} className="flex flex-col gap-2">
            <div className="flex items-center gap-2 px-1 pt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span>{ITEM_SLOT_ICONS[group.slot]}</span>
              <span>{ITEM_SLOT_LABELS[group.slot]}</span>
              <span className="opacity-60">{group.rows.length}</span>
            </div>
            {group.rows.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3"
              >
                <span className="text-xl">{ITEM_SLOT_ICONS[item.slot]}</span>
                <button className="min-w-0 flex-1 text-left" onClick={() => setEditing(item)}>
                  <div className="flex items-center gap-2 font-medium text-slate-100">
                    <span className="truncate">{item.name}</span>
                    {item.baseMaterialId && (
                      <span className="shrink-0 rounded bg-slate-700 px-1.5 py-0.5 text-xs font-medium text-slate-300">
                        oto
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">
                    Lv {item.level} · 🛡 {item.armor} · 🪙 {item.price} · {item.materials.length}{' '}
                    materyal
                  </div>
                </button>
                {item.baseMaterialId ? (
                  <span className="shrink-0 px-2 text-xs text-slate-600">materyalden</span>
                ) : (
                  <Button
                    variant="danger"
                    onClick={async () => {
                      if (await confirmDialog(`"${item.name}" silinsin mi?`)) deleteItem(item.id)
                    }}
                  >
                    Sil
                  </Button>
                )}
              </div>
            ))}
          </div>
        ))
      )}

      {editing && (
        <ItemForm initial={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />
      )}
    </div>
  )
}

function ItemForm({ initial, onClose }: { initial: Item | null; onClose: () => void }) {
  const addItem = useStore((s) => s.addItem)
  const updateItem = useStore((s) => s.updateItem)
  const allMaterials = useStore((s) => s.materials)

  const [name, setName] = useState(initial?.name ?? '')
  const [slot, setSlot] = useState<ItemSlot>(initial?.slot ?? 'gloves')
  const [level, setLevel] = useState(initial?.level ?? 1)
  const [armor, setArmor] = useState(initial?.armor ?? 0)
  const [price, setPrice] = useState(initial?.price ?? 0)
  const [materials, setMaterials] = useState<ItemMaterial[]>(initial?.materials ?? [])

  const isGenerated = !!initial?.baseMaterialId
  const baseMaterial = allMaterials.find((m) => m.id === initial?.baseMaterialId) ?? null

  const updateMaterialRow = (i: number, patch: Partial<ItemMaterial>) =>
    setMaterials((prev) => prev.map((m, idx) => (idx === i ? { ...m, ...patch } : m)))
  const removeMaterialRow = (i: number) =>
    setMaterials((prev) => prev.filter((_, idx) => idx !== i))

  const save = () => {
    if (!name.trim()) {
      notify('İsim gerekli.', 'error')
      return
    }
    const item: Item = {
      id: initial?.id ?? newId('item'),
      name: name.trim(),
      slot,
      level,
      armor,
      materials: materials.filter((m) => m.materialId), // boş seçimleri at
      baseMaterialId: initial?.baseMaterialId ?? null, // üretilmişse kaynağı koru
      price,
    }
    if (initial) updateItem(item)
    else addItem(item)
    notify('Item kaydedildi.')
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
        {isGenerated ? (
          <>
            <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs text-sky-200">
              ⚙ <b>{baseMaterial?.name ?? 'Bir temel materyal'}</b> temel materyalinden üretildi.
              İsim, slot ve seviye materyalden gelir; burada zırh ve ek materyalleri
              düzenleyebilirsin.
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-slate-500">İsim</div>
                <div className="text-slate-200">{name}</div>
              </div>
              <div>
                <div className="text-slate-500">Slot</div>
                <div className="text-slate-200">{ITEM_SLOT_LABELS[slot]}</div>
              </div>
              <div>
                <div className="text-slate-500">Seviye</div>
                <div className="text-slate-200">{level}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Zırh">
                <NumberInput value={armor} onChange={(e) => setArmor(Number(e.target.value))} />
              </Field>
              <Field label="Fiyat (altın)">
                <NumberInput
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                />
              </Field>
            </div>
          </>
        ) : (
          <>
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
                <NumberInput
                  min={1}
                  value={level}
                  onChange={(e) => setLevel(Number(e.target.value))}
                />
              </Field>
              <Field label="Zırh">
                <NumberInput value={armor} onChange={(e) => setArmor(Number(e.target.value))} />
              </Field>
              <Field label="Fiyat (altın)">
                <NumberInput
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                />
              </Field>
            </div>
          </>
        )}

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-300">Materyaller</span>
          {materials.map((m, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-lg border border-slate-800 p-2">
              <Combobox
                value={m.materialId || null}
                onChange={(v) => updateMaterialRow(i, { materialId: v ?? '' })}
                options={allMaterials.map((mat) => ({ value: mat.id, label: mat.name }))}
                placeholder="— materyal seç —"
                noneLabel="— materyal seç —"
                searchPlaceholder="Materyal ara..."
                emptyText="Materyal bulunamadı"
              />
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">Adet</span>
                <div className="w-24">
                  <NumberInput
                    min={1}
                    value={m.quantity}
                    onChange={(e) => updateMaterialRow(i, { quantity: Number(e.target.value) })}
                  />
                </div>
                <Button
                  variant="danger"
                  className="ml-auto"
                  onClick={() => removeMaterialRow(i)}
                >
                  Sil
                </Button>
              </div>
            </div>
          ))}
          <Button onClick={() => setMaterials((prev) => [...prev, { materialId: '', quantity: 1 }])}>
            + Materyal ekle
          </Button>
          {allMaterials.length === 0 && (
            <p className="text-xs text-slate-500">
              Önce 'Materyal' sekmesinden materyal eklemelisin.
            </p>
          )}
        </div>

        {initial && <p className="text-xs text-slate-500">id: {initial.id}</p>}
      </div>
    </Modal>
  )
}
