import { useState } from 'react'
import { useStore } from '../store'
import { newId } from '../lib/id'
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
  Select,
  TextInput,
} from './ui'

export function QuestsTab() {
  const quests = useStore((s) => s.quests)
  const npcs = useStore((s) => s.npcs)
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
              <div className="text-xs text-slate-500">
                {QUEST_TYPE_LABELS[quest.objective.type]} · Lv {quest.requiredLevel} ·{' '}
                {npcName(quest.giverNpcId)} verir
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
  const items = useStore((s) => s.items)
  const quests = useStore((s) => s.quests)
  const addQuest = useStore((s) => s.addQuest)
  const updateQuest = useStore((s) => s.updateQuest)

  const id = initial?.id ?? newId('quest')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [giverNpcId, setGiverNpcId] = useState(initial?.giverNpcId ?? '')
  const [requiredLevel, setRequiredLevel] = useState(initial?.requiredLevel ?? 1)
  const [dependsOnQuestId, setDependsOnQuestId] = useState<string>(
    initial?.dependsOnQuestId ?? '',
  )
  const [rewardExp, setRewardExp] = useState(initial?.rewardExp ?? 0)
  const [rewardItemId, setRewardItemId] = useState<string | null>(initial?.rewardItemId ?? null)
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
      giverNpcId,
      requiredLevel,
      dependsOnQuestId: dependsOnQuestId || null,
      rewardExp,
      rewardItemId,
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

        <Field label="Ödül item" hint="Item'lar 'Item' sekmesinden eklenir. Boş bırakılabilir.">
          <Combobox
            value={rewardItemId}
            onChange={setRewardItemId}
            options={items.map((it) => ({
              value: it.id,
              label: it.name,
              hint: ITEM_SLOT_LABELS[it.slot],
            }))}
            placeholder="— ödül item yok —"
            noneLabel="— ödül item yok —"
            searchPlaceholder="Item ara..."
            emptyText="Item bulunamadı"
          />
        </Field>

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
