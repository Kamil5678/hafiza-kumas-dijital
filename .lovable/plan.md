
# Yol Haritası — Tekstil Hafızam Genişletme

Mevcut çalışan yapıyı bozmadan, dört küçük fazda ilerleyeceğim. Her faz kendi başına çalışır ve bir sonrakine geçmeden onayını isteyeceğim. Tek mesajda hepsini yapmak sistemi kırar; bu yüzden bilinçli olarak bölüyorum.

---

## Faz 1 — Kategori mimarisi (temel)

Diğer her şey buna dayandığı için önce bunu sağlam kurmak gerekiyor.

- `src/lib/tekstil-store.ts` içinde kategori modelini iki katmanlı hale getir: **ana kategori** + **alt kategori** (opsiyonel). Eski `category` alanı korunur, üstüne `subcategory?: string` eklenir. Eski notlar bozulmaz.
- Ana kategoriler: **Tekstil Bilgileri**, **Moda Bilgileri**, **İç Giyim Araştırmaları**, **Strateji**, **İstatistik**, **Elisé Brand Studio**.
- Her ana kategori için alt başlık listesi (senin verdiğin liste) sabit bir sözlük olarak tanımlanır.
- `SiteHeader` güncellenir: "Kumaş Yapıları" → "Tekstil Bilgileri". Diğer ana kategoriler eklenir.
- Kategori sayfası şablonu (`/kategori/$slug`) alt kategori sekmeleri, arama, filtre, son notlar ve hızlı not ekle butonuyla yeniden düzenlenir. Tasarım aynı editoryal dilde, sade kalır.
- `EntryForm` alt kategori seçici ekler (ana kategoriye göre dinamik).

Bu fazın sonunda: hiçbir eski not kaybolmaz, tüm sayfalar çalışır, sadece yapı zenginleşir.

## Faz 2 — Akıllı PDF Kütüphanesi

Faz 1 onaylandıktan sonra.

- Yeni sayfa `/pdf-kutuphanesi` (mevcut `/pdf` "kitap hazırla" sayfası korunur, ayrı kalır).
- PDF yükleme: tarayıcıda `pdfjs-dist` ile metin çıkarma (backend gerekmez, gizlilik için iyi).
- Metin çıktısı Lovable AI Gateway'e (`google/gemini-3-flash-preview`) gönderilir — sunucu tarafında server function ile, `LOVABLE_API_KEY` asla ön yüzde değil.
- AI şunları döner: 3 cümlelik özet, anahtar kelimeler, önerilen ana kategori + alt kategori, kaynak sayfa aralığı.
- **Önizleme + onay ekranı**: kullanıcı özet, kategori önerisi, anahtar kelimeleri düzenleyebilir. Onaylamadan hiçbir şey kaydedilmez.
- Onaylanan not `Entry` olarak store'a eklenir; ayrıca PDF dosyası (data URL veya IndexedDB) saklanır ve nota `pdfId` ile bağlanır. Not kartında "Kaynak PDF'i aç" bağlantısı.

## Faz 3 — AI Asistan (güvenli, basit sürüm)

Faz 2 onaylandıktan sonra.

- Yeni sayfa `/ai-asistan`. Sohbet arayüzü (mesajlar `parts` üzerinden render, markdown destekli).
- Server function `chat` — Lovable AI Gateway, `google/gemini-3-flash-preview`. API anahtarı yalnızca sunucuda.
- Bağlam: kullanıcının tüm notları + PDF özetleri sistem promptuna gömülür (ilk sürüm; ileride embeddings). Cevap sonunda "Kaynaklar" listesi (hangi not/PDF kullanıldı).
- Hızlı eylem butonları: **Basit anlat**, **Teknik anlat**, **Quiz oluştur**, **Flashcard üret**, **Elisé ile ilişkilendir** — her biri promptu genişleten şablonlar.
- Sohbet geçmişi localStorage'da (tek konuşma, "Yeni konuşma" butonu ile temizlenir). Kullanıcı istemedikçe kalıcı DB yok.

## Faz 4 — Başlangıç Bilgi Paketi Oluşturucu (MVP)

Faz 3 onaylandıktan sonra.

- `/ai-asistan` içinde ya da ayrı `/baslangic-paketi` sayfasında "Başlangıç paketi oluştur" butonu.
- Adım 1: kullanıcı 10 / 25 / 50 / 100 konu seçer + ana kategori seçer.
- Adım 2: AI konu listesi üretir → kullanıcı onayı.
- Adım 3: AI her konu için taslak kart üretir (başlık, 3 cümlelik özet, anahtar kelimeler, önerilen alt kategori). İnternetten kaynak çekilmez, AI kendi genel bilgisiyle.
- Kartlar **Taslaklar** alanına düşer, her birinde **"AI taslağı"** rozeti. Otomatik kaydetme YOK.
- Kullanıcı tek tek düzenleyip kaydedebilir veya "Seçilenleri kaydet" ile toplu kaydeder.

---

## Teknik notlar (kısa)

- Kategori sözlüğü tek dosyada (`src/lib/categories.ts`), tüm sayfalar oradan okur.
- Tasarım tokenları (`clay`, `sage`, `paper`, `ink`) zaten uygun — şarap/bordo için ek bir accent token eklerim, hardcode renk yok.
- AI çağrıları için server function pattern (TanStack `createServerFn`) + `ai-sdk-lovable-gateway` sarmalayıcısı. `LOVABLE_API_KEY` gerekirse otomatik provizyonlanır.
- Her fazın sonunda: build yeşil, mevcut sayfalar çalışır, geri alınabilir.

---

## Öneri

Şu an sadece **Faz 1**'i uygulayayım. Onayladıktan sonra Faz 2'ye geçeriz. Tek seferde hepsini yaparsam yapıyı bozma riski çok yüksek — sen de bunu belirtmişsin.

Faz 1 ile başlamamı onaylıyor musun, yoksa fazlarda değişiklik ister misin?
