# chunyunglo.github.io

Personal portfolio website built with Hugo and the Toha theme, featuring a cold Morandi color scheme.

## Overview

This repository contains the source code for a professional portfolio website deployed on GitHub Pages. The site showcases personal information, skills, experiences, and projects with a minimalist design aesthetic.

## Technology Stack

- **Static Site Generator**: Hugo (Extended v0.154+)
- **Theme**: [Toha v4](https://github.com/hugo-toha/toha)
- **Deployment**: GitHub Actions → GitHub Pages
- **Styling**: Custom CSS with cold Morandi color palette
- **Languages**: Traditional Chinese (zh-tw) and English

## Project Structure

```
.
├── .github/workflows/    # GitHub Actions deployment configuration
├── content/             # Markdown content files
├── data/                # YAML data files for sections
├── layouts/             # Custom layout overrides
├── static/              # Static assets (CSS, JS, images)
├── hugo.yaml            # Hugo configuration
└── go.mod              # Go module dependencies
```

## Local Development

### Prerequisites

- Hugo Extended (v0.154 or later)
- Go (v1.22 or later)
- Node.js (v20 or later)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/chunyunglo/chunyunglo.github.io.git
cd chunyunglo.github.io
```

2. Install dependencies:
```bash
npm install
hugo mod tidy
```

3. Run the development server:
```bash
hugo server -p 1313 --bind 0.0.0.0 --noHTTPCache --disableFastRender
```

4. Visit `http://localhost:1313` in your browser.

## Deployment

The site automatically deploys to GitHub Pages when changes are pushed to the `main` branch. The deployment workflow:

1. Builds the site using Hugo
2. Generates static files in the `public/` directory
3. Deploys to GitHub Pages via GitHub Actions

View the live site at: [https://chunyunglo.github.io](https://chunyunglo.github.io)

## Customization

### Color Scheme

The site uses a custom cold Morandi color palette defined in `static/css/custom.css`:

- Primary: #889CA9 (Morandi grey-blue)
- Secondary: #DDE4E8 (Light grey-blue)
- Accent: #5F7380 (Deep rock grey)
- Background: #F4F6F7 (Cold cloud white)

### Content Management

- **Personal Info**: Edit `data/zh-tw/author.yaml` and `data/en/author.yaml`
- **Sections**: Modify files in `data/zh-tw/sections/` and `data/en/sections/`
- **Site Config**: Update `hugo.yaml` for global settings

### Custom Layouts

Custom layout overrides are located in the `layouts/` directory:
- `layouts/partials/navigators/lang-selector.html` - Language selector without flags
- `layouts/partials/navigators/navbar.html` - Custom navigation bar

## Key Features

- Bilingual support (Traditional Chinese / English)
- Responsive design optimized for all devices
- Custom navigation bar with transparent-to-solid transition
- Minimalist card-based layout
- No shadows or heavy visual effects
- Extended homepage banner (150vh height)

## License

This project is based on the Toha theme. Please refer to the original theme's license for usage terms.

## References

- [Hugo Documentation](https://gohugo.io/documentation/)
- [Toha Theme Guide](https://toha-guides.netlify.app/)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
