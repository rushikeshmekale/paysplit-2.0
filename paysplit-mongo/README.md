# 💸 PaySplit — React + Vite + Node.js + MongoDB Atlas

No Supabase needed. Full stack with your own backend.

---

## 🏗️ Architecture

```
Browser (React + Vite)
        ↕ REST API (fetch + JWT)
Express.js backend (Node.js)
        ↕ Mongoose ODM
MongoDB Atlas (free cloud DB)
```

---

## ⚡ Setup in 5 steps

---

### Step 1 — Get MongoDB Atlas URI (free)

1. Go to **https://cloud.mongodb.com** → Sign up free
2. **Create a project** → **Create a cluster** → choose **M0 Free**
3. **Database Access** → Add database user
   - Username: `paysplituser`
   - Password: something strong (copy it)
   - Role: **Atlas admin**
4. **Network Access** → Add IP Address → **0.0.0.0/0** (allow all)
5. **Clusters** → **Connect** → **Drivers** → copy the connection string

It looks like:
```
mongodb+srv://paysplituser:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

Replace `<password>` with your actual password and add `/paysplit` before the `?`:
```
mongodb+srv://paysplituser:MyPass123@cluster0.xxxxx.mongodb.net/paysplit?retryWrites=true&w=majority
```

---

### Step 2 — Configure backend

Open **`backend/.env`** and fill in:

```env
MONGODB_URI=mongodb+srv://paysplituser:MyPass123@cluster0.xxxxx.mongodb.net/paysplit?retryWrites=true&w=majority
JWT_SECRET=any_long_random_string_at_least_32_chars
PORT=5000
FRONTEND_URL=http://localhost:3000
```

Generate a JWT secret in terminal:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

### Step 3 — Start the backend

```bash
cd backend
npm install
npm run dev
```

You should see:
```
✅ MongoDB Atlas connected
🚀 Server running on http://localhost:5000
```

---

### Step 4 — Configure frontend

Open **`frontend/.env`**:

```env
VITE_API_URL=http://localhost:5000
```

---

### Step 5 — Start the frontend

Open a **new terminal**:

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000** → Register → Start splitting! ✅

---

## 🗂️ Project Structure

```
paysplit/
├── README.md
│
├── backend/                        ← Node.js + Express
│   ├── .env                        ← ADD MONGODB_URI + JWT_SECRET HERE
│   ├── package.json
│   ├── server.js                   ← Entry point
│   ├── middleware/
│   │   └── auth.js                 ← JWT verify middleware
│   ├── models/
│   │   ├── User.js                 ← Mongoose User schema
│   │   └── Expense.js              ← Mongoose Expense schema
│   └── routes/
│       ├── auth.js                 ← /api/auth/*
│       ├── expenses.js             ← /api/expenses/*
│       ├── friends.js              ← /api/friends/*
│       └── balance.js              ← /api/balance/*
│
└── frontend/                       ← React + Vite
    ├── .env                        ← VITE_API_URL=http://localhost:5000
    ├── package.json
    ├── vite.config.js
    ├── index.html
    ├── public/
    │   ├── manifest.json
    │   └── service-worker.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── lib/
        │   └── api.js              ← All fetch calls (JWT in localStorage)
        ├── context/
        │   └── AuthContext.jsx     ← Auth state (JWT based)
        ├── components/
        │   ├── BottomNav.jsx
        │   ├── ProtectedRoute.jsx
        │   └── SplitSlider.jsx     ← 4-mode split widget
        └── pages/
            ├── Login.jsx
            ├── Register.jsx
            ├── Home.jsx
            ├── Expenses.jsx
            ├── Friends.jsx
            └── Profile.jsx
```

---

## 🔑 Environment Variables Summary

### backend/.env
| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Random 64-char secret for signing tokens |
| `PORT` | Backend port (default 5000) |
| `FRONTEND_URL` | For CORS (default http://localhost:3000) |

### frontend/.env
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Express backend URL |

---

## 📡 API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /api/auth/register | ❌ | Create account |
| POST | /api/auth/login | ❌ | Login, get JWT |
| GET  | /api/auth/me | ✅ | Get current user |
| GET  | /api/expenses | ✅ | List all expenses |
| POST | /api/expenses | ✅ | Add expense |
| DELETE | /api/expenses/:id | ✅ | Delete expense |
| GET  | /api/balance | ✅ | you_owe / they_owe |
| GET  | /api/balance/stats | ✅ | categories + totals |
| GET  | /api/friends | ✅ | Friends + balances |
| POST | /api/friends/:name/settle | ✅ | Settle with friend |

---

## 🚀 Scripts

### Backend
```bash
npm run dev    # nodemon (auto-restart on changes)
npm start      # production
```

### Frontend
```bash
npm run dev    # Vite dev server → localhost:3000
npm run build  # Production build → dist/
```

---

## 🌐 Deploy

### Backend → Railway (free)
1. Push `backend/` folder to GitHub
2. New project in Railway → Deploy from GitHub
3. Add env variables in Railway dashboard
4. Copy the generated URL (e.g. `https://paysplit-backend.up.railway.app`)

### Frontend → Vercel (free)
1. Push `frontend/` folder to GitHub
2. Import in Vercel
3. Set env var: `VITE_API_URL=https://paysplit-backend.up.railway.app`
4. Deploy

---

## ❓ Troubleshooting

| Problem | Fix |
|---------|-----|
| `MongoDB connection failed` | Check MONGODB_URI — replace `<password>`, add `/paysplit` before `?` |
| CORS error | Check `FRONTEND_URL` in backend `.env` matches frontend URL |
| 401 Unauthorized | Token expired — log out and log in again |
| Friends list empty | Register 2+ accounts, add expenses with their names |
| Voice not working | Use Chrome on desktop or Android |
