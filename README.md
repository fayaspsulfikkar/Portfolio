# Fayas Portfolio

A modern personal portfolio built with React, Vite, and Tailwind CSS.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Live Demo

- https://portfolio-fayas.vercel.app/

## Overview

This project presents a narrative-first portfolio experience with:

- A custom interactive UI
- A project showcase section
- A business journey timeline
- Contact and external profile links

## Key Features

- Smooth single-page scroll experience
- Section-aware navigation with active state
- Responsive layout optimized for desktop and mobile
- Lightweight and fast production build via Vite

## Tech Stack

- React 19
- Vite 7
- Tailwind CSS 3
- Lucide React

## Project Structure

```text
.
├── src/
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```

## Getting Started

### 1) Install dependencies

```bash
npm install
```

### 2) Start development server

```bash
npm run dev
```

The app will run at:

- http://localhost:5173/

### 3) Build for production

```bash
npm run build
```

### 4) Preview production build

```bash
npm run preview
```

## Scripts

- `npm run dev` - Start local development server
- `npm run build` - Create production build
- `npm run preview` - Preview production build locally

## Continuous Integration

GitHub Actions runs a build check on pushes and pull requests to `main`.

- Workflow: `.github/workflows/ci.yml`

## Deployment

This project is compatible with static hosting platforms such as:

- Vercel
- Netlify
- GitHub Pages (with proper Vite base configuration if needed)

## Contributing

Contributions are welcome.

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## License

This project is licensed under the MIT License.
See [LICENSE](LICENSE).
