# Toolio — RPG İçerik Editörü

RPG oyunu için **NPC**, **düşman (enemy)** ve **görev (quest)** tanımlama aracı.
Veriler tarayıcıda otomatik saklanır ve tek bir JSON dosyası olarak dışa/içe aktarılır.
Mobil dahil her tarayıcıda çalışır (PWA — telefonda "ana ekrana ekle" ile uygulama gibi kurulabilir).

## Teknoloji

- React 19 + TypeScript + Vite
- Tailwind CSS v4 (mobil öncelikli arayüz)
- Zustand (state + `localStorage`'a otomatik kayıt)
- Zod (veri şeması + JSON doğrulama)
- vite-plugin-pwa (offline / kurulabilirlik)

## Komutlar

```bash
npm install     # bağımlılıkları kur
npm run dev     # geliştirme sunucusu (http://localhost:5173)
npm run build   # tip kontrolü + production derleme (dist/)
npm run preview # derlenmiş sürümü önizle
```

## Veri modeli

Tüm tipler ve doğrulama kuralları [src/types/model.ts](src/types/model.ts) içinde.

- **NPC**: `id`, `name`, `dialogues[]`
- **Enemy**: `id`, `name`, `health`, `mana`, `armor`, `resistances` (fire / ice / electric / poison / acid)
- **Quest**: `id`, `title`, `giverNpcId`, `requiredLevel`, `dependsOnQuestId`, `rewardExp`, `rewardItem`, `objective`
  - `objective` 3 tipten biri: `TALK_TO_NPC` · `KILL_ENEMY` (hedef + adet) · `EXPLORE_AREA` (alan adı)

Görevin hangi NPC'den alındığı, görev üzerinde `giverNpcId` ile tutulur (tek doğru kaynak).
Bir NPC'nin verdiği görevler bu alandan türetilir; böylece çift yönlü senkronizasyon hatası olmaz.

## JSON

- **JSON Kaydet**: tüm veriyi `rpg-data.json` olarak indirir.
- **JSON Aç**: dosyayı yükler, Zod ile doğrular, geçerliyse ekrana getirir ve düzenlenebilir hale getirir.
