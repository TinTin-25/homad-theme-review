# homad-theme-review
Shopify Aceno theme for pixel tracking and cart debugging.

This theme no longer embeds pixel scripts directly.
Use Shopify **Customer Events** to manage your tracking pixels without editing theme files.

## Installation

1. Clone this repository and upload the contents to a new theme in your Shopify
   store.
2. To work locally with [Shopify CLI](https://shopify.dev/themes/tools/cli), run
   `shopify theme serve` in the project directory.
3. When you are ready to publish, use `shopify theme push` to deploy the theme
   to your store.

## Pixel configuration

Use Shopify **Customer Events** to create and manage your own pixels.
1. In the admin, go to **Settings → Customer events**.
2. Click **Create custom pixel** and paste your pixel code.
3. Subscribe to events such as `page_viewed` and `checkout_completed`.
4. Save and enable the pixel.

After enabling, place a test order and verify events with Facebook Pixel Helper or TikTok Pixel Helper.

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
