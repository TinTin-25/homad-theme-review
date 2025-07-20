# homad-theme-review
Shopify Aceno theme for pixel tracking and cart debugging.


## Installation

1. Clone this repository and upload the contents to a new theme in your Shopify
   store.
2. To work locally with [Shopify CLI](https://shopify.dev/themes/tools/cli), run
   `shopify theme serve` in the project directory.
3. When you are ready to publish, use `shopify theme push` to deploy the theme
   to your store.


## Pixel tracking

The theme includes built-in scripts that fire Meta and TikTok events automatically. No additional code changes are required.

## Debugging

Add `debug=true` to the page URL to enable verbose console output from the pixel
and cart scripts. Disable it by removing the query parameter once testing is
complete.

## Performance tips

This theme ships with pre-bundled, minified assets such as
`assets/vendor.min.js` and `assets/vendor.min.css` to reduce file size and
improve page load times. Keep custom code minified and combine files where
possible before deploying new changes.
