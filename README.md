# GearGuard API

Backend for the GearGuard maintenance management system.

## Stack

- Node.js
- Express
- MySQL
- Sequelize
- JWT authentication

## Run

Install dependencies:

```bash
npm install
```

Start in development:

```bash
npm run dev
```

Start in production:

```bash
npm start
```

Default API URL: `http://localhost:5000`

## Environment

Create `.env` in this folder with values like:

```env
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=gearguard
DB_USER=root
DB_PASSWORD=your_password
NODE_ENV=development
JWT_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000
```

## Database

- The backend connects to MySQL through Sequelize.
- Tables are synced automatically on startup.
- Sample data can be loaded with:

```bash
npm run seed
```

## Main Endpoints

```text
/api/auth
/api/teams
/api/users
/api/equipment
/api/maintenance-requests
/api/dashboard
/api/notifications
```

## Useful Files

- `package.json`
- `index.js`
- `seed.js`
- `PROJECT-STRUCTURE.md`
- `JWT-AUTHENTICATION.md`
- `GearGuard-Postman-Collection.json`
