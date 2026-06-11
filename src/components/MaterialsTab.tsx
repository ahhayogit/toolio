import { useState } from 'react'
import { useStore } from '../store'
import { newId } from '../lib/id'
import { confirmDialog, notify } from '../lib/ui-store'
import {
  MATERIAL_TYPES,
  MATERIAL_TYPE_LABELS,
  defaultMaterialPrice,
  type Material,
  type MaterialType,
} from '../types/model'
import {
  Button,
  EmptyState,
  Field,
  Modal,
  NumberInput,
  SearchInput,
  SegmentedControl,
  TextArea,
  TextInput,
  Toggle,
} from './ui'

const MATERIAL_TYPE_ICONS: Record<MaterialType, string> = {
  maden: '⛏️',
  bitki: '🌿',
  cevher: '💎',
  kumas: '🧵',
  esya: '📦',
}

export function MaterialsTab() {
  const materials = useStore((s) => s.materials)
  const items = useStore((s) => s.items)
  const deleteMaterial = useStore((s) => s.deleteMaterial)
  const [editing, setEditing] = useState<Material | 'new' | null>(null)
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const filtered = q ? materials.filter((m) => m.name.toLowerCase().includes(q)) : materials

  return (
    <div className="flex flex-col gap-3">
      <Button variant="primary" onClick={() => setEditing('new')}>
        + Yeni Materyal
      </Button>

      {materials.length > 0 && (
        <SearchInput value={query} onChange={setQuery} placeholder="Materyal ara..." />
      )}

      {materials.length === 0 ? (
        <EmptyState text="Henüz materyal yok. Item yapımında kullanmak için materyal ekle." />
      ) : filtered.length === 0 ? (
        <EmptyState text="Aramayla eşleşen materyal yok." />
      ) : (
        filtered.map((material) => {
          const usedBy = items.filter((it) =>
            it.materials.some((m) => m.materialId === material.id),
          ).length
          return (
            <div
              key={material.id}
              className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3"
            >
              <span className="text-xl">{MATERIAL_TYPE_ICONS[material.type]}</span>
              <button className="min-w-0 flex-1 text-left" onClick={() => setEditing(material)}>
                <div className="flex items-center gap-2 font-medium text-slate-100">
                  <span className="truncate">{material.name}</span>
                  {material.isBaseMaterial && (
                    <span className="shrink-0 rounded bg-sky-500/15 px-1.5 py-0.5 text-xs font-medium text-sky-300">
                      temel
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500">
                  {MATERIAL_TYPE_LABELS[material.type]} · Lv {material.level} · 🪙 {material.price}{' '}
                  · {usedBy} item'da
                </div>
              </button>
              <Button
                variant="danger"
                onClick={async () => {
                  if (await confirmDialog(`"${material.name}" silinsin mi?`))
                    deleteMaterial(material.id)
                }}
              >
                Sil
              </Button>
            </div>
          )
        })
      )}

      {editing && (
        <MaterialForm
          initial={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function MaterialForm({ initial, onClose }: { initial: Material | null; onClose: () => void }) {
  const addMaterial = useStore((s) => s.addMaterial)
  const updateMaterial = useStore((s) => s.updateMaterial)

  const [name, setName] = useState(initial?.name ?? '')
  const [type, setType] = useState<MaterialType>(initial?.type ?? 'maden')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [level, setLevel] = useState(initial?.level ?? 1)
  const [isBaseMaterial, setIsBaseMaterial] = useState(initial?.isBaseMaterial ?? false)
  const [price, setPrice] = useState(initial?.price ?? defaultMaterialPrice('maden'))

  // Kumaş her zaman temel üretim materyalidir; toggle yerine kural geçerli.
  const effectiveBase = type === 'kumas' ? true : isBaseMaterial

  // Fiyat elle değiştirilmediyse tür değişince yeni türün varsayılanına geç.
  const changeType = (t: MaterialType) => {
    setPrice((p) => (p === defaultMaterialPrice(type) ? defaultMaterialPrice(t) : p))
    setType(t)
  }

  const save = () => {
    if (!name.trim()) {
      notify('İsim gerekli.', 'error')
      return
    }
    const material: Material = {
      id: initial?.id ?? newId('mat'),
      name: name.trim(),
      type,
      description: description.trim(),
      level,
      isBaseMaterial: effectiveBase,
      price,
    }
    if (initial) updateMaterial(material)
    else addMaterial(material)
    notify(effectiveBase ? 'Materyal kaydedildi (kıyafetler güncellendi).' : 'Materyal kaydedildi.')
    onClose()
  }

  return (
    <Modal
      title={initial ? 'Materyal Düzenle' : 'Yeni Materyal'}
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
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn: Keten" />
        </Field>

        <Field label="Tür">
          <SegmentedControl
            value={type}
            onChange={changeType}
            options={MATERIAL_TYPES.map((t) => ({ value: t, label: MATERIAL_TYPE_LABELS[t] }))}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Seviye">
            <NumberInput min={1} value={level} onChange={(e) => setLevel(Number(e.target.value))} />
          </Field>
          <Field label="Fiyat (altın)">
            <NumberInput min={0} value={price} onChange={(e) => setPrice(Number(e.target.value))} />
          </Field>
        </div>

        {type === 'kumas' ? (
          <p className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-slate-300">
            Kumaşlar her zaman <b>temel üretim materyali</b>dir.
          </p>
        ) : (
          <Toggle
            checked={isBaseMaterial}
            onChange={setIsBaseMaterial}
            label="Temel üretim materyali"
            hint="Açıksa bu materyalin seviyesinde Eldiven/Pantolon/Ceket/Ayakkabı otomatik üretilir."
          />
        )}
        {effectiveBase && (
          <p className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs text-sky-200">
            Kaydedince <b>{name.trim() || 'bu materyal'}</b> için Lv {level} 4 kıyafet item'ı
            (Eldiven, Pantolon, Ceket, Ayakkabı) otomatik oluşturulur/güncellenir. Item
            sekmesinden zırh değerlerini düzenleyebilirsin.
          </p>
        )}

        <Field label="Açıklama" hint="İsteğe bağlı.">
          <TextArea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Örn: Bitkisel lif, ucuz kıyafetlerde kullanılır..."
          />
        </Field>
        {initial && <p className="text-xs text-slate-500">id: {initial.id}</p>}
      </div>
    </Modal>
  )
}
