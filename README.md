# homad-theme-review

This repository contains the source for the Aceno Shopify theme used for pixel tracking and cart debugging.

## Local development

1. Install the [Shopify CLI](https://shopify.dev/apps/tools/cli) and run `shopify theme serve` to preview the theme locally.
2. After cloning the repository, run `npm install` to set up development dependencies.
3. Use `npm run lint` to check JavaScript style and `npm run build` to generate compiled assets (build step not yet configured).

## Contributing

Please submit pull requests for all changes. Keep sections organized and avoid removing existing functionality. Naming should be consistent and in English.

## Directory overview

- `assets/` – Compiled CSS and JavaScript files used by the theme.
- `sections/` – Individual content sections such as blog posts displays.
- `templates/` – JSON templates describing page structure.

This project is released under the [MIT License](./LICENSE).
