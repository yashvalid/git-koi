# 🎏 Koi Fish GitHub Profile Animation

<p align="center">
  <img src="./koi.svg" alt="Animated Koi Fish Pond" width="850" />
</p>

<p align="center">
  <strong>A living Japanese Nishikigoi pond for your GitHub profile README that evolves its size, color, and swimming vitality based on your commit activity.</strong>
</p>

<p align="center">
  <a href="#-how-it-works">How It Works</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-koi-breeds--growth-stages">Breeds & Stages</a> •
  <a href="#-local-interactive-simulator">Live Simulator</a> •
  <a href="#-configuration">Configuration</a>
</p>

---

## 🌊 Why Koi?

In Japanese tradition, **Koi (錦鯉, Nishikigoi)** symbolize perseverance, strength of purpose, and transformation. Legend says that a koi that swims upstream and leaps over the Dragon Gate transforms into a celestial dragon.

This project brings an animated koi pond to your GitHub user profile. As you commit code, your koi grows in stature, unlocks rare traditional breeds, and swims with increased vitality.

- **100% Native SVG + CSS Keyframes**: Zero JavaScript in the rendered file. Fully compatible with GitHub's sanitized Camo proxy (`camo.githubusercontent.com`).
- **Dark & Light Mode Responsive**: Automatically shifts pond water depth, lily pad luminance, and water caustics based on the viewer's GitHub theme.
- **Zero External Dependencies**: Built with pure Node.js standard library. Fast, lightweight, and zero maintenance.

---

## 🎏 How It Works

| GitHub Metric | Koi Dimension | Effect |
| :--- | :--- | :--- |
| **Commits This Month** | **Size & Growth Stage** | Scales koi proportions from small *Fingerling (毛子)* to majestic *Grand Champion (大錦鯉)*. |
| **Streak & Volume** | **Nishikigoi Breed** | Unlocks authentic Japanese koi breeds (e.g. *Golden Yamabuki Ogon*, *Tancho*, *Taisho Sanke*). |
| **Commits Today** | **Swimming Vitality** | Increases swimming speed, pectoral fin rowing cadence, and expands pond ripples. |
| **Dark / Light Mode** | **Pond Depth & Water Caustics** | Switches seamlessly via CSS `@media (prefers-color-scheme: dark)`. |

---

## 🚀 Quick Start

### Step 1: Add to your Profile Repo (`username/username`)

1. In your GitHub user profile repository (`https://github.com/<your-username>/<your-username>`), create a new workflow file at:
   `.github/workflows/koi.yml`

2. Paste the following configuration:

```yaml
name: Generate Koi Fish Profile Animation

on:
  schedule:
    # Runs every 6 hours
    - cron: '0 */6 * * *'
  workflow_dispatch:
  push:
    branches:
      - main
      - master

permissions:
  contents: write

jobs:
  koi:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Generate Koi Animation
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          npx koi-github-profile --username ${{ github.repository_owner }} --output koi.svg

      - name: Commit & push updated Koi
        run: |
          git config --global user.name "github-actions[bot]"
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git add koi.svg
          if git diff --staged --quiet; then
            echo "No changes"
          else
            git commit -m "🎏 Update Koi pond commit animation [skip ci]"
            git push
          fi
```

### Step 2: Embed in your `README.md`

Add this line anywhere in your profile `README.md`:

```markdown
<p align="center">
  <img src="./koi.svg" alt="Living Koi Fish Pond" width="850" />
</p>
```

---

## 🎨 Koi Breeds & Growth Stages

### Growth Stages (Monthly Commits)

- **Fingerling (毛子)** *(< 15 commits)*: Small, agile, and swift (scale 0.80x).
- **Juvenile (当歳)** *(15 - 40 commits)*: Developing slender body with active fins (scale 0.92x).
- **Adult Koi (若鯉)** *(40 - 100 commits)*: Harmonious proportions and balanced glide (scale 1.05x).
- **Elder Koi (古法錦鯉)** *(100 - 200 commits)*: Broad dorsal presence and flowing fins (scale 1.20x).
- **Grand Champion (大錦鯉)** *(200+ commits)*: Majestic scale with flowing veil caudal fan (scale 1.32x).

### Traditional Nishikigoi Breeds

| Breed | Japanese | Palette & Description | Unlock Condition |
| :--- | :--- | :--- | :--- |
| **Kohaku** | 紅白 | Snow-white body with fiery scarlet danmoyo markings | Balanced active contributor |
| **Yamabuki Ogon** | 山吹黄金 | Gleaming metallic gold with radiant golden shimmer | 14+ day streak or 180+ monthly commits |
| **Tancho** | 丹頂 | Pure snow white with solitary circular crimson crown on brow | 7+ day unbroken streak |
| **Taisho Sanke** | 大正三色 | White body with vermilion patches and sumi ink-black spots | High weekly commit variety |
| **Showa Sanshoku** | 昭和三色 | Midnight sumi black base with dynamic crimson lightning | Night owl & deep focus coding |
| **Asagi** | 浅黄 | Steel indigo diamond scales with rust-vermilion belly | Zen patient contributor |
| **Cyberpunk Neon** | 電脳鯉 | Synthwave bioluminescent neon cyan, purple, and magenta | Manual `--theme neon` override |

---

## 🖥️ Local Interactive Simulator

Test different commit numbers and preview the live animations directly in your browser:

```bash
git clone https://github.com/<your-username>/koi.git
cd koi
npm start
```

Open [http://localhost:3000](http://localhost:3000) to access the interactive playground:
- Drag sliders for **Commits Today**, **Commits This Month**, and **Streak**.
- Toggle between light and dark mode pond aesthetics.
- Inspect any real GitHub username in real-time.

---

## ⚙️ CLI Reference

You can run the generator locally at any time:

```bash
# Generate for a specific user
node src/index.js --username octocat --output koi.svg

# Override with a specific breed
node src/index.js --username octocat --theme ogon

# Test with manual metrics
node src/index.js --commits-today 6 --commits-month 140 --streak 12

# Options:
#   -u, --username <name>      GitHub username
#   -o, --output <path>        Target SVG output file (default: koi.svg)
#   -t, --theme <breed>        Force breed (kohaku, ogon, sanke, showa, tancho, asagi, neon)
#   --no-stats                 Hide the zen stats card
#   --no-lilypads              Hide floating lily pads
```

---

## 📄 License

MIT License. Designed with care for developers who love clean code and tranquil aesthetics.
