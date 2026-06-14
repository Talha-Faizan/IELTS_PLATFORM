# IELTS Scholar — Next.js App

A production-grade IELTS preparation platform built with **Next.js 16 (App Router)**, **Tailwind CSS v4**, and the **Academic Editorial** design system.

## Design System
- **Typography**: Montserrat (all weights)
- **Icons**: Material Symbols Outlined
- **Palette**: Warm cream + terracotta primaries
- **Layout**: Bento grid cards with ambient shadows

## Folder Structure

```
app/
  layout.js             # Root layout
  globals.css           # Global styles + design tokens
  page.js               # Landing page
  login/page.js         # Login / Register
  dashboard/page.js     # Student dashboard

components/
  layout/
    Navbar.js           # Landing page top nav (sticky, glassmorphism)
    Footer.js           # Landing page footer
    Sidebar.js          # Dashboard fixed sidebar
    DashboardNav.js     # Dashboard top navbar with breadcrumbs
  ui/
    BentoCard.js        # Reusable bento card wrapper
    ProgressBar.js      # Progress bar with label + score
    Tag.js              # Pill badge/tag
  sections/
    Hero.js             # Landing hero section
    Modules.js          # 4-module bento grid (Reading/Writing/Listening/Speaking)
    Features.js         # AI features 2-col grid
    Testimonials.js     # Student testimonials
    Pricing.js          # 3-tier pricing cards
    BandTracker.js      # Dashboard band progress tracker
    AIRecommendation.js # Dashboard AI suggestion card
    MockTestBanner.js   # Dashboard mock test progress banner
    PracticeCards.js    # Dashboard 4-section practice quick-access grid
```

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Pages
- `/` — Landing page
- `/login` — Sign in / Sign up
- `/dashboard` — Student dashboard

## Build for Production

```bash
npm run build
npm start
```
