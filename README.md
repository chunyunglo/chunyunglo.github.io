# chunyunglo.github.io

Personal portfolio website and blog built with Hugo and a lightweight custom layout, featuring a cold Morandi color scheme.

## Overview

This repository contains the source code for a professional portfolio website deployed on GitHub Pages. The site showcases personal information, research, experiences, projects, and skills, plus a blog for notes, project write-ups, and exchange reflections, with a minimalist design aesthetic.

## Technology Stack

- **Static Site Generator**: Hugo (Extended v0.156+, CI pinned to v0.167.0)
- **Theme**: Custom layouts in `layouts/` (no external theme, Node.js, or Go modules)
- **Deployment**: GitHub Actions → GitHub Pages
- **Styling**: Single CSS file with cold Morandi color palette and dark mode
- **Languages**: Traditional Chinese (zh-tw) and English

## Project Structure

```
.
├── .github/workflows/    # GitHub Actions deployment configuration
├── archetypes/           # Template for new blog posts
├── assets/               # CSS, JS, and images (processed by Hugo)
├── content/blog/         # Blog posts (Markdown)
├── data/                 # YAML data files for homepage sections
├── i18n/                 # Interface strings (zh-tw / en)
├── layouts/              # Page templates
└── hugo.yaml             # Hugo configuration
```

## Local Development

### Prerequisites

- Hugo Extended (v0.156 or later)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/chunyunglo/chunyunglo.github.io.git
cd chunyunglo.github.io
```

2. Run the development server (`-D` also shows drafts):
```bash
hugo server -p 1313 --bind 0.0.0.0 --noHTTPCache --disableFastRender -D
```

3. Visit `http://localhost:1313` in your browser.

## Deployment

The site automatically deploys to GitHub Pages when changes are pushed to the `main` branch. Pull requests are built but not deployed. The deployment workflow:

1. Builds the site using Hugo
2. Generates static files in the `public/` directory
3. Deploys to GitHub Pages via GitHub Actions

View the live site at: [https://chunyunglo.github.io](https://chunyunglo.github.io)

## Customization

### Color Scheme

The site uses a custom cold Morandi color palette defined in `assets/css/main.css`:

- Accent: #3F6577 (Deep Morandi blue)
- Text: #1D262C (Deep charcoal)
- Muted: #56646D (Rock grey)
- Background: #F5F6F4 (Cold cloud white)

### Content Management

- **Personal Info**: Edit `data/zh-tw/author.yaml` and `data/en/author.yaml`
- **Sections**: Modify files in `data/zh-tw/sections/` and `data/en/sections/`
- **Site Config**: Update `hugo.yaml` for global settings

### Writing Blog Posts

Posts are written in a local editor (Decap CMS) with a live preview of the site.

**First time only:** install [Hugo](https://gohugo.io/installation/) and [Node.js](https://nodejs.org), then run:
```bash
npm install
```
This also turns on a git hook that removes location data (EXIF/GPS) from photos whenever you commit.

**Mac app (optional):** run `npm run app` once to install **文章編輯器.app** into `~/Applications`. Open it from Launchpad or the Dock to start the editor; quit it (⌘Q) to stop the local servers.

**Every time:**
1. Start the editor (or open 文章編輯器.app):
```bash
npm run write
```
2. The editor opens at `http://localhost:1313/admin/`. Click 登入, then **+ 文章** to start a post (or **Posts (English)** for an English version using the same folder name).
3. Fill in the title, an English folder name (e.g. `my-first-post`), date, tags and summary. Upload a cover image and add photos with the image button in the editor.
4. Untick 草稿 when the post is ready, then click 發布 → 立即發布. Preview it at `http://localhost:1313/blog/`.
5. Commit and push (e.g. with GitHub Desktop). The site updates about a minute after the push to `main`.

Prefer plain files? `hugo new content blog/my-post/index.md` creates a post folder; put `cover.jpg` and other photos in the same folder.

Photos are converted to WebP when the site is built, and the original files are never published. iPhone HEIC photos must be exported as JPEG first. CI refuses to deploy if any committed image still contains location data.

## Key Features

- Bilingual support (Traditional Chinese / English)
- Blog with tags and RSS
- Responsive design optimized for all devices
- Light and dark mode
- Accessible markup (skip link, keyboard focus, ARIA labels)
- Small footprint: about 16 KB CSS and 3 KB JavaScript

## Privacy

Do not commit CVs, transcripts, ID documents, or files containing phone numbers or addresses. `static/files/*.pdf` is ignored by git.

## References

- [Hugo Documentation](https://gohugo.io/documentation/)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
