# PokéTeams ⚡

A Pokémon Showdown team manager — paste, preview, and save your teams.

## Deploy to Vercel (free, ~2 minutes)

### Step 1 — Get the code on GitHub
1. Go to [github.com](https://github.com) and create a free account (or log in)
2. Click **+** → **New repository** → name it `poketeams` → click **Create repository**
3. On your computer, open a terminal and run:

```bash
# Install Node.js first if you don't have it: https://nodejs.org
cd poketeams
npm install
```

4. Push to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/poketeams.git
git push -u origin main
```

### Step 2 — Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) and sign up with your GitHub account
2. Click **Add New Project**
3. Select your `poketeams` repository
4. Click **Deploy** (no settings need changing — Vercel auto-detects React)
5. In ~60 seconds you'll have a live URL like `poketeams.vercel.app`

That's it! Every time you push changes to GitHub, Vercel auto-redeploys.

---

## Run locally

```bash
npm install
npm start
```

Opens at `http://localhost:3000`

## Build for production

```bash
npm run build
```

---

## Notes

- **Accounts & teams are stored in your browser's localStorage** — they persist across visits on the same device/browser
- Passwords are hashed before storing (not plain text)
- No backend or database required
- Works as a mobile home screen app (PWA-ready via manifest.json)
