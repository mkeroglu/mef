# MEF Organizasyon

Nişan, söz ve düğün organizasyonları için sahne konsepti tanıtım + rezervasyon sitesi.
Next.js 14 (App Router) tabanlı tek uygulama: herkese açık site, çok adımlı talep formu
(fotoğraflı konsept/sehpa/çiçek/sandalye/tepsi/ekstra seçimi + tarih müsaitlik takvimi),
ve tam yönetilebilir bir admin paneli.

## Mimari

```
                        ┌────────────┐
  İnternet ── :443 ──▶  │   nginx    │  (TLS sonlandırma)
                        └─────┬──────┘
                              │ :8080 (http, iç ağ)
                        ┌─────▼──────┐        ┌────────────┐
                        │  web (Next)│──────▶ │  postgres  │
                        │            │        └────────────┘
                        │            │──────▶ ┌────────────┐
                        └────────────┘        │   redis    │
                                               └────────────┘
```

- **web**: Next.js 14 + Prisma. Herkese açık site (`/`, `/talep`, `/konseptler/*`) ve admin panel (`/admin/*`).
- **postgres**: konseptler, talepler/rezervasyonlar, seçenek grupları, ayarlar.
- **redis**: admin oturumları, talep formu rate-limit'i, konsept listesi cache'i.
- **nginx**: `certs/` altındaki sertifikayla 443 portunda TLS sonlandırır, `web`'e proxy eder.

Tüm kalıcı veri (`data/postgres`, `data/redis`) proje dizini altında **bind-mount** olarak
duruyor — Docker'ın kendi gizli volume mekanizmasında değil. Bu yüzden sunucu değişikliğinde
tek yapmanız gereken bu klasörü (ve `.env`, `certs/` dosyalarını) kopyalayıp aynı komutları
çalıştırmak.

## Gereksinimler

- Docker Engine + Docker Compose plugin (`docker compose version` ile doğrulayın)
- `openssl` (sertifika üretimi için, çoğu Linux dağıtımında hazır gelir)
- Git

RHEL/CentOS/Fedora tabanlı bir sunucuda Docker yoksa:

```bash
dnf install -y dnf-plugins-core
dnf config-manager --add-repo https://download.docker.com/linux/rhel/docker-ce.repo
dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker
```

## Sıfırdan Kurulum

### 1. Depoyu klonlayın

```bash
git clone git@github.com:mkeroglu/mef.git
cd mef
```

### 2. `.env` dosyasını oluşturun

```bash
cp .env.example .env
```

`.env` içindeki değerleri düzenleyin:

| Değişken | Açıklama |
|---|---|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Veritabanı kimlik bilgileri, kendiniz belirleyin |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | İlk admin girişi (sadece veritabanı boşken kullanılır — panelden şifre değiştirebilirsiniz, seed script bunu bir daha ezmez) |
| `SETTINGS_ENCRYPTION_KEY` | SMTP şifresini veritabanında şifrelemek için kullanılan anahtar. Aşağıdaki komutla üretin: |

```bash
openssl rand -hex 32
```

Çıkan değeri `SETTINGS_ENCRYPTION_KEY` olarak yapıştırın. **Bu anahtarı bir yere not edin** —
kaybederseniz admin panelden kaydedilmiş SMTP şifresi çözülemez hale gelir (yeniden girmeniz gerekir).

`WEB_PORT` (varsayılan 8081) ve `HTTPS_PORT` (varsayılan 443) sunucuda zaten kullanılan bir
portla çakışıyorsa değiştirin — kontrol etmek için: `ss -tln`.

### 3. TLS sertifikası üretin (self-signed)

Gerçek bir sertifikanız yoksa (Let's Encrypt vb.) geçici bir self-signed sertifika üretin:

```bash
mkdir -p certs
openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout certs/privkey.pem \
  -out certs/fullchain.pem \
  -days 3650 \
  -subj "/C=TR/ST=Ankara/L=Ankara/O=MEF Organizasyon/CN=DOMAIN_ADINIZ" \
  -addext "subjectAltName=DNS:DOMAIN_ADINIZ,DNS:www.DOMAIN_ADINIZ"
```

`DOMAIN_ADINIZ` yerine sitenin erişileceği domain'i yazın (örn. `meforganizasyon.com.tr`).
Domain yoksa sunucu hostname'i veya `localhost` da olur.

Sertifikayı `nginx/default.conf` içindeki `server_name` ile eşleştirmeyi unutmayın.

> Gerçek bir sertifikanız olduğunda (certbot/Let's Encrypt vb.) `certs/fullchain.pem` ve
> `certs/privkey.pem` dosyalarını **aynı isimlerle** üzerine yazmanız yeterli, başka bir
> değişiklik gerekmez.

### 4. İmajları build edin

```bash
docker compose build
```

### 5. Veritabanı ve cache'i başlatın

```bash
docker compose up -d postgres redis
```

### 6. Şemayı oluşturun ve örnek veriyi (5 konsept, 8 seçenek grubu, admin kullanıcı) yükleyin

```bash
docker compose --profile tools run --rm migrate
```

Bu komutu **kod değişikliği sonrası şema güncellendiğinde** de tekrar çalıştırmanız gerekir
(veriyi silmez, sadece şemayı senkronize eder ve eksik varsayılan kayıtları ekler).

### 7. Web ve nginx'i başlatın

```bash
docker compose up -d web nginx
```

### 8. Doğrulayın

```bash
curl -sk https://localhost/api/health
# {"status":"ok"}
```

Tarayıcıda `https://<sunucu-adresi>` adresine gidin (self-signed sertifika için "Gelişmiş >
Yine de devam et" gerekebilir). Admin paneline `https://<sunucu-adresi>/admin/login` adresinden
`.env`'deki `ADMIN_EMAIL` / `ADMIN_PASSWORD` ile giriş yapın.

## Admin Panelinden Yapılabilenler

- **Talepler** (`/admin/dashboard`): gelen talepleri onayla/reddet, her talebin detayına gir
  (`/admin/requests/[id]`), müşteriye WhatsApp'tan doğrudan yaz.
- **Takvim** (`/admin/bookings`): onaylanmış/tahsis edilmiş tarih-konsept eşleşmeleri.
- **Konseptler** (`/admin/concepts`): yeni konsept ekle, mevcut olanları düzenle, görsel yükle,
  yayından kaldır.
- **Seçenekler** (`/admin/options`): sehpa/çiçek/sandalye/neon yazı/tepsi/ekstra gibi talep
  formundaki seçim gruplarını ve fotoğraflarını yönet — yeni grup/seçenek eklemek koda
  dokunmayı gerektirmez.
- **Ayarlar** (`/admin/settings`): SMTP (Gmail App Password ile e-posta bildirimleri), admin
  bildirim ve müşteri onay e-postası şablonları, WhatsApp işletme numarası, admin şifre
  değiştirme.

## Sık Kullanılan Komutlar

```bash
# Servis durumunu gör
docker compose ps

# Canlı logları izle
docker compose logs -f web

# Kod değişikliğinden sonra yeniden derle ve devreye al
docker compose build web
docker compose up -d web

# Şema değiştiyse migration'ı tekrar çalıştır
docker compose build migrate
docker compose --profile tools run --rm migrate

# Servisleri durdur (veri silinmez)
docker compose down

# Postgres'e doğrudan bağlan
docker compose exec postgres psql -U $POSTGRES_USER -d $POSTGRES_DB
```

## Yedekleme

Veritabanını yedeklemek için:

```bash
docker compose exec -T postgres pg_dump -U $POSTGRES_USER -d $POSTGRES_DB > yedek.sql
```

Geri yüklemek için (önce şemayı temizlemeniz gerekir):

```bash
docker compose exec -T postgres psql -U $POSTGRES_USER -d $POSTGRES_DB \
  -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
docker compose exec -T postgres psql -U $POSTGRES_USER -d $POSTGRES_DB < yedek.sql
```

> Şu an otomatik/zamanlanmış bir yedekleme yok — `data/postgres` bu sunucuda tek kopya olarak
> duruyor. Kritik veri biriktikçe düzenli (örn. günlük cron ile) bir yedekleme eklenmesi önerilir.

## Başka Bir Sunucuya Taşıma

1. Bu klasörün tamamını (`data/` ve `certs/` dahil) hedef sunucuya kopyalayın — `.env` git'e
   girmediği için onu da elle taşıyın.
2. Hedef sunucuda Docker kurulu değilse yukarıdaki adımlarla kurun.
3. `docker compose build && docker compose up -d` — veri zaten `data/` içinde geldiği için
   `migrate` adımını tekrar çalıştırmanıza gerek yok (isterseniz zararsızca yine çalıştırabilirsiniz).

## Notlar

- **HTTPS zorunlu değişken**: `.env` içindeki `COOKIE_SECURE=true` olmalı, aksi halde admin
  girişi HTTPS üzerinde çalışmaz (secure cookie tarayıcıya geri gönderilmez). nginx TLS
  önünde çalıştığı sürece bu `true` kalmalı.
- **Port çakışması**: nginx sadece `HTTPS_PORT` (443) açar, 80'i kullanmaz — sunucuda başka
  bir servis 80'i kullanıyorsa bu tasarlanmış bir durumdur, http→https otomatik yönlendirme
  yoktur.
- `openshift/` klasörü, projenin önceki OpenShift dağıtımından kalan referans manifestleridir;
  artık aktif olarak kullanılmıyor (Docker Compose'a geçildi).
- `talep-resimleri/` klasörü, admin panelden yüklenen seçenek fotoğraflarının ham kaynak
  dosyalarıdır, uygulama tarafından kullanılmaz.
