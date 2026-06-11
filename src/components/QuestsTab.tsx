import { useState } from 'react'
import { useStore } from '../store'
import { newId } from '../lib/id'
import { objectiveSummary } from '../lib/summary'
import { confirmDialog, notify } from '../lib/ui-store'
import {
  ITEM_SLOT_LABELS,
  QUEST_TYPES,
  QUEST_TYPE_LABELS,
  type Affix,
  type Item,
  type Material,
  type Objective,
  type Quest,
  type QuestReward,
  type QuestType,
  affixKind,
  defaultObjective,
} from '../types/model'
import {
  Button,
  Combobox,
  EmptyState,
  Field,
  Modal,
  NumberInput,
  SearchInput,
  Select,
  TextArea,
  TextInput,
} from './ui'

export function QuestsTab() {
  const quests = useStore((s) => s.quests)
  const npcs = useStore((s) => s.npcs)
  const enemies = useStore((s) => s.enemies)
  const areas = useStore((s) => s.areas)
  const deleteQuest = useStore((s) => s.deleteQuest)
  const [editing, setEditing] = useState<Quest | 'new' | null>(null)

  const npcName = (id: string) => npcs.find((n) => n.id === id)?.name ?? '—'
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const filtered = q ? quests.filter((quest) => quest.title.toLowerCase().includes(q)) : quests

  return (
    <div className="flex flex-col gap-3">
      <Button variant="primary" onClick={() => setEditing('new')}>
        + Yeni Görev
      </Button>

      {quests.length > 0 && (
        <SearchInput value={query} onChange={setQuery} placeholder="Görev ara..." />
      )}

      {quests.length === 0 ? (
        <EmptyState text="Henüz görev yok. Yeni bir görev ekle." />
      ) : filtered.length === 0 ? (
        <EmptyState text="Aramayla eşleşen görev yok." />
      ) : (
        filtered.map((quest) => (
          <div
            key={quest.id}
            className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3"
          >
            <span className="text-xl">📜</span>
            <button className="min-w-0 flex-1 text-left" onClick={() => setEditing(quest)}>
              <div className="truncate font-medium text-slate-100">{quest.title}</div>
              <div className="truncate text-xs text-sky-300/80">
                {objectiveSummary(quest.objective, { npcs, enemies, areas })}
              </div>
              <div className="text-xs text-slate-500">
                Lv {quest.requiredLevel} · {npcName(quest.giverNpcId)} verir
              </div>
            </button>
            <Button
              variant="danger"
              onClick={async () => {
                if (await confirmDialog(`"${quest.title}" silinsin mi?`)) deleteQuest(quest.id)
              }}
            >
              Sil
            </Button>
          </div>
        ))
      )}

      {editing && (
        <QuestForm
          initial={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function QuestForm({ initial, onClose }: { initial: Quest | null; onClose: () => void }) {
  const npcs = useStore((s) => s.npcs)
  const enemies = useStore((s) => s.enemies)
  const areas = useStore((s) => s.areas)
  const items = useStore((s) => s.items)
  const materials = useStore((s) => s.materials)
  const affixes = useStore((s) => s.affixes)
  const quests = useStore((s) => s.quests)
  const addQuest = useStore((s) => s.addQuest)
  const updateQuest = useStore((s) => s.updateQuest)

  const id = initial?.id ?? newId('quest')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [giverNpcId, setGiverNpcId] = useState(initial?.giverNpcId ?? '')
  const [requiredLevel, setRequiredLevel] = useState(initial?.requiredLevel ?? 1)
  const [dependsOnQuestId, setDependsOnQuestId] = useState<string>(
    initial?.dependsOnQuestId ?? '',
  )
  const [rewardExp, setRewardExp] = useState(initial?.rewardExp ?? 0)
  const [rewards, setRewards] = useState<QuestReward[]>(initial?.rewards ?? [])

  const updateReward = (i: number, reward: QuestReward) =>
    setRewards((prev) => prev.map((r, idx) => (idx === i ? reward : r)))
  const removeReward = (i: number) =>
    setRewards((prev) => prev.filter((_, idx) => idx !== i))
  const addItemReward = () =>
    setRewards((prev) => [
      ...prev,
      { kind: 'item', itemId: '', prefixId: null, suffixId: null, quantity: 1 },
    ])
  const addMaterialReward = () =>
    setRewards((prev) => [...prev, { kind: 'material', materialId: '', quantity: 1 }])

  const [objective, setObjective] = useState<Objective>(
    initial?.objective ?? defaultObjective('TALK_TO_NPC'),
  )

  // Bağımlılık seçiminde kendisini ve döngü oluşturmamak için sadece diğer görevler.
  const dependencyOptions = quests.filter((q) => q.id !== id)

  const save = () => {
    if (!title.trim()) {
      notify('Başlık gerekli.', 'error')
      return
    }
    const quest: Quest = {
      id,
      title: title.trim(),
      description: description.trim(),
      giverNpcId,
      requiredLevel,
      dependsOnQuestId: dependsOnQuestId || null,
      rewardExp,
      rewards: rewards.filter((r) => (r.kind === 'item' ? r.itemId : r.materialId)),
      objective,
    }
    if (initial) updateQuest(quest)
    else addQuest(quest)
    notify('Görev kaydedildi.')
    onClose()
  }

  return (
    <Modal
      title={initial ? 'Görev Düzenle' : 'Yeni Görev'}
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
        <Field label="Başlık">
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Örn: Kayıp Kılıç" />
        </Field>

        <Field label="Açıklama" hint="İsteğe bağlı — görevin hikâye metni.">
          <TextArea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Örn: Köyün demircisi kayıp kılıcını arıyor..."
          />
        </Field>

        <Field label="Veren NPC">
          <Select value={giverNpcId} onChange={(e) => setGiverNpcId(e.target.value)}>
            <option value="">— seç —</option>
            {npcs.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Gerekli seviye">
            <NumberInput
              value={requiredLevel}
              min={1}
              onChange={(e) => setRequiredLevel(Number(e.target.value))}
            />
          </Field>
          <Field label="Ödül EXP">
            <NumberInput value={rewardExp} onChange={(e) => setRewardExp(Number(e.target.value))} />
          </Field>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-300">Ödüller (item / materyal)</span>
          {rewards.map((r, i) => (
            <RewardRow
              key={i}
              reward={r}
              onChange={(nr) => updateReward(i, nr)}
              onRemove={() => removeReward(i)}
              items={items}
              materials={materials}
              affixes={affixes}
            />
          ))}
          <div className="flex gap-2">
            <Button onClick={addItemReward}>+ Item ödülü</Button>
            <Button onClick={addMaterialReward}>+ Materyal ödülü</Button>
          </div>
          {items.length === 0 && materials.length === 0 && (
            <p className="text-xs text-slate-500">Önce Item veya Materyal eklemelisin.</p>
          )}
        </div>

        <Field label="Bağımlı olduğu görev" hint="Bu görev, seçilen görev tamamlanmadan alınamaz.">
          <Select value={dependsOnQuestId} onChange={(e) => setDependsOnQuestId(e.target.value)}>
            <option value="">— yok —</option>
            {dependencyOptions.map((q) => (
              <option key={q.id} value={q.id}>
                {q.title}
              </option>
            ))}
          </Select>
        </Field>

        {/* Hedef tipi ve tipe özel alanlar */}
        <Field label="Görev tipi">
          <Select
            value={objective.type}
            onChange={(e) => setObjective(defaultObjective(e.target.value as QuestType))}
          >
            {QUEST_TYPES.map((t) => (
              <option key={t} value={t}>
                {QUEST_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </Field>

        <ObjectiveFields objective={objective} setObjective={setObjective} />

        <div className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2">
          <div className="text-xs text-slate-500">Otomatik özet</div>
          <div className="text-sm text-sky-300">
            {objectiveSummary(objective, { npcs, enemies, areas })}
          </div>
        </div>

        <p className="text-xs text-slate-500">id: {id}</p>
      </div>
    </Modal>
  )
}

function QuantityRow({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-400">Adet</span>
      <div className="w-24">
        <NumberInput min={1} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      </div>
    </div>
  )
}

function RewardRow({
  reward,
  onChange,
  onRemove,
  items,
  materials,
  affixes,
}: {
  reward: QuestReward
  onChange: (reward: QuestReward) => void
  onRemove: () => void
  items: Item[]
  materials: Material[]
  affixes: Affix[]
}) {
  if (reward.kind === 'material') {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-slate-800 p-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Materyal ödülü</span>
          <Button variant="danger" onClick={onRemove}>
            Kaldır
          </Button>
        </div>
        <Combobox
          value={reward.materialId || null}
          onChange={(v) => onChange({ ...reward, materialId: v ?? '' })}
          options={materials.map((m) => ({ value: m.id, label: m.name, hint: `Lv ${m.level}` }))}
          placeholder="— materyal seç —"
          noneLabel="— materyal seç —"
          searchPlaceholder="Materyal ara..."
          emptyText="Materyal bulunamadı"
        />
        <QuantityRow value={reward.quantity} onChange={(q) => onChange({ ...reward, quantity: q })} />
      </div>
    )
  }

  // Item ödülü
  const item = items.find((it) => it.id === reward.itemId) ?? null
  const itemLevel = item?.level ?? null
  const prefixOptions = affixes.filter((a) => affixKind(a) === 'prefix' && a.level === itemLevel)
  const suffixOptions = affixes.filter((a) => affixKind(a) === 'suffix' && a.level === itemLevel)
  const composed = [
    affixes.find((a) => a.id === reward.prefixId)?.name,
    affixes.find((a) => a.id === reward.suffixId)?.name,
    item?.name,
  ]
    .filter(Boolean)
    .join(' ')
  const affixCount = (reward.prefixId ? 1 : 0) + (reward.suffixId ? 1 : 0)
  const nameColor =
    affixCount === 2 ? 'text-yellow-300' : affixCount === 1 ? 'text-sky-300' : 'text-slate-200'

  // Item değişince, seviyesi uyuşmayan ekleri temizle.
  const onItemChange = (newId: string | null) => {
    const lvl = items.find((it) => it.id === newId)?.level ?? null
    const next = { ...reward, itemId: newId ?? '' }
    if (next.prefixId && affixes.find((a) => a.id === next.prefixId)?.level !== lvl) {
      next.prefixId = null
    }
    if (next.suffixId && affixes.find((a) => a.id === next.suffixId)?.level !== lvl) {
      next.suffixId = null
    }
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-800 p-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">Item ödülü</span>
        <Button variant="danger" onClick={onRemove}>
          Kaldır
        </Button>
      </div>
      <Combobox
        value={reward.itemId || null}
        onChange={onItemChange}
        options={items.map((it) => ({
          value: it.id,
          label: it.name,
          hint: `${ITEM_SLOT_LABELS[it.slot]} · Lv ${it.level}`,
        }))}
        placeholder="— item seç —"
        noneLabel="— item seç —"
        searchPlaceholder="Item ara..."
        emptyText="Item bulunamadı"
      />
      {reward.itemId && (
        <>
          <Field label="Ön ek" hint={`Yalnızca Lv ${itemLevel} ön ekler.`}>
            <Combobox
              value={reward.prefixId}
              onChange={(v) => onChange({ ...reward, prefixId: v })}
              options={prefixOptions.map((a) => ({ value: a.id, label: a.name }))}
              placeholder="— ön ek yok —"
              noneLabel="— ön ek yok —"
              searchPlaceholder="Ön ek ara..."
              emptyText={`Lv ${itemLevel} ön ek yok`}
            />
          </Field>
          <Field label="Son ek" hint={`Yalnızca Lv ${itemLevel} son ekler.`}>
            <Combobox
              value={reward.suffixId}
              onChange={(v) => onChange({ ...reward, suffixId: v })}
              options={suffixOptions.map((a) => ({ value: a.id, label: a.name }))}
              placeholder="— son ek yok —"
              noneLabel="— son ek yok —"
              searchPlaceholder="Son ek ara..."
              emptyText={`Lv ${itemLevel} son ek yok`}
            />
          </Field>
        </>
      )}
      <QuantityRow value={reward.quantity} onChange={(q) => onChange({ ...reward, quantity: q })} />
      {reward.itemId && (
        <div className={`text-sm ${nameColor}`}>
          {composed} ×{reward.quantity}
        </div>
      )}
    </div>
  )
}

function ObjectiveFields({
  objective,
  setObjective,
}: {
  objective: Objective
  setObjective: (o: Objective) => void
}) {
  const npcs = useStore((s) => s.npcs)
  const enemies = useStore((s) => s.enemies)
  const areas = useStore((s) => s.areas)

  if (objective.type === 'TALK_TO_NPC') {
    return (
      <Field label="Konuşulacak NPC">
        <Select
          value={objective.targetNpcId}
          onChange={(e) => setObjective({ type: 'TALK_TO_NPC', targetNpcId: e.target.value })}
        >
          <option value="">— seç —</option>
          {npcs.map((n) => (
            <option key={n.id} value={n.id}>
              {n.name}
            </option>
          ))}
        </Select>
      </Field>
    )
  }

  if (objective.type === 'KILL_ENEMY') {
    return (
      <div className="grid grid-cols-2 gap-3">
        <Field label="Hedef düşman">
          <Select
            value={objective.targetEnemyId}
            onChange={(e) =>
              setObjective({ ...objective, targetEnemyId: e.target.value })
            }
          >
            <option value="">— seç —</option>
            {enemies.map((en) => (
              <option key={en.id} value={en.id}>
                {en.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Adet">
          <NumberInput
            min={1}
            value={objective.amount}
            onChange={(e) => setObjective({ ...objective, amount: Number(e.target.value) })}
          />
        </Field>
      </div>
    )
  }

  // EXPLORE_AREA
  return (
    <Field label="Keşfedilecek bölge" hint="Bölgeler 'Bölge' sekmesinden eklenir.">
      <Select
        value={objective.targetAreaId}
        onChange={(e) => setObjective({ type: 'EXPLORE_AREA', targetAreaId: e.target.value })}
      >
        <option value="">— seç —</option>
        {areas.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </Select>
    </Field>
  )
}
