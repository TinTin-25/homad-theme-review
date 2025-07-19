# homad-theme-review
Shopify Aceno theme for pixel tracking and cart debugging.

The snippets/tracking-pixel.liquid file loads the official Facebook Pixel and
TikTok Pixel scripts directly. If you prefer to inject these via a Shopify app,
comment out the script tags in that snippet and document the integration.

## Installation

1. Clone this repository and upload the contents to a new theme in your Shopify
   store.
2. To work locally with [Shopify CLI](https://shopify.dev/themes/tools/cli), run
   `shopify theme serve` in the project directory.
3. When you are ready to publish, use `shopify theme push` to deploy the theme
   to your store.

## Pixel configuration

The theme embeds Meta and TikTok pixels via `snippets/tracking-pixel.liquid`.
The pixel IDs can be set from the theme editor under **Tracking pixels**:

- **Meta pixel ID** – value for `settings.meta_pixel_id`
- **TikTok pixel ID** – value for `settings.tiktok_pixel_id`

Edit these fields in your theme settings instead of modifying the snippet
directly.

## Debugging

Add `debug=true` to the page URL to enable verbose console output from the pixel
and cart scripts. Disable it by removing the query parameter once testing is
complete.

## Performance tips

This theme ships with pre-bundled, minified assets such as
`assets/vendor.min.js` and `assets/vendor.min.css` to reduce file size and
improve page load times. Keep custom code minified and combine files where
possible before deploying new changes.
