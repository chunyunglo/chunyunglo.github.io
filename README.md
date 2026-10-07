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

1. Create a new post:
```bash
hugo new content blog/my-post/index.md
```

2. Write the Chinese version in `index.md`; add `index.en.md` for an English version. Posts without a translation also appear in the other language's list.
3. Put the cover image in the same folder as `cover.jpg`, and reference other images with `![caption](photo.jpg)`.
4. Set `draft: false` to publish.

Images are converted to WebP without EXIF data, and the original files are not published. They still live in git, so remove location data from photos before committing.

## Key Features

- Bilingual support (Traditional Chinese / English)
- Blog with tags and RSS
- Responsive design optimized for all devices
- Light and dark mode
- Accessible markup (skip link, keyboard focus, ARIA labels)
- Small footprint: about 12 KB CSS and 1 KB JavaScript

## Privacy

Do not commit CVs, transcripts, ID documents, or files containing phone numbers or addresses. `static/files/*.pdf` is ignored by git.

## References

- [Hugo Documentation](https://gohugo.io/documentation/)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
