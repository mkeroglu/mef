# MEF Organizasyon

Nişan, söz ve düğün organizasyonları için sahne konsepti tanıtım + rezervasyon sitesi.
Next.js 14 (App Router) tabanlı tek uygulama: herkese açık site, çok adımlı talep formu
(fotoğraflı konsept/sehpa/çiçek/sandalye/tepsi/ekstra seçimi + tarih müsaitlik takvimi),
ve tam yönetilebilir bir admin paneli.

Veritabanı **MySQL** (Prisma ORM). Redis kullanılmıyor — admin oturumları imzalı çerezle
(HMAC), rate-limit bellek içi bir sayaçla çözülüyor; bu sayede uygulama hem Docker'la hem de
Redis desteklemeyen **paylaşımlı hosting** (cPanel Node.js Selector) üzerinde çalışabiliyor.

Bu depo iki farklı dağıtım yöntemini destekliyor:

1. **Docker Compose** — kendi sunucunuzda (VPS/bulut), root erişiminiz varsa.
2. **cPanel Node.js Selector** — paylaşımlı hosting'te, root/Docker olmadan.

## Mimari (Docker Compose)

```
                        ┌────────────┐
  İnternet ── :443 ──▶  │   nginx    │  (TLS sonlandırma)
                        └─────┬──────┘
                              │ :8080 (http, iç ağ)
                        ┌─────▼──────┐        ┌────────────┐
                        │  web (Next)│──────▶ │   mysql    │
                        └────────────┘        └────────────┘
```

- **web**: Next.js 14 + Prisma. Herkese açık site (`/`, `/talep`, `/konseptler/*`) ve admin panel (`/admin/*`).
- **mysql**: konseptler, talepler/rezervasyonlar, seçenek grupları, ayarlar — tek veri deposu.
- **nginx**: `certs/` altındaki sertifikayla 443 portunda TLS sonlandırır, `web`'e proxy eder.

Tüm kalıcı veri (`data/mysql`) proje dizini altında **bind-mount** olarak duruyor —
Docker'ın kendi gizli volume mekanizmasında değil. Sunucu değişikliğinde tek yapmanız gereken
bu klasörü (ve `.env`, `certs/` dosyalarını) kopyalayıp aynı komutları çalıştırmak.

---

## Yöntem 1: Docker Compose (kendi sunucunuz)

### Gereksinimler

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
| `MYSQL_ROOT_PASSWORD` / `MYSQL_USER` / `MYSQL_PASSWORD` / `MYSQL_DATABASE` | Veritabanı kimlik bilgileri, kendiniz belirleyin |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | İlk admin girişi (sadece veritabanı boşken kullanılır — panelden şifre değiştirebilirsiniz, seed script bunu bir daha ezmez) |
| `SETTINGS_ENCRYPTION_KEY` | SMTP şifresini veritabanında şifrelemek için kullanılan anahtar |
| `SESSION_SECRET` | Admin oturum çerezini imzalamak için kullanılan anahtar |

İkisini de aşağıdaki komutla üretin (her biri için ayrı ayrı çalıştırın, **birbirinden farklı** olmalı):

```bash
openssl rand -hex 32
```

**Bu iki anahtarı bir yere not edin** — `SETTINGS_ENCRYPTION_KEY`'i kaybederseniz kayıtlı SMTP
şifresi çözülemez hale gelir; `SESSION_SECRET`'i değiştirirseniz mevcut admin oturumları geçersiz
kalır (yeniden giriş gerekir, veri kaybı olmaz).

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
Domain yoksa sunucu hostname'i veya `localhost` da olur. Sertifikayı `nginx/default.conf`
içindeki `server_name` ile eşleştirmeyi unutmayın.

> Gerçek bir sertifikanız olduğunda (certbot/Let's Encrypt vb.) `certs/fullchain.pem` ve
> `certs/privkey.pem` dosyalarını **aynı isimlerle** üzerine yazmanız yeterli, başka bir
> değişiklik gerekmez.

### 4. İmajları build edin

```bash
docker compose build
```

### 5. Veritabanını başlatın

```bash
docker compose up -d mysql
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

### Sık Kullanılan Komutlar

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

# MySQL'e doğrudan bağlan
docker compose exec mysql mysql --default-character-set=utf8mb4 -u $MYSQL_USER -p $MYSQL_DATABASE
```

> `mysql` CLI'a bağlanırken `--default-character-set=utf8mb4` vermezseniz Türkçe karakterler
> terminalde bozuk görünür — bu sadece görüntüleme sorunudur, veritabanındaki veri her zaman
> doğru (utf8mb4) saklanır.

### Yedekleme

```bash
docker compose exec mysql mysqldump --default-character-set=utf8mb4 -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE > yedek.sql
```

Geri yüklemek için:

```bash
docker compose exec -T mysql mysql --default-character-set=utf8mb4 -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE < yedek.sql
```

> Şu an otomatik/zamanlanmış bir yedekleme yok — `data/mysql` bu sunucuda tek kopya olarak
> duruyor. Kritik veri biriktikçe düzenli (örn. günlük cron ile) bir yedekleme eklenmesi önerilir.

### Başka Bir Sunucuya Taşıma

1. Bu klasörün tamamını (`data/` ve `certs/` dahil) hedef sunucuya kopyalayın — `.env` git'e
   girmediği için onu da elle taşıyın.
2. Hedef sunucuda Docker kurulu değilse yukarıdaki adımlarla kurun.
3. `docker compose build && docker compose up -d` — veri zaten `data/` içinde geldiği için
   `migrate` adımını tekrar çalıştırmanıza gerek yok (isterseniz zararsızca yine çalıştırabilirsiniz).

---

## Yöntem 2: cPanel Node.js Selector (Paylaşımlı Hosting)

Docker/root gerektirmez. cPanel'de **CloudLinux Node.js Selector** özelliği açık olmalı
(cPanel arama kutusuna "node" yazınca "Setup Node.js App" çıkıyorsa vardır). SSH/Terminal
erişimi gerekir (npm install çalıştırmak için).

### 1. MySQL veritabanı ve kullanıcı oluşturun

cPanel → **MySQL® Databases**'ten:
- Yeni bir veritabanı oluşturun (örn. `kullanici_mef`)
- Yeni bir kullanıcı oluşturun, veritabanına **All Privileges** ile ekleyin
- Veritabanının karakter setinin **utf8mb4** olduğundan emin olun (Türkçe karakterler için şart) —
  cPanel'in "MySQL Databases" sayfasında bunu değiştiremiyorsanız, **phpMyAdmin**'den
  veritabanına girip: `ALTER DATABASE kullanici_mef CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`

### 2. Node.js App'i oluşturun

cPanel → **Setup Node.js App** → **Create Application**:
- **Node.js version**: 22.x (mevcutsa) veya en yeni 20.x
- **Application mode**: Production
- **Application root**: örn. `mef-app` (public_html'in **dışında** bir klasör, cPanel otomatik oluşturur)
- **Application URL**: domaininiz (örn. `meforganizasyon.com.tr`) veya bir alt domain
- **Application startup file**: `server.js`

Oluşturunca cPanel size bir "Enter to the virtual environment" komutu verir, örn:

```bash
source /home/KULLANICI/nodevenv/mef-app/22/bin/activate && cd /home/KULLANICI/mef-app
```

### 3. Kodu sunucuya alın

SSH'tan bağlanıp application root'a girin ve depoyu klonlayın (veya cPanel Git Version
Control özelliğini kullanın):

```bash
cd ~/mef-app
git clone git@github.com:mkeroglu/mef.git .
# repo kökünde app/ klasörü var; Application root'un içeriği doğrudan app/ olmalı:
mv app/* app/.* . 2>/dev/null; rmdir app
```

> Alternatif: sadece `app/` klasörünün içeriğini (kod, `prisma/`, `server.js`, `package.json`)
> SFTP/File Manager ile Application root'a yükleyin — `data/`, `certs/`, `nginx/`,
> `docker-compose.yml`, `openshift/` bu yöntemde gereksizdir.

### 4. Bağımlılıkları kurun ve build edin

cPanel'in verdiği "activate" komutunu çalıştırdıktan sonra (virtualenv'e girmiş olun):

```bash
npm install
```

`.env` yerine cPanel Node.js App ekranındaki **"Environment Variables"** bölümüne şunları ekleyin:

| Değişken | Değer |
|---|---|
| `DATABASE_URL` | `mysql://KULLANICI_DBUSER:SIFRE@localhost:3306/KULLANICI_DBNAME` |
| `ADMIN_EMAIL` | admin giriş e-postası |
| `ADMIN_PASSWORD` | admin giriş şifresi (ilk kurulumda) |
| `SETTINGS_ENCRYPTION_KEY` | `openssl rand -hex 32` çıktısı |
| `SESSION_SECRET` | `openssl rand -hex 32` çıktısı (farklı bir değer) |
| `COOKIE_SECURE` | `true` (cPanel domain'i zaten SSL ile geliyorsa) |
| `NODE_ENV` | `production` |

Değişkenleri kaydedip build edin (hâlâ virtualenv aktifken, app root'ta):

```bash
npm run build
```

### 5. Veritabanı şemasını oluşturun

```bash
./node_modules/.bin/prisma db push --accept-data-loss
./node_modules/.bin/tsx prisma/seed.ts
```

(`ADMIN_EMAIL`/`ADMIN_PASSWORD` ortam değişkenleri seed için de kullanılır — cPanel panelinden
kaydettiyseniz otomatik alınır; almıyorsa komutun önüne `ADMIN_EMAIL=... ADMIN_PASSWORD=...` ekleyin.)

### 6. Uygulamayı başlatın/yeniden başlatın

cPanel → **Setup Node.js App** → uygulamanızın yanındaki **Restart** butonu. Passenger,
`server.js`'i kendi atadığı `PORT` ile çalıştırır ve domaininize gelen istekleri ona yönlendirir.

### 7. Doğrulayın

`https://domaininiz.com/api/health` → `{"status":"ok"}` dönmeli.

### cPanel'de Notlar

- **SSL**: cPanel'in **AutoSSL** özelliği genelde otomatik ücretsiz sertifika sağlar (Let's
  Encrypt/Sectigo) — ayrıca sertifika üretmenize gerek yok, `certs/` klasörü bu yöntemde
  kullanılmıyor.
- **Kod güncellemesi**: `git pull` (veya yeniden yükleme) → `npm install` (bağımlılık değiştiyse)
  → `npm run build` → cPanel'den **Restart**.
- **Şema güncellemesi**: kod değişikliğiyle `prisma/schema.prisma` değiştiyse tekrar
  `./node_modules/.bin/prisma db push --accept-data-loss` çalıştırın (veriyi silmez).
- **Redis yok**: rate-limit bellek içi tutulduğu için Passenger uygulamayı yeniden başlattığında
  (deploy, restart, ya da inaktivite sonrası cPanel'in kendi process'i durdurup tekrar
  başlatması) sayaçlar sıfırlanır — bu düşük trafikli bir site için sorun değildir.
- **Loglar**: cPanel → Setup Node.js App → uygulamanız → "stderr.log" / "stdout.log", veya
  Application root'ta oluşan log dosyaları.

---

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

## Notlar

- **HTTPS zorunlu değişken**: `.env`/ortam değişkenlerindeki `COOKIE_SECURE=true` olmalı, aksi
  halde admin girişi HTTPS üzerinde çalışmaz (secure cookie tarayıcıya geri gönderilmez).
- Docker Compose yönteminde nginx sadece `HTTPS_PORT` (443) açar, 80'i kullanmaz — sunucuda
  başka bir servis 80'i kullanıyorsa bu tasarlanmış bir durumdur, http→https otomatik
  yönlendirme yoktur.
- `openshift/` klasörü, projenin en eski OpenShift dağıtımından kalan referans manifestleridir;
  artık aktif olarak kullanılmıyor.
- `talep-resimleri/` klasörü, admin panelden yüklenen seçenek fotoğraflarının ham kaynak
  dosyalarıdır, uygulama tarafından kullanılmaz.
