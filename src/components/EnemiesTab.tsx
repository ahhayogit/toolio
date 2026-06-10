import { useState } from 'react'
import { useStore } from '../store'
import { newId } from '../lib/id'
import {
  RESISTANCE_LABELS,
  RESISTANCE_TYPES,
  type Enemy,
  type Resistances,
  emptyResistances,
} from '../types/model'
import { Button, EmptyState, Field, Modal, NumberInput, TextInput } from './ui'

export function EnemiesTab() {
  const enemies = useStore((s) => s.enemies)
  const deleteEnemy = useStore((s) => s.deleteEnemy)
  const [editing, setEditing] = useState<Enemy | 'new' | null>(null)

  return (
    <div className="flex flex-col gap-3">
      <Button variant="primary" onClick={() => setEditing('new')}>
        + Yeni Düşman
      </Button>

      {enemies.length === 0 ? (
        <EmptyState text="Henüz düşman yok. Yeni bir düşman ekle." />
      ) : (
        enemies.map((enemy) => (
          <div
            key={enemy.id}
            className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-4 py-3"
          >
            <button className="flex-1 text-left" onClick={() => setEditing(enemy)}>
              <div className="font-medium text-slate-100">{enemy.name}</div>
              <div className="text-xs text-slate-500">
                ❤ {enemy.health} · ✦ {enemy.mana} · 🛡 {enemy.armor} · {enemy.id}
              </div>
            </button>
            <Button
              variant="danger"
              onClick={() => {
                if (confirm(`"${enemy.name}" silinsin mi?`)) deleteEnemy(enemy.id)
              }}
            >
              Sil
            </Button>
          </div>
        ))
      )}

      {editing && (
        <EnemyForm
          initial={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function EnemyForm({ initial, onClose }: { initial: Enemy | null; onClose: () => void }) {
  const addEnemy = useStore((s) => s.addEnemy)
  const updateEnemy = useStore((s) => s.updateEnemy)

  const [name, setName] = useState(initial?.name ?? '')
  const [health, setHealth] = useState(initial?.health ?? 100)
  const [mana, setMana] = useState(initial?.mana ?? 0)
  const [armor, setArmor] = useState(initial?.armor ?? 0)
  const [resistances, setResistances] = useState<Resistances>(
    initial?.resistances ?? emptyResistances(),
  )

  const save = () => {
    if (!name.trim()) {
      alert('İsim gerekli.')
      return
    }
    const enemy: Enemy = {
      id: initial?.id ?? newId('enemy'),
      name: name.trim(),
      health,
      mana,
      armor,
      resistances,
    }
    if (initial) updateEnemy(enemy)
    else addEnemy(enemy)
    onClose()
  }

  return (
    <Modal
      title={initial ? 'Düşman Düzenle' : 'Yeni Düşman'}
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
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn: Mağara Goblini" />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Can">
            <NumberInput value={health} onChange={(e) => setHealth(Number(e.target.value))} />
          </Field>
          <Field label="Mana">
            <NumberInput value={mana} onChange={(e) => setMana(Number(e.target.value))} />
          </Field>
          <Field label="Zırh">
            <NumberInput value={armor} onChange={(e) => setArmor(Number(e.target.value))} />
          </Field>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-300">Dirençler</span>
          <div className="grid grid-cols-2 gap-3">
            {RESISTANCE_TYPES.map((type) => (
              <Field key={type} label={RESISTANCE_LABELS[type]}>
                <NumberInput
                  value={resistances[type]}
                  onChange={(e) =>
                    setResistances((prev) => ({ ...prev, [type]: Number(e.target.value) }))
                  }
                />
              </Field>
            ))}
          </div>
        </div>

        {initial && <p className="text-xs text-slate-500">id: {initial.id}</p>}
      </div>
    </Modal>
  )
}
