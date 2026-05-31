# dws-projekat-P

                                                                                            


Univerzitet u Zenici
Politehnički fakultet
Softverski Inženjering

Dizajn Web Stranica 
Operativni sistemi i računarvstvo u oblaku


Projektni zadatak - Dokumentacija

Dokerizacija i izrada stranice
“Thriftly”



Članovi tima:
  				Adin Saletović
Mario Šantić
Žepačkić Toni

Zenica 2026.
 
SADRŽAJ
1. Pregled arhitekture	1
2.1.1 Dockerfile – Frontend (React)	1
2.1.2 Dockerfile – Backend (json-server)	1
2.1.3 Docker Compose	1
3. Opis aplikacije	1
4. Članovi tima i doprinos	1
4.1 Raspodjela radova	1
5. Tech stack	1
6. Arhitekturni dijagram	1
7. Paleta boja i fontovi	1
7.1 Paleta boja	1
7.2 Fontovi	1
8. Korisničke uloge i prava pristupa	1
9. Upute za lokalno pokretanje	1
9.1 Preduvjeti	1
9.2 Koraci za pokretanje	1
9.3 Testni računi	1
10. Produkcijski URL (GCP)	1
11. Snimci ekrana	1

 
1. Pregled arhitekture
Aplikacija je dockerizovana kao multi-container sistem koji se sastoji od dva odvojena servisa: frontend (React) i backend (json-server). Servisi komuniciraju unutar Docker mreže, a aplikacija se pokreće jednom komandom:

docker compose up --build

Struktura dokerizacije:

FinalniProjekt/
  frontend/
    Dockerfile
    nginx.conf
    src/
  backend/
    Dockerfile
    db.json
  docker-compose.yml

2.1.1 Dockerfile – Frontend (React)
Frontend koristi multi-stage build kako bi se minimizirala veličina finalnog Docker imagea. Proces buildanja je podijeljen u dvije faze:

•	Build faza: Node.js 22 Alpine kompajlira React aplikaciju u produkcijski build
•	Serve faza: nginx:alpine servisira statičke fajlove i proxy-ira API pozive na backend

FROM node:22-alpine AS build
 
WORKDIR /app
 
COPY package*.json ./
 
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps
 
COPY . .
 
RUN npm run build
 
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

nginx.conf konfiguracija
Nginx konfiguracija podržava React Router putem try_files direktive, te proxy-ira sve /api/ zahtjeve na backend servis:

server {
    listen 80;
    server_name localhost;
 
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
 
    location /api/ {
        proxy_pass http://backend:5000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

Direktiva try_files $uri $uri/ /index.html osigurava da React Router može upravljati rutama na klijentskoj strani bez 404 greške.

2.1.2 Dockerfile – Backend (json-server)
Backend servis koristi json-server kao REST API server. db.json fajl se kopira u poseban direktorij unutar imagea, a port se konfigurira putem environment varijable:

FROM node:18-alpine
 
WORKDIR /app
 
RUN apk add --no-cache wget
 
RUN npm install -g json-server
 
COPY db.json ./data/db.json
 
EXPOSE 5000
 
CMD ["sh", "-c", "json-server --watch ./data/db.json --port $PORT --host 0.0.0.0"]

Koriste se Alpine varijante base imagea kako bi finalni image bio manji od 150MB. Varijabla $PORT se ubacuje putem docker-compose.yml environment sekcije.

2.1.3 Docker Compose
docker-compose.yml definira oba servisa, njihove ovisne veze,  varijable u okruženju, named volume za persistenciju podataka, te healthcheck mehanizam:

services:
  frontend:
    build:
      context: ./frontend
    ports:
      - "8080:80"
    depends_on:
      backend:
        condition: service_healthy
 
  backend:
    build:
      context: ./backend
    ports:
      - "5000:5000"
    environment:
      - PORT=5000
    volumes:
      - db-data:/app/data
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:5000/users || exit 1"]
      interval: 5s
      timeout: 5s
      retries: 10
      start_period: 10s
 
volumes:
  db-data:

Ključne konfiguracije

•	depends_on s condition: service_healthy frontend čeka da backend postane „zdrav“ prije pokretanja
•	Named volume db-data  osigurava persistenciju db.json podataka između restartova kontejnera
•	Environment varijabla PORT  port nije hardkodiran u kodu već se injektuje iz Compose fajla
•	Healthcheck  periodično provjerava dostupnost backend API-ja putem wget zahtjeva



Healthcheck detalji
Healthcheck šalje HTTP zahtjev na /users endpoint svakih 5 sekundi. Kontejner dobiva 10 sekundi start perioda prije nego što neuspjeli checkovi počnu biti relevantni. Nakon 10 neuspjelih pokušaja, kontejner se označava kao unhealthy.

Named Volume i persistencija
Named volume db-data se montira na /app/data direktorij unutar backend kontejnera. Docker inicijalizuje volume s db.json fajlom iz imagea pri prvom pokretanju. Sve izmjene podataka su trajne i preživljavaju restartove kontejnera.

3. Opis aplikacije
Thriftly je web aplikacija namijenjena kupovini i prodaji polovnih predmeta. Platforma omogućava korisnicima da na jednostavan način objave vlastite predmete na prodaju, pretražuju i filtriraju ponudu ostalih korisnika, komuniciraju putem internog chat sistema te upravljaju svojom košaricom i narudžbama.

Cilj aplikacije je pružiti pristupačnu i intuitivnu platformu koja promovira cirkularne ekonomske prakse — produžavanje životnog vijeka predmeta i smanjenje nepotrebnog otpada. Thriftly je potpuno dockeriziran kao multi-container sistem koji se pokreće jednom komandom, što olakšava kako lokalni razvoj tako i produkcijsko postavljanje.

4. Članovi tima i doprinos
Projekt je razvijen u timu od tri člana. Doprinos svakog člana je naveden ovdje:
4.1 Raspodjela rada
1.	Adin Saletović - Dockerfajlovi, nginx.conf, većina javascript fajlova
2.	Mario Šantić - Stranice proizvoda (Home, ProductDetail, AddProduct itd), routes, app i main jsx kao i json database, pomoć Adinu pri uvezivanju osiruo dijelova
3.	Žepačkić Toni – komponente, kontekst i cijela css stilizacija

5. Tech stack

Tehnologija	Verzija	Namjena
React	18.2.0	Frontend UI framework
React Router DOM	6.22.0	Klijentsko rutiranje
Node.js	18.x / 22.x	Runtime okruženje
json-server	Najnovija	Mock REST API / backend
nginx	Alpine	Web server i reverse proxy
Docker	24.x+	Kontejnerizacija aplikacije
Docker Compose	2.x	Orkestracija multi-container setup-a

6. Arhitekturni dijagram
Aplikacija se sastoji od dva Docker servisa koja komuniciraju unutar zajedničke Docker mreže:

┌─────────────────────────────────────────────────────────┐
│                     Docker Compose                       │
│                                                          │
│   ┌──────────────────────┐   ┌──────────────────────┐   │
│   │   frontend           │   │   backend            │   │
│   │   (React + nginx)    │   │   (json-server)      │   │
│   │                      │   │                      │   │
│   │  PORT: 8080:80       │   │  PORT: 5000:5000     │   │
│   │                      │   │                      │   │
│   │  nginx → /api/*      │──▶│  db.json (REST API)  │   │
│   │  proxy_pass :5000    │   │                      │   │
│   └──────────────────────┘   └──────────┬───────────┘   │
│              ▲                           │               │
│              │                    named volume           │
│           Browser                  (db-data)            │
└─────────────────────────────────────────────────────────┘

Frontend servis (React + nginx) prima HTTP zahtjeve na portu 8080. Sve rute koje počinju s /api/ nginx proksira na backend servis koji sluša na portu 5000. Backend koristi json-server za simulaciju REST API-a, a podaci se čuvaju u named volumenu db-data kako bi perzistirali i nakon ponovnog pokretanja kontejnera.

7. Paleta boja i fontovi
7.1 Paleta boja

Pozadina (bg)
#F5F0E8	Karta (bg-card)
#FDFAF4
Zelena (primary)
#3A5C44	Zelena (mid)
#5A8C68
Narandžasta (akcent)
#C45E28	Denim (info)
#3E5878
Tekst (primary)
#2A2420	Tekst (secondary)
#5C5248
Crvena (danger)
#B03A2E	Smeđa (brown)
#7A5C44

Pored navedenih boja, svaka primarna boja ima i svjetlu varijantu za pozadine (npr. --green-light: #EAF2EC, --orange-light: #FDF0E8, --denim-light: #EBF0F8). Aplikacija podržava i tamni mod (dark mode) s odgovarajućim varijantama.

7.2 Fontovi
4.	Fraunces (Google Fonts) - display font; koristi se za naslove, logotip, cijene i istaknute elemente. Serifni font daje topao  karakter aplikaciji.
5.	Geist (Vercel) - UI font; koristi se za sve navigacijske elemente, forme, opise i dugmad. Moderan sans-serif font optimiziran za čitljivost na ekranu.

8. Korisničke uloge i prava pristupa

Uloga	Prava pristupa
Gost (neregistriran)	Pregled proizvoda, pretraga, filtriranje po kategorijama i cijeni. Nema pristupa košarici, chatu, profilu ni objavljivanju.
Korisnik (registriran)	Sve što može gost + dodavanje u košaricu, kupovina, objava proizvoda, chat s prodavačima, upravljanje vlastitim profilom i listama.
Administrator	Puni pristup svemu + admin panel: upravljanje korisnicima (aktivacija/deaktivacija), upravljanje svim proizvodima, pregled statistika platforme.

Administratorska uloga se dodjeljuje direktnim unosom u bazu (db.json - polje is_admin: true). Nije predviđena registracija administratora putem sučelja.

9. Upute za lokalno pokretanje
9.1 Preduvjeti
Prije pokretanja aplikacije, potrebno je imati instalirano sljedeće:
6.	Docker Desktop (v24.0+)
7.	Docker Compose (uključen u Docker Desktop)
8.	Git (za kloniranje repozitorija)
9.	Slobodni portovi: 8080 (frontend) i 5000 (backend)

9.2 Koraci za pokretanje

Korak 1 — Kloniraj repozitorij

git clone https://github.com/mariosantic25-commits/dws-projekat-P
cd rootFolder

Korak 2 — Pokreni aplikaciju

docker compose up --build

Docker će automatski:
10.	Buildati frontend image (Node.js kompajlira React app, nginx servisira build)
11.	Buildati backend image (json-server sa db.json)
12.	Pokrenuti healthcheck na backend servisu (5 pokušaja, interval 3s)
13.	Pokrenuti frontend tek kad je backend zdrav (depends_on: condition: service_healthy)

Korak 3 - Otvori aplikaciju u browseru

http://localhost:8080

Zaustavljanje aplikacije

docker compose down

Za brisanje i volumena (podataka):
docker compose down -v

9.3 Testni računi
Aplikacija dolazi s predefiniranim korisnicima u db.json. Za admin pristup, pronađi korisnika s poljem is_admin: true u backend/db.json i iskoristi njegove kredencijale.
Kredencijali za admina su:
Mail: admin@thriftly.ba
Password: admin123

10. Produkcijski URL (GCP)
GCP deployment je u toku. Aplikacija još nije javno dostupna na produkcijskom URL-u. Ovaj odjeljak bit će dopunjen čim se završi postavljanje na Google Cloud Platform (Compute Engine VM s Docker + systemd autostart i HTTPS konfiguracijom). Čekamo još uvijek da nam odobre besplatne creditse, no, ako ne uspije to uskoro, koristit ćemo alternativu.

11. Snimci ekrana (nedostaju GCP slike)       
