import { useState } from 'react'
import { useStore } from '../store'
import { newId } from '../lib/id'
import { type Material } from '../types/model'
import { Button, EmptyState, Field, Modal, NumberInput, TextArea, TextInput, Toggle } from './ui'

export function MaterialsTab() {
  const materials = useStore((s) => s.materials)
  const items = useStore((s) => s.items)
  const deleteMaterial = useStore((s) => s.deleteMaterial)
  const [editing, setEditing] = useState<Material | 'new' | null>(null)

  return (
    <div className="flex flex-col gap-3">
      <Button variant="primary" onClick={() => setEditing('new')}>
        + Yeni Materyal
      </Button>

      {materials.length === 0 ? (
        <EmptyState text="Henüz materyal yok. Item yapımında kullanmak için materyal ekle." />
      ) : (
        materials.map((material) => {
          const usedBy = items.filter((it) =>
            it.materials.some((m) => m.materialId === material.id),
          ).length
          return (
            <div
              key={material.id}
              className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-4 py-3"
            >
              <button className="flex-1 text-left" onClick={() => setEditing(material)}>
                <div className="flex items-center gap-2 font-medium text-slate-100">
                  {material.name}
                  {material.isBaseMaterial && (
                    <span className="rounded bg-sky-500/15 px-1.5 py-0.5 text-xs font-medium text-sky-300">
                      temel
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500">
                  Lv {material.level} · {usedBy} item'da kullanılıyor · {material.id}
                </div>
              </button>
              <Button
                variant="danger"
                onClick={() => {
                  if (confirm(`"${material.name}" silinsin mi?`)) deleteMaterial(material.id)
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
  const [description, setDescription] = useState(initial?.description ?? '')
  const [level, setLevel] = useState(initial?.level ?? 1)
  const [isBaseMaterial, setIsBaseMaterial] = useState(initial?.isBaseMaterial ?? false)

  const save = () => {
    if (!name.trim()) {
      alert('İsim gerekli.')
      return
    }
    const material: Material = {
      id: initial?.id ?? newId('mat'),
      name: name.trim(),
      description: description.trim(),
      level,
      isBaseMaterial,
    }
    if (initial) updateMaterial(material)
    else addMaterial(material)
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
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Örn: Keten"
          />
        </Field>

        <Field label="Seviye">
          <NumberInput min={1} value={level} onChange={(e) => setLevel(Number(e.target.value))} />
        </Field>

        <Toggle
          checked={isBaseMaterial}
          onChange={setIsBaseMaterial}
          label="Temel üretim materyali"
          hint="Açıksa bu materyalin seviyesinde Eldiven/Pantolon/Ceket/Ayakkabı otomatik üretilir."
        />
        {isBaseMaterial && (
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
