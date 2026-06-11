import { useState } from 'react'
import { useStore } from '../store'
import { newId } from '../lib/id'
import { confirmDialog, notify } from '../lib/ui-store'
import { DEFAULT_AFFIXES } from '../lib/default-affixes'
import {
  AFFIX_KIND_LABELS,
  AFFIX_STAT_DEFS,
  AFFIX_STAT_KEYS,
  type Affix,
  type AffixStat,
  affixKind,
} from '../types/model'
import {
  Button,
  EmptyState,
  Field,
  Modal,
  NumberInput,
  SearchInput,
  Select,
  TextInput,
} from './ui'

const PREFIX_STATS = AFFIX_STAT_KEYS.filter((k) => AFFIX_STAT_DEFS[k].kind === 'prefix')
const SUFFIX_STATS = AFFIX_STAT_KEYS.filter((k) => AFFIX_STAT_DEFS[k].kind === 'suffix')

export function AffixesTab() {
  const affixes = useStore((s) => s.affixes)
  const setAffixes = useStore((s) => s.setAffixes)
  const deleteAffix = useStore((s) => s.deleteAffix)
  const [editing, setEditing] = useState<Affix | 'new' | null>(null)
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState<AffixStat | 'all'>('all')

  const q = query.trim().toLowerCase()
  const filtered = q
    ? affixes.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          AFFIX_STAT_DEFS[a.stat].label.toLowerCase().includes(q),
      )
    : affixes

  // Filtre için: hangi stat türlerinde kaç efsun var.
  const countByStat = new Map<AffixStat, number>()
  for (const a of affixes) countByStat.set(a.stat, (countByStat.get(a.stat) ?? 0) + 1)
  const presentCats = AFFIX_STAT_KEYS.filter((k) => countByStat.has(k))

  // Seçili kategoriye (veya hepsine) göre grupla; boş gruplar gizlenir.
  const catKeys = cat === 'all' ? AFFIX_STAT_KEYS : [cat]
  const groups = catKeys
    .map((statKey) => ({
      statKey,
      rows: filtered.filter((a) => a.stat === statKey).sort((a, b) => a.level - b.level),
    }))
    .filter((g) => g.rows.length > 0)
  const shownCount = groups.reduce((n, g) => n + g.rows.length, 0)

  const importDefaults = async () => {
    // İsme göre eşleştir: yoksa ekle, varsa stat/değer/seviyeyi güncelle.
    const next = [...affixes]
    const indexByName = new Map(next.map((a, i) => [a.name.toLowerCase(), i]))
    let added = 0
    let updated = 0
    for (const d of DEFAULT_AFFIXES) {
      const i = indexByName.get(d.name.toLowerCase())
      if (i === undefined) {
        next.push({ id: newId('affix'), name: d.name, stat: d.stat, value: d.value, level: d.level })
        added++
      } else if (
        next[i].stat !== d.stat ||
        next[i].value !== d.value ||
        next[i].level !== d.level
      ) {
        next[i] = { ...next[i], stat: d.stat, value: d.value, level: d.level }
        updated++
      }
    }
    if (added === 0 && updated === 0) {
      notify('Varsayılan efsunlar zaten güncel.', 'info')
      return
    }
    if (
      await confirmDialog(
        `${added} yeni efsun eklenecek, ${updated} efsun güncellenecek. Devam edilsin mi?`,
        'Yükle',
      )
    ) {
      setAffixes(next)
      notify(`${added} eklendi, ${updated} güncellendi.`)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Button variant="primary" className="flex-1" onClick={() => setEditing('new')}>
          + Yeni Ek
        </Button>
        <Button onClick={importDefaults}>⬇ Varsayılanları yükle</Button>
      </div>

      {affixes.length > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="sm:flex-1">
            <Select value={cat} onChange={(e) => setCat(e.target.value as AffixStat | 'all')}>
              <option value="all">Tüm kategoriler ({affixes.length})</option>
              <optgroup label="Ön ek">
                {presentCats
                  .filter((k) => AFFIX_STAT_DEFS[k].kind === 'prefix')
                  .map((k) => (
                    <option key={k} value={k}>
                      {AFFIX_STAT_DEFS[k].label} ({countByStat.get(k)})
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Son ek">
                {presentCats
                  .filter((k) => AFFIX_STAT_DEFS[k].kind === 'suffix')
                  .map((k) => (
                    <option key={k} value={k}>
                      {AFFIX_STAT_DEFS[k].label} ({countByStat.get(k)})
                    </option>
                  ))}
              </optgroup>
            </Select>
          </div>
          <div className="sm:flex-1">
            <SearchInput value={query} onChange={setQuery} placeholder="Efsun ara..." />
          </div>
        </div>
      )}

      {affixes.length === 0 ? (
        <EmptyState text="Henüz efsun yok. 'Varsayılanları yükle' ile tüm oyun efsunlarını ekleyebilirsin." />
      ) : shownCount === 0 ? (
        <EmptyState text="Bu filtre/aramayla eşleşen efsun yok." />
      ) : (
        groups.map((group) => {
          const def = AFFIX_STAT_DEFS[group.statKey]
          return (
            <div key={group.statKey} className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-1 pt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span>{def.label}</span>
                <span className="text-sky-300/70">{AFFIX_KIND_LABELS[def.kind]}</span>
                <span className="opacity-60">{group.rows.length}</span>
              </div>
              {group.rows.map((affix) => (
                <div
                  key={affix.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3"
                >
                  <span className="text-xl">✨</span>
                  <button className="min-w-0 flex-1 text-left" onClick={() => setEditing(affix)}>
                    <div className="truncate font-medium text-slate-100">{affix.name}</div>
                    <div className="text-xs text-slate-500">
                      Lv {affix.level} · {def.label} +{affix.value}
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
              ))}
            </div>
          )
        })
      )}

      {editing && (
        <AffixForm initial={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />
      )}
    </div>
  )
}

function AffixForm({ initial, onClose }: { initial: Affix | null; onClose: () => void }) {
  const addAffix = useStore((s) => s.addAffix)
  const updateAffix = useStore((s) => s.updateAffix)

  const [name, setName] = useState(initial?.name ?? '')
  const [stat, setStat] = useState<AffixStat>(initial?.stat ?? 'hasarFire')
  const [value, setValue] = useState(initial?.value ?? 0)
  const [level, setLevel] = useState(initial?.level ?? 1)

  const kind = AFFIX_STAT_DEFS[stat].kind

  const save = () => {
    if (!name.trim()) {
      notify('İsim gerekli.', 'error')
      return
    }
    const affix: Affix = { id: initial?.id ?? newId('affix'), name: name.trim(), stat, value, level }
    if (initial) updateAffix(affix)
    else addAffix(affix)
    notify('Efsun kaydedildi.')
    onClose()
  }

  return (
    <Modal
      title={initial ? 'Efsun Düzenle' : 'Yeni Efsun'}
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
            placeholder="Örn: Buz Hasarı Veren"
          />
        </Field>

        <Field
          label="Stat"
          hint={`Bu stat türü efsunu ${AFFIX_KIND_LABELS[kind]} yapar.`}
        >
          <Select value={stat} onChange={(e) => setStat(e.target.value as AffixStat)}>
            <optgroup label="Ön ek (hasar)">
              {PREFIX_STATS.map((k) => (
                <option key={k} value={k}>
                  {AFFIX_STAT_DEFS[k].label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Son ek">
              {SUFFIX_STATS.map((k) => (
                <option key={k} value={k}>
                  {AFFIX_STAT_DEFS[k].label}
                </option>
              ))}
            </optgroup>
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Değer">
            <NumberInput step="any" value={value} onChange={(e) => setValue(Number(e.target.value))} />
          </Field>
          <Field label="Seviye" hint="Aynı seviye item'lara uygulanır.">
            <NumberInput min={1} value={level} onChange={(e) => setLevel(Number(e.target.value))} />
          </Field>
        </div>

        {initial && <p className="text-xs text-slate-500">id: {initial.id}</p>}
      </div>
    </Modal>
  )
}
