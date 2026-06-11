import { useState } from 'react'
import { useStore } from '../store'
import { newId } from '../lib/id'
import { confirmDialog, notify } from '../lib/ui-store'
import {
  AFFIX_KINDS,
  AFFIX_KIND_LABELS,
  RESISTANCE_LABELS,
  RESISTANCE_TYPES,
  type Affix,
  type AffixKind,
  type Resistances,
  emptyResistances,
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
} from './ui'

/** Sıfır olmayan elementleri "Buz fiz +5" gibi metne çevirir. */
function elementalParts(suffix: string, r: Resistances): string[] {
  return RESISTANCE_TYPES.filter((t) => r[t] !== 0).map(
    (t) => `${RESISTANCE_LABELS[t]} ${suffix} +${r[t]}`,
  )
}

function affixStatSummary(affix: Affix): string {
  const parts: string[] = []
  if (affix.kind === 'prefix') {
    parts.push(...elementalParts('fiz', affix.physicalDamage))
    parts.push(...elementalParts('büyü', affix.magicDamage))
    if (affix.maxHealth) parts.push(`Can +${affix.maxHealth}`)
  } else {
    if (affix.attack) parts.push(`Saldırı +${affix.attack}`)
    if (affix.defense) parts.push(`Savunma +${affix.defense}`)
    if (affix.maxMana) parts.push(`Kudret +${affix.maxMana}`)
    parts.push(...elementalParts('direnç', affix.resistance))
    if (affix.armor) parts.push(`Zırh +${affix.armor}`)
  }
  return parts.join(' · ') || '— değer yok —'
}

export function AffixesTab() {
  const affixes = useStore((s) => s.affixes)
  const deleteAffix = useStore((s) => s.deleteAffix)
  const [editing, setEditing] = useState<Affix | 'new' | null>(null)
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const filtered = q ? affixes.filter((a) => a.name.toLowerCase().includes(q)) : affixes

  return (
    <div className="flex flex-col gap-3">
      <Button variant="primary" onClick={() => setEditing('new')}>
        + Yeni Ek
      </Button>

      {affixes.length > 0 && (
        <SearchInput value={query} onChange={setQuery} placeholder="Ek ara..." />
      )}

      {affixes.length === 0 ? (
        <EmptyState text="Henüz ön/son ek yok. Örn: 'buz hasarlı' (ön ek), 'zehir dirençli' (son ek)." />
      ) : filtered.length === 0 ? (
        <EmptyState text="Aramayla eşleşen ek yok." />
      ) : (
        filtered.map((affix) => (
          <div
            key={affix.id}
            className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3"
          >
            <span className="text-xl">✨</span>
            <button className="min-w-0 flex-1 text-left" onClick={() => setEditing(affix)}>
              <div className="flex items-center gap-2 font-medium text-slate-100">
                <span className="truncate">{affix.name}</span>
                <span className="shrink-0 rounded bg-sky-500/15 px-1.5 py-0.5 text-xs font-medium text-sky-300">
                  {AFFIX_KIND_LABELS[affix.kind]}
                </span>
              </div>
              <div className="truncate text-xs text-slate-500">
                Lv {affix.level} · {affixStatSummary(affix)}
              </div>
            </button>
            <Button
              variant="danger"
              onClick={async () => {
                if (await confirmDialog(`"${affix.name}" silinsin mi?`)) deleteAffix(affix.id)
              }}
            >
              Sil
            </Button>
          </div>
        ))
      )}

      {editing && (
        <AffixForm
          initial={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function ElementalInputs({
  label,
  value,
  onChange,
}: {
  label: string
  value: Resistances
  onChange: (v: Resistances) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      <div className="grid grid-cols-2 gap-3">
        {RESISTANCE_TYPES.map((t) => (
          <Field key={t} label={RESISTANCE_LABELS[t]}>
            <NumberInput
              step="any"
              value={value[t]}
              onChange={(e) => onChange({ ...value, [t]: Number(e.target.value) })}
            />
          </Field>
        ))}
      </div>
    </div>
  )
}

function AffixForm({ initial, onClose }: { initial: Affix | null; onClose: () => void }) {
  const addAffix = useStore((s) => s.addAffix)
  const updateAffix = useStore((s) => s.updateAffix)

  const id = initial?.id ?? newId('affix')
  const [name, setName] = useState(initial?.name ?? '')
  const [kind, setKind] = useState<AffixKind>(initial?.kind ?? 'prefix')
  const [level, setLevel] = useState(initial?.level ?? 1)
  const [description, setDescription] = useState(initial?.description ?? '')

  // Ön ek statları
  const [physicalDamage, setPhysicalDamage] = useState<Resistances>(
    initial?.kind === 'prefix' ? initial.physicalDamage : emptyResistances(),
  )
  const [magicDamage, setMagicDamage] = useState<Resistances>(
    initial?.kind === 'prefix' ? initial.magicDamage : emptyResistances(),
  )
  const [maxHealth, setMaxHealth] = useState(initial?.kind === 'prefix' ? initial.maxHealth : 0)

  // Son ek statları
  const [attack, setAttack] = useState(initial?.kind === 'suffix' ? initial.attack : 0)
  const [defense, setDefense] = useState(initial?.kind === 'suffix' ? initial.defense : 0)
  const [maxMana, setMaxMana] = useState(initial?.kind === 'suffix' ? initial.maxMana : 0)
  const [resistance, setResistance] = useState<Resistances>(
    initial?.kind === 'suffix' ? initial.resistance : emptyResistances(),
  )
  const [armor, setArmor] = useState(initial?.kind === 'suffix' ? initial.armor : 0)

  const save = () => {
    if (!name.trim()) {
      notify('İsim gerekli.', 'error')
      return
    }
    const affix: Affix =
      kind === 'prefix'
        ? {
            id,
            kind: 'prefix',
            name: name.trim(),
            level,
            description: description.trim(),
            physicalDamage,
            magicDamage,
            maxHealth,
          }
        : {
            id,
            kind: 'suffix',
            name: name.trim(),
            level,
            description: description.trim(),
            attack,
            defense,
            maxMana,
            resistance,
            armor,
          }
    if (initial) updateAffix(affix)
    else addAffix(affix)
    notify('Ek kaydedildi.')
    onClose()
  }

  return (
    <Modal
      title={initial ? 'Ek Düzenle' : 'Yeni Ek'}
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
            placeholder={kind === 'prefix' ? 'Örn: buz hasarlı' : 'Örn: zehir dirençli'}
          />
        </Field>

        <Field label="Tür" hint="Tür, hangi değerleri verebileceğini belirler.">
          <SegmentedControl
            value={kind}
            onChange={setKind}
            options={AFFIX_KINDS.map((k) => ({ value: k, label: AFFIX_KIND_LABELS[k] }))}
          />
        </Field>

        <Field label="Seviye" hint="Ek, yalnızca aynı seviyedeki item'lara uygulanabilir.">
          <NumberInput min={1} value={level} onChange={(e) => setLevel(Number(e.target.value))} />
        </Field>

        {kind === 'prefix' ? (
          <>
            <ElementalInputs
              label="Fiziksel hasar"
              value={physicalDamage}
              onChange={setPhysicalDamage}
            />
            <ElementalInputs label="Büyü hasarı" value={magicDamage} onChange={setMagicDamage} />
            <Field label="Maksimum can">
              <NumberInput value={maxHealth} onChange={(e) => setMaxHealth(Number(e.target.value))} />
            </Field>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Saldırı değeri">
                <NumberInput
                  step="any"
                  value={attack}
                  onChange={(e) => setAttack(Number(e.target.value))}
                />
              </Field>
              <Field label="Savunma değeri">
                <NumberInput
                  step="any"
                  value={defense}
                  onChange={(e) => setDefense(Number(e.target.value))}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Maks. mana (kudret)">
                <NumberInput value={maxMana} onChange={(e) => setMaxMana(Number(e.target.value))} />
              </Field>
              <Field label="Zırh">
                <NumberInput
                  step="any"
                  value={armor}
                  onChange={(e) => setArmor(Number(e.target.value))}
                />
              </Field>
            </div>
            <ElementalInputs label="Direnç" value={resistance} onChange={setResistance} />
          </>
        )}

        <Field label="Açıklama / not" hint="İsteğe bağlı.">
          <TextArea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Örn: düşük seviye eşyalarda sık çıkar..."
          />
        </Field>

        {initial && <p className="text-xs text-slate-500">id: {initial.id}</p>}
      </div>
    </Modal>
  )
}
