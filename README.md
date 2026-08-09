# ivaylo.com

Personal website for Ivaylo Valirov, built as a dependency-free static site for GitHub Pages.

## Structure

```text
.
├── index.html          # Homepage
├── work.html           # Professional experience and résumé
├── personal.html       # Dogs, LEGO, and personal interests
├── thoughts.html       # Notes
├── tools.html          # Curated reference and utility links
├── 404.html            # GitHub Pages error page
└── assets/
    ├── css/             # Shared responsive styles
    ├── docs/            # Downloadable résumé
    ├── img/
    │   ├── gallery/     # LEGO and pet galleries
    │   ├── hero/        # Homepage and Life page hero imagery
    │   ├── profile/     # Work page portrait
    │   └── social/      # Link-preview images
    └── js/              # Navigation, motion, and page interactions
```

No build step is required. Open `index.html` locally or serve the repository with any static HTTP server. GitHub Pages can publish directly from the repository root; the `CNAME` file retains the `www.ivaylo.com` custom domain.
