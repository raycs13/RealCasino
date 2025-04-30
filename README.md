# 🎲 RealCasino

[![Node.js](https://img.shields.io/badge/Node.js-14.x-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-blue.svg)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.x-orange.svg)](https://www.mysql.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-black.svg)](https://socket.io/)

## 📋 Tartalomjegyzék

- [A projektről](#a-projektről)
- [Főbb funkciók](#főbb-funkciók)
- [Technológiai stack](#technológiai-stack)
- [Adatbázis struktúra](#adatbázis-struktúra)
- [Projekt struktúra](#projekt-struktúra)
- [Környezeti változók](#környezeti-változók)
- [API végpontok](#api-végpontok)
- [Socket.IO események](#socketio-események)
- [Biztonsági funkciók](#biztonsági-funkciók)
- [Használt függőségek](#használt-függőségek)
- [Tesztelés](#tesztelés)
- [Jövőbeli fejlesztések](#jövőbeli-fejlesztések)

## 🎯 A projektről

A RealCasino egy webalapú kaszinó platform, amely valós idejű játékokat, felhasználói fiókokat, chat funkcionalitást és fizetési feldolgozást kínál. Az alkalmazás interaktív rulett játékot biztosít fogadási mechanikával, felhasználói profil kezeléssel és adminisztrációs eszközökkel. A platform modern webtechnológiákkal készült, és moduláris architektúrát követ a könnyebb karbantarthatóság és skálázhatóság érdekében.

## ✨ Főbb funkciók

- **🎮 Valós idejű rulett játék**: Interaktív rulett fogadási rendszerrel
- **💬 Élő chat**: Globális chat az összes online felhasználóval
- **🔐 Felhasználói hitelesítés**: Biztonságos bejelentkezés, regisztráció és jelszó-visszaállítás
- **👤 Profil kezelés**: Felhasználói profilok testreszabható beállításokkal
- **💰 Egyenleg rendszer**: Virtuális pénz kezelés befizetési funkcióval
- **⚙️ Admin panel**: Felhasználó-kezelési eszközök adminisztrátorok számára
- **📱 Reszponzív dizájn**: Asztali és mobileszközökön egyaránt működik

## 🛠️ Technológiai stack

### Backend
- Node.js
- Express
- Socket.IO (valós idejű kommunikáció)
- MySQL (adatbázis)
- JSON Web Tokens (hitelesítés)

### Frontend
- HTML5/CSS3
- JavaScript
- Bootstrap
- jQuery

## 🗄️ Adatbázis struktúra

Az alkalmazás MySQL adatbázist használ a következő táblákkal:

| Tábla | Leírás | Mezők |
|-------|--------|-------|
| **users** | Felhasználói fiókok és profilok | user_id, username, password, email, role, balance, balance_last_update, profile_pic |
| **bets** | Fogadások nyilvántartása | betid, bet (összeg) |
| **rounds** | Játékkörök információi | roundid, gameid, winColor, winNumber |
| **game_rounds** | Összeköti a felhasználókat, fogadásokat és köröket | userid, roundid, betid, bet_type |
| **payouts** | Nyeremények nyilvántartása | roundid, userid, payout |
| **messages** | Chat üzenetek | message_id, user_id, message, created_at |

## 📂 Projekt struktúra

```
project-root/
├── server.js                 # Alkalmazás belépési pont
├── config/                   # Konfigurációs fájlok
│   ├── db.js                 # Adatbázis kapcsolat
│   ├── multer.js             # Fájl feltöltés konfiguráció
│   ├── mailer.js             # Email konfiguráció
│   └── socket.js             # Socket.io konfiguráció
├── routes/                   # API útvonalak
│   ├── auth.js               # Hitelesítési útvonalak
│   ├── users.js              # Felhasználó-kezelési útvonalak
│   ├── profile.js            # Profil kezelési útvonalak
│   ├── payments.js           # Fizetés-feldolgozási útvonalak
│   └── game.js               # Játékkal kapcsolatos útvonalak
├── controllers/              # Üzleti logika
│   ├── authController.js     # Hitelesítési logika
│   ├── userController.js     # Felhasználó-kezelés
│   ├── profileController.js  # Profil kezelés
│   ├── paymentController.js  # Fizetés-feldolgozás
│   └── gameController.js     # Játék mechanika
├── middleware/               # Egyéni middleware-ek
│   └── auth.js               # Hitelesítési middleware
├── socket/                   # Socket.io kezelők
│   ├── chat.js               # Chat funkcionalitás
│   └── game.js               # Valós idejű játék frissítések
├── public/                   # Statikus eszközök
│   ├── css/                  # Stíluslapok
│   ├── js/                   # Frontend JavaScript
│   └── uploads/              # Felhasználói feltöltések
└── frontend/                 # HTML sablonok
    ├── index.html            # Üdvözlő oldal
    ├── login.html            # Bejelentkezési oldal
    ├── register.html         # Regisztrációs oldal
    ├── main.html             # Fő játék felület
    ├── profile.html          # Felhasználói profil oldal
    └── admin-panel.html      # Admin vezérlőpult
```


## 🔧 Környezeti változók

Az alkalmazás a következő környezeti változókat igényli:

```
# Szerver konfiguráció
PORT=3000
HOSTNAME=localhost

# Adatbázis konfiguráció
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_DATABASE=casino_db

# JWT hitelesítés
JWT_SECRET=your_jwt_secret

# Email konfiguráció
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password

# Stripe konfiguráció (fizetésekhez)
STRIPE_SECRET_KEY=your_stripe_secret_key

# Alap URL a jelszó-visszaállítási linkekhez
BASE_URL=http://localhost:3000
```

## 🌐 API végpontok

### Hitelesítési útvonalak

- **POST** `/api/register`: Új felhasználó regisztrálása
- **POST** `/api/login`: Felhasználói bejelentkezés
- **GET** `/api/check-auth`: Hitelesítési állapot ellenőrzése
- **POST** `/api/forgot-password`: Jelszó-visszaállítás kérése
- **POST** `/api/reset-password`: Jelszó visszaállítása tokennel

### Felhasználói útvonalak

- **GET** `/users`: Összes felhasználó lekérése (csak admin)
- **GET** `/users/:id`: Adott felhasználó lekérése (csak admin)
- **PUT** `/users/:id`: Felhasználó frissítése (csak admin)
- **DELETE** `/users/:id`: Felhasználó törlése (csak admin)

### Profil útvonalak

- **GET** `/api/user/profilePic`: Felhasználó profilképének lekérése
- **GET** `/api/user/role`: Felhasználó szerepkörének lekérése
- **PUT** `/api/editUsername`: Felhasználónév frissítése
- **PUT** `/api/editEmail`: Email frissítése
- **PUT** `/api/editProfilePsw`: Jelszó frissítése
- **PUT** `/api/editProfilePic`: Profilkép frissítése
- **GET** `/api/balance`: Felhasználói egyenleg lekérése

### Fizetési útvonalak

- **POST** `/api/create-payment-intent`: Stripe fizetési szándék létrehozása
- **POST** `/api/update-balance`: Felhasználói egyenleg frissítése fizetés után

### Játék útvonalak

- **GET** `/api/roulette/stats`: Rulett játék statisztikák lekérése
- **POST** `/api/place-bet`: Fogadás elhelyezése

## 📡 Socket.IO események

### Chat

- `load_messages`: Chat előzmények betöltése
- `send_message`: Új üzenet küldése
- `new_message`: Új üzenet fogadása
- `commandResponse`: Válasz admin parancsokra

### Játék

- `round_start`: Új játékkör kezdete
- `time_update`: Játék visszaszámláló frissítése
- `spin_start`: Kerék forgásának kezdete
- `round_end`: Kör eredményei
- `bets_update`: Aktuális fogadások frissítése
- `bet_placed`: Fogadás megerősítése
- `balance_update`: Egyenleg változás értesítés
- `update_previous_spins`: Előző pörgetések előzményei

## 🔒 Biztonsági funkciók

- JWT token alapú hitelesítés
- Jelszó hashelés bcrypt-tel
- HTTP-only cookie-k
- Bemenet validáció validator.js segítségével
- Sebességkorlátozás érzékeny végpontokon
- Fájl feltöltési korlátozások és validáció

## 📦 Használt függőségek

```json
{
  "dependencies": {
    "bcrypt": "^5.1.1",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.21.1",
    "express-rate-limit": "^7.4.1",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "mysql2": "^3.11.4",
    "nodemailer": "^6.9.16",
    "socket.io": "^4.8.1",
    "stripe": "^17.5.0",
    "validator": "^13.12.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.7"
  }
}
```

## 🧪 Tesztelés

A projekt Postmannel tesztelhető az API végpontok esetében, és normál böngészőteszteléssel a frontend felületek esetében.

## 🔮 Jövőbeli fejlesztések

- További kaszinó játékok implementálása (játékgépek, blackjack, póker)
- Felhasználói statisztikák követése
- Mobil élmény javítása
- Verseny mód implementálása
- Szociális funkciók, mint barátok meghívása és privát játékok
- Több valuta vagy kriptovaluta támogatása
- Fejlett admin analitikai vezérlőpult

---

© 2025 RealCasino. Minden jog fenntartva.
