# homad-theme-review
Shopify Aceno theme for pixel tracking and cart debugging.

The `snippets/tracking-pixel.liquid` file now contains only the event tracking
logic. Load the Facebook and TikTok pixel libraries through Shopify's pixel
settings or a dedicated app. If you would rather include the libraries directly
in the theme, paste the standard scripts into that snippet above the event
handlers.

## Installation

1. Clone this repository and upload the contents to a new theme in your Shopify
   store.
2. To work locally with [Shopify CLI](https://shopify.dev/themes/tools/cli), run
   `shopify theme serve` in the project directory.
3. When you are ready to publish, use `shopify theme push` to deploy the theme
   to your store.

## Pixel configuration

The theme fires Meta and TikTok events via `snippets/tracking-pixel.liquid`.
Load the pixel scripts through Shopify or an app, then set the IDs under
**Tracking pixels**:

- **Meta pixel ID** – value for `settings.meta_pixel_id`
- **TikTok pixel ID** – value for `settings.tiktok_pixel_id`

Edit these fields in your theme settings instead of modifying the snippet
directly. Leaving an ID blank disables events for that pixel.

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

## Checkout payment info tracking

To track when a customer submits their payment details, include
`snippets/checkout-paymentinfo-tracking.liquid` in your checkout code. Paste it
into the **Additional scripts** box or, for Shopify Plus stores, add it to
`checkout.liquid`. The snippet fires `fbq('track', 'AddPaymentInfo')` and
`ttq.track('AddPaymentInfo')` when the payment method form is submitted.

## Debugging

Add `debug=true` to the page URL to enable verbose console output from the pixel
and cart scripts. Disable it by removing the query parameter once testing is
complete.

## Performance tips

This theme ships with pre-bundled, minified assets such as
`assets/vendor.min.js` and `assets/vendor.min.css` to reduce file size and
improve page load times. Keep custom code minified and combine files where
possible before deploying new changes.
