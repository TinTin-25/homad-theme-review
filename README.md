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

The theme embeds Meta and TikTok pixels directly via
`snippets/tracking-pixel.liquid`. The IDs are hard-coded in that file:

- Meta pixel ID: `1311883059920720`
- TikTok pixel ID: `D1ST0CRC77UBFMCUIAKG`

Modify the snippet if you need to change these values.

## Checkout purchase tracking

To track completed orders with Facebook and TikTok pixels,
include the new `snippets/checkout-purchase-tracking.liquid` snippet in your
checkout settings:

1. From your Shopify admin, go to **Settings → Checkout**.
2. Under **Order status page**, paste the contents of
   `snippets/checkout-purchase-tracking.liquid` into the **Additional scripts**
   box. Shopify Plus merchants can instead include the snippet in
   `checkout.liquid`.

The snippet reads the `checkout` object and fires `fbq('track', 'Purchase')`
and `ttq.track('Purchase')` once the order status page loads.

## Debugging

Add `debug=true` to the page URL to enable verbose console output from the pixel
and cart scripts. Disable it by removing the query parameter once testing is
complete.

## Performance tips

This theme ships with pre-bundled, minified assets such as
`assets/vendor.min.js` and `assets/vendor.min.css` to reduce file size and
improve page load times. Keep custom code minified and combine files where
possible before deploying new changes.
