import { useState } from 'react'
import { useStore } from '../store'
import { newId } from '../lib/id'
import { objectiveSummary } from '../lib/summary'
import {
  ITEM_SLOT_LABELS,
  QUEST_TYPES,
  QUEST_TYPE_LABELS,
  type Objective,
  type Quest,
  type QuestType,
  defaultObjective,
} from '../types/model'
import {
  Button,
  Combobox,
  EmptyState,
  Field,
  Modal,
  NumberInput,
  SegmentedControl,
  Select,
  TextArea,
  TextInput,
} from './ui'

type RewardKind = 'none' | 'item' | 'material'

export function QuestsTab() {
  const quests = useStore((s) => s.quests)
  const npcs = useStore((s) => s.npcs)
  const enemies = useStore((s) => s.enemies)
  const areas = useStore((s) => s.areas)
  const deleteQuest = useStore((s) => s.deleteQuest)
  const [editing, setEditing] = useState<Quest | 'new' | null>(null)

  const npcName = (id: string) => npcs.find((n) => n.id === id)?.name ?? '—'

  return (
    <div className="flex flex-col gap-3">
      <Button variant="primary" onClick={() => setEditing('new')}>
        + Yeni Görev
      </Button>

      {quests.length === 0 ? (
        <EmptyState text="Henüz görev yok. Yeni bir görev ekle." />
      ) : (
        quests.map((quest) => (
          <div
            key={quest.id}
            className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-4 py-3"
          >
            <button className="flex-1 text-left" onClick={() => setEditing(quest)}>
              <div className="font-medium text-slate-100">{quest.title}</div>
              <div className="text-xs text-sky-300/80">
                {objectiveSummary(quest.objective, { npcs, enemies, areas })}
              </div>
              <div className="text-xs text-slate-500">
                Lv {quest.requiredLevel} · {npcName(quest.giverNpcId)} verir
              </div>
            </button>
            <Button
              variant="danger"
              onClick={() => {
                if (confirm(`"${quest.title}" silinsin mi?`)) deleteQuest(quest.id)
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
  const [rewardItemId, setRewardItemId] = useState<string | null>(initial?.rewardItemId ?? null)
  const [rewardMaterialId, setRewardMaterialId] = useState<string | null>(
    initial?.rewardMaterialId ?? null,
  )
  const [rewardQuantity, setRewardQuantity] = useState(initial?.rewardQuantity ?? 1)
  const [rewardKind, setRewardKind] = useState<RewardKind>(
    initial?.rewardItemId ? 'item' : initial?.rewardMaterialId ? 'material' : 'none',
  )

  // Ödül türü değişince diğer referansı temizle (ödül ya item ya materyal).
  const changeRewardKind = (k: RewardKind) => {
    setRewardKind(k)
    if (k !== 'item') setRewardItemId(null)
    if (k !== 'material') setRewardMaterialId(null)
  }
  const rewardKindOptions: { value: RewardKind; label: string }[] = [
    { value: 'none', label: 'Yok' },
    { value: 'item', label: 'Item' },
    { value: 'material', label: 'Materyal' },
  ]
  const [objective, setObjective] = useState<Objective>(
    initial?.objective ?? defaultObjective('TALK_TO_NPC'),
  )

  // Bağımlılık seçiminde kendisini ve döngü oluşturmamak için sadece diğer görevler.
  const dependencyOptions = quests.filter((q) => q.id !== id)

  const save = () => {
    if (!title.trim()) {
      alert('Başlık gerekli.')
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
      rewardItemId,
      rewardMaterialId,
      rewardQuantity,
      objective,
    }
    if (initial) updateQuest(quest)
    else addQuest(quest)
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

        <Field label="Ödül" hint="Item ya da materyal verilebilir (ikisi birden değil).">
          <SegmentedControl
            value={rewardKind}
            onChange={changeRewardKind}
            options={rewardKindOptions}
          />
        </Field>

        {rewardKind === 'item' && (
          <Combobox
            value={rewardItemId}
            onChange={setRewardItemId}
            options={items.map((it) => ({
              value: it.id,
              label: it.name,
              hint: ITEM_SLOT_LABELS[it.slot],
            }))}
            placeholder="— item seç —"
            noneLabel="— item seç —"
            searchPlaceholder="Item ara..."
            emptyText="Item bulunamadı"
          />
        )}

        {rewardKind === 'material' && (
          <Combobox
            value={rewardMaterialId}
            onChange={setRewardMaterialId}
            options={materials.map((m) => ({
              value: m.id,
              label: m.name,
              hint: `Lv ${m.level}`,
            }))}
            placeholder="— materyal seç —"
            noneLabel="— materyal seç —"
            searchPlaceholder="Materyal ara..."
            emptyText="Materyal bulunamadı"
          />
        )}

        {(rewardItemId || rewardMaterialId) && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Ödül adedi</span>
            <div className="w-24">
              <NumberInput
                min={1}
                value={rewardQuantity}
                onChange={(e) => setRewardQuantity(Number(e.target.value))}
              />
            </div>
          </div>
        )}

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
