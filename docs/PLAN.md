# Rush — ikas Kampanya Uygulaması

## Context

Repo şu an saf **ikas app starter template**: OAuth + iron-session + Prisma(SQLite) `AuthToken` + tek örnek query (`getMerchant`) + 5 shadcn bileşeni. Storefront script enjeksiyonu, kampanya kavramı, event tracking, önizleme — hiçbiri yok.

Hedef: **Rush**, merchant'ın ikas panelinden kampanya tanımlayıp storefront'a otomatik enjekte edilen bir widget ile yayınladığı bir uygulama. İlk kampanya tipi **Fırsat Ürün**: mağazanın kenarında sticky bir sekme, tıklanınca açılan panelde geri sayım + duyuru + seçili ürün/varyant + indirimli fiyat + sepete ekle. Mimari, ileride başka kampanya tipleri (popup, free shipping bar, bundle vb.) eklenebilecek şekilde **tip registry** üzerine kurulacak. Her kampanya için görüntüleme/açılma/tıklama/sepete ekleme event'leri toplanacak.

Kritik kısıt: **para client'ta belirlenmez.** Widget sadece sunum katmanı; gerçek fırsat fiyatı Rush tarafından oluşturulan bir **ikas Campaign** ile sunucu tarafında garanti altına alınır.

---

## Araştırma bulguları (planın dayandığı gerçekler)

Bunlar ikas admin şeması introspection'ı, ikas.dev dokümanları ve `@ikas/storefront` / `ikascom/ikas-editor-monorepo` kaynak okumasıyla doğrulandı:

| Konu | Bulgu |
|---|---|
| Script enjeksiyonu | `createStorefrontJSScript(input: {name, storefrontId, contentType: SCRIPT\|FILE, scriptContent, isHighPriority})`, `updateStorefrontJSScript(input:{id, ...})`. `scriptContent` **ham HTML** — `<script src="..."></script>` yazılır, çıplak JS değil. |
| Scope | `AppScopeEnum` sadece 11 değer içeriyor. Bize gereken: **`write_storefront`**, **`read_campaigns`**, **`write_campaigns`**. `write_scripts`/`read_storefront` **yok**. |
| storefrontId | `listStorefront(id, salesChannelId)` — v2 şemasında var, dokümanda yok. Dönen tip: `id, name, salesChannelId, domains, routings{domain,path,currencyCode,currencySymbol,countryCodes}`. Bir merchant'ın **birden fazla storefront'u olabilir**. |
| Yükleme sırası | `<head>` içinde: high-priority scriptler → pixel'ler → **`window.IkasEvents` stub'ı** → normal-priority scriptler. → **`isHighPriority: false` kullanacağız** ki `IkasEvents` hazır olsun. |
| Sepete ekleme | `window.addToCart({ variantId, quantity, itemId? })` → `Promise<{success, validationError?}>`. ikas'ın **resmî public API'si** (v2 repo'da "external integrations" için dokümante). `itemId` verilirse quantity **mutlak**tır. |
| Event'ler | `window.IkasEvents.subscribe({ id, callback })` — stub parse anında hazır, hydration'da gerçek implementasyona devrediliyor. 26 event tipi: `PAGE_VIEW, PRODUCT_VIEW, ADD_TO_CART, REMOVE_FROM_CART, VIEW_CART, BEGIN_CHECKOUT, COMPLETE_CHECKOUT, ...`. `ADD_TO_CART` payload'ı **tam cart nesnesini** taşıyor. |
| Sayfa açılışındaki sepet | Broadcast **edilmiyor**. Fallback: `localStorage.getItem('cartId')` → storefront GraphQL `getCartById` (`https://api.myikas.com/api/sf/graphql`, anonim erişilebiliyor). Dokümante değil → best-effort, hata toleranslı yazılacak. |
| Kişiselleştirme | `window.addToCart` **option/personalization değeri kabul etmiyor**. Option set'i olan üründe widget sepete ekleyemez. |
| App Proxy | ikas'ta **yok**. Widget doğrudan bizim domain'imize CORS ile istek atacak; ikas imzalı bir çağrı yok → kendi public key'imizi üreteceğiz. |
| Kampanya | `createCampaign` — `BUY_X_THEN_GET_Y` + `getY.discountType: FIXED_PRODUCT_PRICE` **sabit fırsat fiyatı** verir ve `buyX.filter` ile "önce şu ürünü al" kuralını doğrudan karşılar. `fixedDiscount.isApplyByCartAmount` + `priceRange.min` ise **sepet tutarı eşiği**ni karşılar. |

### Onaylanan kararlar
1. Fiyat: **ikas Campaign otomatik oluşturulacak** (`write_campaigns`).
2. Varyant: widget içinde seçilebilecek; **option set'i olan ürün → ürün sayfasına yönlendir**.
3. Analytics: **Prisma + SQLite**, ham event + günlük rollup.

---

## Mimari

```
src/
  app/
    dashboard/                     iframe kök: kampanya listesi
      campaigns/[id]/page.tsx      kampanya editörü (form + canlı önizleme yan yana)
      settings/page.tsx            script kurulum durumu, scope durumu
    api/
      ikas/                        JWT korumalı admin uçları
        campaigns/route.ts               GET liste, POST oluştur
        campaigns/[id]/route.ts          GET/PATCH/DELETE
        campaigns/[id]/publish/route.ts  POST yayınla / durdur
        products/search/route.ts         ürün arama (varyant + fiyat + görsel)
        script/route.ts                  GET durum, POST kur, DELETE kaldır
        stats/route.ts                   kampanya istatistikleri
        scope/route.ts                   eksik scope tespiti
      public/                      CORS'lu, JWT'siz storefront uçları
        config/route.ts                  GET aktif kampanya payload'ı
        events/route.ts                  POST batch event
      webhooks/ikas/route.ts       app uninstall vb.
  widget/                          esbuild ile public/rush.js'e derlenen bağımsız IIFE
    index.ts                       bootstrap
    context/                       ikas köprüsü (IkasEvents, cart, addToCart, page)
    rules/                         kural motoru (widget + server ortak)
    render/                        shadow DOM UI (tab, panel, countdown, product card)
    transport/                     config fetch + event beacon
  lib/
    campaigns/
      registry.ts                  tip → definition eşlemesi
      types/offer-product/         ilk kampanya tipi (şema + ikas mapper + varsayılanlar)
      rules/                       paylaşılan kural şeması + evaluator (izomorfik)
      ikas-campaign-mapper.ts      Rush kampanyası → ikas Campaign input
    ikas-client/graphql-requests.ts
    public-key.ts                  merchant public key üret/doğrula
  models/
    campaign/manager.ts
    campaign-event/manager.ts
    storefront-script/manager.ts
  components/
    campaign/                      form parçaları (her biri ayrı dosya)
    preview/                       önizleme iframe host'u
```

**Genişletilebilirlik ilkesi:** yeni kampanya tipi eklemek = `src/lib/campaigns/types/<tip>/` altına bir `definition.ts` (zod şema, varsayılan config, ikas campaign mapper, form bileşeni referansı) + `src/widget/render/<tip>.ts` bir renderer yazıp `registry.ts`'e kaydetmek. Başka hiçbir dosyaya dokunulmaz.

---

## Faz 0 — Scope, konfigürasyon, araçlar

**Dosyalar:** `src/globals/config.ts`, `package.json`, `.env.example`, `next.config.js`

1. `config.oauth.scope`'a ekle: `write_storefront,read_campaigns,write_campaigns`. Tam liste:
   `read_orders,write_orders,read_products,read_inventories,write_inventories,write_storefront,read_campaigns,write_campaigns`
2. `config`'e `deployUrl` ve `publicKeySecret` (env: `RUSH_PUBLIC_KEY_SECRET`) ekle; `.env.example` güncelle.
3. `package.json`'a esbuild (devDependency) + script'ler:
   - `build:widget`: `esbuild src/widget/index.ts --bundle --minify --format=iife --target=es2018 --outfile=public/rush.js`
   - `dev:widget`: aynısı `--watch` ile
   - `predev` / `prebuild`: `pnpm build:widget`
4. `next.config.js`'e `/rush.js` için `Cache-Control: public, max-age=300` + `Access-Control-Allow-Origin: *` header'ı.
5. Mevcut kurulumlar için scope yükseltme: `AppBridgeHelper.reAuthorizeApp({ redirectUri, scope, state })` — `/api/ikas/scope` ucu `AuthToken.scope`'u beklenen listeyle karşılaştırıp eksikleri döner, dashboard eksik varsa üstte bir banner ve "İzinleri güncelle" butonu gösterir.

**Doğrulama:** appi kaldırıp yeniden kur → `prisma studio` ile `AuthToken.scope` içinde yeni scope'ları gör.

---

## Faz 1 — Veri modeli

**Dosyalar:** `prisma/schema.prisma`, `src/models/campaign/manager.ts`, `src/models/campaign-event/manager.ts`, `src/models/storefront-script/manager.ts`

Yeni modeller (mevcut `AuthTokenManager` deseniyle birebir aynı stil: `get/put/list/delete` + `toModel`):

- **`Campaign`** — `id`, `merchantId`, `authorizedAppId`, `type` (String, registry anahtarı), `name`, `status` (`DRAFT|ACTIVE|PAUSED|ENDED`), `startsAt?`, `endsAt?`, `config` (JSON string), `rules` (JSON string), `appearance` (JSON string), `ikasCampaignId?`, `priority` (Int), `createdAt/updatedAt/deleted`. Index: `(authorizedAppId, status)`.
- **`CampaignEvent`** — `id`, `campaignId`, `authorizedAppId`, `type` (`IMPRESSION|OPEN|CLICK|ADD_TO_CART|DISMISS`), `sessionId`, `variantId?`, `value?` (Float), `createdAt`. Index: `(campaignId, createdAt)`.
- **`CampaignStat`** — `id`, `campaignId`, `date` (gün başlangıcı), sayaçlar (`impressions, opens, clicks, addToCarts, revenue`). Unique: `(campaignId, date)`.
- **`StorefrontScript`** — `id`, `authorizedAppId`, `storefrontId`, `scriptId` (ikas tarafındaki id), `installedAt`, `deleted`. Unique: `(authorizedAppId, storefrontId)`.
- **`MerchantSettings`** — `authorizedAppId` (unique), `publicKey` (unique), `defaultAppearance` (JSON).

SQLite'ta JSON native değil → manager katmanında `JSON.parse/stringify` yapılıp **tipli domain nesnesi** döndürülür; route'lar ve UI ham string görmez.

**Doğrulama:** `pnpm prisma:init` → `pnpm prisma:studio` ile tabloları gör.

---

## Faz 2 — Kampanya tipi registry + kural şeması

**Dosyalar:** `src/lib/campaigns/registry.ts`, `src/lib/campaigns/types/offer-product/definition.ts`, `src/lib/campaigns/rules/schema.ts`, `src/lib/campaigns/rules/evaluate.ts`

`CampaignTypeDefinition` arayüzü:
```
key, label, description
configSchema: ZodSchema
defaultConfig
supportedRules: RuleKind[]
toIkasCampaignInput(campaign, context) → CreateCampaignInput | null
toWidgetPayload(campaign, resolvedProduct) → WidgetCampaign
```

**`offer-product` config'i:** `productId`, `variantId`, `offerPrice`, `quantity`, `countdown` (`{ mode: 'fixed'|'perSession', endsAt?, durationSec? }`), `headline`, `subtitle`, `ctaLabel`, `tabLabel`.

**Kural şeması** (`rules/schema.ts`, zod discriminated union — widget ve server aynı dosyayı kullanır):
- `cart_total` — `{ op: 'gte'|'lte', amount }`
- `cart_contains_product` — `{ productIds[], variantIds[] }`
- `page_type` — `{ include: ('home'|'product'|'collection'|'cart'|'other')[] }`
- `visitor` — `{ isLoggedIn?: boolean, isFirstVisit?: boolean }`
- `schedule` — `{ startsAt, endsAt, daysOfWeek?, hours? }`
Kök: `{ match: 'all' | 'any', conditions: Rule[] }`.

`evaluate.ts` **saf, bağımlılıksız, izomorfik** bir fonksiyon: `evaluateRules(rules, context) → boolean`. Widget bundle'ında da, önizlemede de, gerekirse serverda da aynı fonksiyon çalışır — davranış farkı imkânsız hale gelir.

**Doğrulama:** `evaluate.ts` için hızlı bir node script'i ile birkaç senaryo (bu repoda test altyapısı yok; eklemek istersen vitest ayrı bir adım).

---

## Faz 3 — Admin API katmanı

**Dosyalar:** `src/lib/ikas-client/graphql-requests.ts` (+ `pnpm codegen`), `src/app/api/ikas/*`

GraphQL dokümanları (CLAUDE.md prosedürü gereği MCP `list` + `introspect` ile şekilleri zaten doğrulandı — sadece yazıp codegen çalıştırılacak):

- `LIST_STOREFRONT` → `id name salesChannelId routings { domain path currencyCode currencySymbol }`
- `LIST_PRODUCT` → `search`/`id` filtresiyle; `id name productOptionSetId variants { id isActive sku images{imageId isMain} prices{sellPrice discountPrice currencyCode currencySymbol} variantValues{variantTypeId variantTypeName variantValueId variantValueName} stocks{stockCount} }`
- `CREATE_STOREFRONT_JS_SCRIPT`, `UPDATE_STOREFRONT_JS_SCRIPT`
- `CREATE_CAMPAIGN`, `UPDATE_CAMPAIGN`, `DELETE_CAMPAIGN_LIST`
- `SAVE_WEBHOOKS`, `DELETE_WEBHOOK`

Route'lar — hepsi mevcut `get-merchant/route.ts` desenini izler (`getUserFromRequest` → `AuthTokenManager.get` → `getIkas` → `{ data: ... }`). Ortak boilerplate `src/lib/api-route-helpers.ts`'deki bir `withMerchant(handler)` sarmalayıcısına çekilir; her route'ta 401/404 kontrolü tekrarlanmaz.

- `GET/POST /api/ikas/campaigns`
- `GET/PATCH/DELETE /api/ikas/campaigns/[id]`
- `POST /api/ikas/campaigns/[id]/publish` — validasyon → ikas Campaign upsert → `status: ACTIVE` → script kurulu değilse kur
- `GET /api/ikas/products/search?q=` — ürün + varyant + fiyat, `productOptionSetId` doluysa `hasOptions: true` bayrağı
- `GET/POST/DELETE /api/ikas/script`
- `GET /api/ikas/stats?campaignId=&range=`
- `GET /api/ikas/scope`

**Görsel URL'i:** ikas ürün görselleri `imageId` olarak dönüyor; `https://cdn.myikas.com/images/{imageId}/image_{size}.webp` şeklinde bir `buildImageUrl(imageId, size)` helper'ı `src/lib/ikas-image.ts`'e yazılacak — **canlı bir üründe doğrulanacak**, tutmazsa `listProduct` yanıtındaki gerçek alan adı esas alınır.

**Fiyat garantisi — `ikas-campaign-mapper.ts`:**
- Kural yoksa veya sadece `cart_total` varsa → `CreateCampaignInput { type: FIXED_AMOUNT, fixedDiscount: { amount: sellPrice - offerPrice, filters: [{ type: VARIANT, idList: [variantId] }], priceRange: { min: cartTotalRule?.amount } }, applicablePrice: SELL_PRICE, hasCoupon: false, canCombineWithOtherCampaigns: false, salesChannelIds: [salesChannelId], dateRange }`
- `cart_contains_product` kuralı varsa → `type: BUY_X_THEN_GET_Y`, `buyX.filter = { type: PRODUCT, idList }`, `getY = { filter: { type: VARIANT, idList: [variantId] }, discountType: FIXED_PRODUCT_PRICE, discountRatio: offerPrice, amount: quantity }`
- Kampanya pasife alınınca/silinince `deleteCampaignList` ile ikas tarafı temizlenir.

**Doğrulama:** dev store'da bir kampanya yayınla → ikas panelinde İndirimler altında oluştuğunu gör → storefront'ta ürünü sepete ekleyip fiyatın düştüğünü doğrula.

---

## Faz 4 — Widget runtime (`public/rush.js`)

**Dosyalar:** `src/widget/**`

Bağımsız IIFE, React yok, sıfır runtime bağımlılığı, hedef < 15 KB gzip. Tüm UI **shadow DOM** içinde → tema CSS'i widget'ı bozamaz, widget da temayı bozamaz.

- `index.ts` — `document.currentScript`'ten `data-rush-key` oku, `transport/config.ts` ile `/api/public/config?key=` çek (sessionStorage'da 60 sn cache), her kampanya için renderer'ı registry'den bul.
- `context/ikas.ts` — tek köprü modülü:
  - `subscribeCart()` — parse anında `window.IkasEvents.subscribe({ id: 'rush', callback })`; `ADD_TO_CART/REMOVE_FROM_CART/VIEW_CART` payload'larından cart snapshot'ını günceller.
  - `hydrateCart()` — açılışta `localStorage.cartId` → SF GraphQL `getCartById`; başarısızsa sessizce boş sepetle devam (asla hata fırlatmaz).
  - `addToCart(variantId, qty)` — `window.addToCart` yoksa `waitFor` ile en fazla 5 sn poll, sonra ürün sayfasına fallback.
  - `getPageType()` — URL desenine göre `home|product|collection|cart|other`.
  - `getCurrency()` — `<html lang>` + config payload'ındaki routing bilgisi.
- `render/` — hepsi ayrı, saf DOM fonksiyonları:
  - `shadow-host.ts` — host element + shadow root + stil enjeksiyonu
  - `styles.ts` — CSS string, tüm renkler CSS custom property (`--rush-accent` vb.) → appearance ayarları buradan beslenir
  - `sticky-tab.ts` — sol/sağ/alt-orta konumlandırma, dikey yazı, ikon
  - `panel.ts` — açılır panel, focus trap, ESC, dışarı tıklama, `prefers-reduced-motion` saygısı
  - `countdown.ts` — **tek bir `requestAnimationFrame` döngüsü, `useRef` benzeri mutable ref ile DOM'a doğrudan yazar**; saniyede bir yeniden render yok
  - `product-card.ts` — görsel, ad, üstü çizili fiyat + fırsat fiyatı
  - `variant-picker.ts` — yalnızca kampanyada birden fazla varyant seçiliyse render edilir; swatch/select
  - `cta.ts` — sepete ekle / ürüne git (option set varsa), loading + success + error durumları
- `rules/` — Faz 2'deki `evaluate.ts`'i **import eder** (kopyalanmaz)
- `transport/events.ts` — event kuyruğu; `navigator.sendBeacon` ile 2 sn'de bir veya `visibilitychange`'de flush; `sendBeacon` yoksa `fetch(keepalive: true)`

**UX detayları:** IntersectionObserver ile impression (tab görünür olduğunda, bir kez); `localStorage` ile "kapatıldı" durumu (kampanya id + gün bazlı); sepete ekleme sonrası panel içi başarı durumu + 2 sn sonra otomatik kapanma; ilk render `requestIdleCallback` içinde → LCP'ye dokunmaz.

**Doğrulama:** dev store storefront'unda tab'ı gör, aç, sepete ekle, ikas sepetinde ürünün doğru fiyatla olduğunu doğrula; console'da hata olmadığını kontrol et.

---

### Widget tasarım spesifikasyonu (paylaşılan görsele göre)

Referans görseldeki dil birebir hedefleniyor: **beyaz kart, keskin siyah aksan, sıfır dekorasyon.** Ölçüler CSS custom property olarak tanımlanır ki appearance ayarları tek noktadan beslesin.

**Yerleşim (mount) stratejisi — net karar**
- Widget sayfanın **belirli bir DOM noktasına append edilmez.** `document.body`'nin sonuna tek bir host element eklenir ve `position: fixed` ile viewport'a sabitlenir.
- Konum: **ekranın sağ ortası veya sol ortası** (dikey ortalanmış, kenara yapışık). Kampanya ayarından seçilir, varsayılan sol.
- **Özel CSS seçici ile hedefe yerleştirme (inline/gömülü mod) şu an kapsam dışı.** Ancak mimari buna hazır tutulacak: `MountTarget = { mode: 'fixed', side: 'left' | 'right' } | { mode: 'selector', selector: string, position: 'before' | 'after' | 'append' }` tipi baştan tanımlanır, `render/shadow-host.ts` tek bir `resolveMountTarget()` fonksiyonundan geçer. İleride `selector` modu eklemek = bu fonksiyona bir dal + form'a bir input; başka hiçbir yere dokunulmaz.
- Tasarım **kesin değil, iterasyona açık.** Görsel referans başlangıç noktası; açılır/kapanır davranış korunmak kaydıyla panel içeriğinin düzeni ve stili geliştirme sırasında değişebilir. Bu yüzden tüm ölçü/renk/köşe değerleri CSS custom property olarak tek bir `styles.ts`'te toplanır ve her parça (`sticky-tab`, `panel`, `countdown`, `product-card`, `cta`) ayrı dosyada durur — biri değiştiğinde diğerleri etkilenmez.

**Kapalı durum — sticky sekme**
- Konum: viewport'a `position: fixed`, dikey ortalanmış (`top: 50%; transform: translateY(-50%)`), sol veya sağ kenara yapışık. Konum kampanya ayarından gelir.
- Görünüm: siyah (`--rush-accent`, varsayılan `#0A0A0A`) dikey şerit; dış köşeleri yuvarlak (`border-radius: 0 12px 12px 0` — sağ konumda ayna).
- İçerik: üstte saat ikonu (inline SVG, 16px), altında `writing-mode: vertical-rl` ile büyük harf, `letter-spacing: .08em`, 11px sekme etiketi ("FIRSAT ÜRÜN").
- Genişlik ~34px, dikey padding 18px. Hover'da 2px dışa kayma (`translateX`), 160ms ease.
- Kampanya bitmişse veya kural sağlanmıyorsa hiç render edilmez (gizlenmez — DOM'a girmez).

**Açık durum — panel**
- Sekmeye bitişik açılır; sekme yerinde kalır, panel yanından `translateX(-8px) + opacity` ile 200ms'de girer. `prefers-reduced-motion` varsa animasyon yok.
- Kart: beyaz, `border-radius: 16px`, `box-shadow: 0 8px 32px rgba(0,0,0,.12)`, genişlik 340px (mobilde `calc(100vw - 32px)`, maks 360px), padding 20px.
- Sağ üstte 16px `×` kapatma butonu, `aria-label="Kapat"`, gri (`#9CA3AF`), hover'da siyah.

**Panel iç düzeni (yukarıdan aşağı)**
1. **Başlık** — 16px, 600 ağırlık, siyah. Metin kampanyadan (`headline`), emoji merchant'ın yazdığı gibi geçer: "Fırsat Ürün! 🎁⏰"
2. **Alt metin** — 13px, `#8A8A8A`. "Sınırlı süre için özel fiyat."
3. **Geri sayım bloğu** — açık gri kutu (`#F5F5F5`, `border-radius: 12px`, padding 12px), tek satır flex:
   - Solda 12px gri etiket: "Fırsatın bitmesine"
   - Sağda 3 adet siyah kare (`36×36`, `border-radius: 8px`), beyaz 14px tabular-nums rakam: saat / dakika / saniye. 24 saatten uzun süre kaldıysa gün/saat/dakika'ya döner.
   - Rakamlar `requestAnimationFrame` döngüsünde doğrudan `textContent` ile yazılır; saniye değişmedikçe DOM'a dokunulmaz.
   - Süre bittiğinde panel "Fırsat sona erdi" durumuna geçer ve 3 sn sonra widget tamamen kaldırılır.
4. **Ürün kartı** — açık gri arkaplan (`#F5F5F5`, `border-radius: 12px`, padding 12px), yatay flex:
   - Solda 64×64 ürün görseli, `border-radius: 8px`, `object-fit: cover`
   - Sağda: ürün adı (13px, 600, en fazla 2 satır `-webkit-line-clamp`), altında fiyat satırı — üstü çizili eski fiyat (12px, `#9CA3AF`, `text-decoration: line-through`) + fırsat fiyatı (15px, 700, siyah)
5. **Varyant seçici** — yalnızca kampanyada 1'den fazla varyant seçildiyse render edilir. Renk varyantı ise swatch (28px yuvarlak, seçili olanda 2px siyah halka); diğerleri için yatay kaydırılabilir pill listesi. Stokta olmayan varyant üstü çizili ve pasif. Seçim değişince ürün görseli, fiyat ve stok anında güncellenir.
6. **CTA** — tam genişlik, 48px yükseklik, siyah zemin/beyaz metin, `border-radius: 10px`, büyük harf 13px `letter-spacing: .06em`: "SEPETE EKLE". Durumlar:
   - `idle` → normal
   - `loading` → metin yerine 3 noktalı inline spinner, buton pasif
   - `success` → yeşil onay ikonu + "Sepete eklendi", 2 sn sonra panel otomatik kapanır
   - `error` → buton altında 12px kırmızı hata metni (ikas'ın `validationError`'ı çevrilerek)
   - Ürünün option set'i varsa buton metni **"ÜRÜNE GİT"** olur ve ürün sayfasına yönlendirir; stok yoksa "TÜKENDİ" ve pasif.

**Ayarlanabilir (appearance)**: konum (sol/sağ), accent renk, köşe yuvarlaklığı (0/8/16px), sekme etiketi, ikon (saat/hediye/şimşek/yok), açılışta otomatik açık gelsin mi (ve kaç saniye sonra).

**Teknik kurallar**: tüm bu ağaç shadow DOM içinde; dışarıdan tek bir CSS kuralı sızamaz. `z-index: 2147483000` (tema modal'larının altında kalmamak için) ama `<dialog>` kullanılmaz — bazı temalarda çakışıyor. Toplam DOM ~25 element. Görseller `loading="lazy"`, panel ilk açılışta lazy-mount edilir (kapalıyken sadece sekme DOM'da).

---

## Faz 5 — Önizleme

**Dosyalar:** `src/components/preview/*`, `src/app/preview/page.tsx`

**Anahtar karar: önizleme, production widget bundle'ının ta kendisini çalıştırır.** Sahte bir React kopyası yazılmaz — yoksa önizleme ile canlı davranış kaçınılmaz olarak ayrışır.

- `/preview` — dashboard'dan `<iframe>` ile yüklenen minimal, `sandbox="allow-scripts"` bir sayfa. Sahte bir mağaza arkaplanı (nötr gri iskelet) render eder ve `public/rush.js`'i yükler.
- Iframe içinde `window.addToCart` **stub**lanır: gerçek çağrı yapmaz, sahte cart state'i günceller ve `postMessage` ile parent'a bildirir. Aynı şekilde `window.IkasEvents` stub'ı da kurulur → kural motoru gerçek koşullarda test edilebilir.
- Editördeki form her değiştiğinde parent `iframe.contentWindow.postMessage({ type: 'rush:preview', campaign })` gönderir; widget'ta `transport/config.ts` "preview mode"da fetch yerine bu mesajı dinler. Debounce 150 ms.
- Önizleme kontrolleri (form'un yanında): cihaz (desktop/mobile genişliği), sahte sepet tutarı, sahte sepet içeriği, giriş yapmış mı → bunlar iframe'e context olarak gönderilir, **kural motoru canlıda ne yapacaksa önizlemede de aynısını yapar.**

**Doğrulama:** editörde fırsat fiyatını/geri sayımı/konumu değiştir → iframe anında güncellensin; sahte sepet tutarını eşiğin altına düşür → widget kaybolsun.

---

## Faz 6 — Script kurulumu, kaldırma, webhook

**Dosyalar:** `src/app/api/ikas/script/route.ts`, `src/app/api/webhooks/ikas/route.ts`, `src/lib/storefront-script.ts`

- **Kur:** `listStorefront` → her storefront için `createStorefrontJSScript({ name: 'Rush', storefrontId, contentType: SCRIPT, isHighPriority: false, scriptContent: '<script src="{deployUrl}/rush.js?v={hash}" data-rush-key="{publicKey}" defer></script>' })` → dönen `id`'yi `StorefrontScript` tablosuna yaz.
- **Güncelle:** kayıt varsa `updateStorefrontJSScript` (idempotent; `v={hash}` cache-bust için).
- **Kaldır:** v2 `deleteStorefrontJSScript` şemada **argümansız** görünüyor (muhtemel şema hatası). Bu yüzden kaldırma stratejisi: önce `updateStorefrontJSScript` ile `scriptContent`'i boş bir yorum satırına indir (garantili, geri döndürülebilir), sonra best-effort `deleteStorefrontJSScript` dene ve hatayı yut. Yerel kaydı `deleted: true` yap.
- **Webhook:** `saveWebhooks` ile app uninstall scope'una abone ol; `/api/webhooks/ikas` → script'i devre dışı bırak, kampanyaları `ENDED` yap, ilgili ikas Campaign'leri `deleteCampaignList` ile sil, `AuthTokenManager.delete`.
- **Settings sayfası:** kurulu storefront listesi, script durumu (kurulu/eksik/güncel değil), "Yeniden kur" ve "Kaldır" butonları, eksik scope banner'ı.

**Doğrulama:** storefront'un HTML kaynağında `<head>` içinde `rush.js` etiketini gör; kaldır → kaybolsun; appi ikas panelinden kaldır → webhook'un düştüğünü ve kayıtların temizlendiğini gör.

---

## Faz 7 — Kampanya editörü UI

**Dosyalar:** `src/app/dashboard/page.tsx`, `src/app/dashboard/campaigns/[id]/page.tsx`, `src/components/campaign/*`

Tasarım dili: **aşırı minimalist** — bol beyaz alan, tek accent renk, ince ayraçlar, ikon minimum, gölge yok/az. shadcn (`radix-mira`, stone) mevcut temayla uyumlu; eksik bileşenler shadcn MCP ile eklenir: `form, select, switch, tabs, popover, command, badge, separator, skeleton, sonner, slider, radio-group, tooltip`.

Editör iki sütun: solda form, sağda yapışkan önizleme.

Form parçaları — **her biri ayrı dosya, tek bir dev form bileşeni yok:**
- `campaign-form.tsx` — sadece `react-hook-form` + zod resolver orkestrasyonu (registry'den gelen şema ile)
- `sections/basics-section.tsx` — ad, durum
- `sections/product-section.tsx` — ürün arayıcı (`command` + debounce, `useRef` ile abort controller), seçili ürün kartı, varyant seçici (renk varyantı gibi **belirli varyantları** seçme), option set uyarısı
- `sections/pricing-section.tsx` — fırsat fiyatı, indirim yüzdesi göstergesi, "sepette şu kampanya oluşacak" özeti
- `sections/countdown-section.tsx` — sabit bitiş / oturum başına süre
- `sections/content-section.tsx` — başlık, alt metin, CTA metni, sekme etiketi
- `sections/appearance-section.tsx` — konum (sol/sağ/alt), accent renk, köşe yuvarlaklığı
- `sections/rules-section.tsx` — kural listesi; `rule-row.tsx` + kural tipi başına küçük editör bileşenleri
- `campaign-actions.tsx` — kaydet / yayınla / duraklat / sil
- `hooks/use-campaign-form.ts` — form state + otomatik kaydetme (debounce'lu, `useRef` ile son gönderilen payload karşılaştırması)
- `hooks/use-preview-bridge.ts` — iframe'e `postMessage` gönderen tek `useEffect`; iframe ref `useRef`'te

**Performans kuralı:** `useEffect` yalnızca gerçek dış-dünya senkronizasyonu için (token init, `closeLoader`, preview postMessage, abort). Türetilebilen her şey render sırasında hesaplanır; geri sayım/preview gibi yüksek frekanslı şeyler state değil ref üzerinden DOM'a yazar.

**Kod stili:** yorum satırı yok (mevcut starter dosyalarındaki JSDoc'lar yeni kodda tekrarlanmayacak).

---

## Faz 8 — Analytics

**Dosyalar:** `src/app/api/public/events/route.ts`, `src/models/campaign-event/manager.ts`, `src/components/campaign/stats/*`

- `POST /api/public/events` — CORS açık, `key` ile merchant çözümlenir, body zod ile doğrulanır (`{ campaignId, type, sessionId, variantId?, value? }[]`, max 20). Rate-limit: `sessionId` başına in-memory sliding window.
- Yazma anında `CampaignStat` satırı upsert edilerek sayaçlar artırılır (gün bazlı) → dashboard sorgusu tek satır okur, ham tabloyu taramaz. Ham `CampaignEvent` detay/denetim için tutulur, 30 günden eskisi lazy temizlenir.
- Dönüşüm: `ADD_TO_CART` event'i + ikas `order/created` webhook'u (varsa) eşleştirilir; MVP'de metrik = impression → open → click → add-to-cart hunisi.
- Dashboard: kampanya kartında sparkline + 4 sayı; detayda basit huni. Grafik gerekirse `dataviz` skill'i yüklenerek yapılır.

---

## Faz 9 — Cilalama

- i18n: TR/EN sözlük (`src/lib/i18n`), `AppBridgeHelper.getDashboardLanguage()` ile seçim. Widget metinleri kampanyadan gelir → widget'ta i18n gerekmez.
- Boş durumlar, skeleton'lar, `sonner` ile toast, hata sınırları.
- Erişilebilirlik: panel için `role="dialog"` + `aria-modal`, focus trap, kontrast kontrolü.
- `pnpm lint` + `tsc --noEmit` temiz.

---

## Riskler ve nasıl karşılanıyor

| Risk | Karşılık |
|---|---|
| `window.addToCart` dokümante ama sürüm garantisi zayıf | Tek köprü modülü (`context/ikas.ts`); yoksa ürün sayfasına fallback |
| Sayfa açılışında sepet okunamaması (SF GraphQL private) | `cart_total` kuralı, sepet bilgisi gelene kadar widget'ı **göstermez**; bilgi gelince gösterir. Hata durumunda kural sağlanmamış sayılır (yanlış indirim göstermektense göstermemek) |
| v2 `deleteStorefrontJSScript` argümansız | Kaldırma = önce içeriği boşalt, sonra best-effort delete |
| CDN görsel URL deseni doğrulanmadı | `buildImageUrl` tek noktada; canlı üründe doğrulanacak |
| Public uçlarda ikas imzası yok | Merchant başına public key + rate limit + sadece herkese açık veri döner |
| SQLite tek instance | Yatay ölçekleme gerektiğinde `provider` değişimi + `DATABASE_URL` (kod değişmez) |

---

## Uçtan uca doğrulama

1. `pnpm prisma:init && pnpm dev` (cloudflare tunnel ile), appi dev store'a kur → yeni scope'ların token'a yazıldığını doğrula.
2. Dashboard → yeni Fırsat Ürün kampanyası → ürün ara, tek renk varyantı seç, fırsat fiyatı gir, geri sayım kur, "sepet tutarı ≥ 500" kuralı ekle.
3. Önizlemede sahte sepet tutarını 400 → 600 yap; widget'ın kaybolup göründüğünü gör.
4. Yayınla → ikas panelinde İndirimler'de kampanyanın oluştuğunu, Storefront > Ayarlar'da script'in kurulduğunu gör.
5. Storefront'u aç → sticky sekme görünsün, aç, sepete ekle → ikas sepetinde fırsat fiyatının uygulandığını doğrula.
6. Dashboard'a dön → impression/open/click/add-to-cart sayaçlarının arttığını gör.
7. Kampanyayı duraklat → widget kaybolsun, ikas kampanyası pasifleşsin.
8. Appi kaldır → webhook ile script ve kampanyaların temizlendiğini doğrula.
