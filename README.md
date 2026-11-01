# Aura

**PHP, compiled. The server, deleted.**

Application that runs **full-stack Laravel in the browser** — no backend server required. It boots a real **PHP 8.4**, (with SQLite) entirely on the client. The result is an interactive playground with a code editor, rendered preview, all served as static files.

## Setup

### Prerequisites
- Node.js (with npm)
- Php 8.4
- Composer

##### Install

```sh
npm install
```

##### Build the Laravel bundle
```sh
cd apps/laravel-app && composer install --no-dev --optimize-autoloader --prefer-dist   
```

```sh
node scripts/bundle-laravel-app.js
```

##### Develop

```sh
npm run dev
```
