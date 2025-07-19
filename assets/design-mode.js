document.addEventListener('shopify:block:select', (event) => {
});
document.addEventListener('shopify:block:deselect', (event) => {
});
document.addEventListener('shopify:section:load', (event) => {
  var mainProduct = document.querySelector('[data-section-type="product-template"]');
  if (mainProduct) {
    new vela.Product('[data-section-type="product-template"]');
  }
});
document.addEventListener('shopify:section:reorder', (event) => {
});
document.addEventListener('shopify:section:select', (event) => {
  $('body').trigger('slideshow:carousel', '.js-vela-slideshow');
  $('body').trigger('carousel:init', '.js-carousel');
  $('body').trigger('vela:countdown', '[data-countdown]');
});
document.addEventListener('shopify:section:deselect', (event) => {
});
document.addEventListener('shopify:inspector:activate', (event) => {
});
document.addEventListener('shopify:inspector:deactivate', (event) => {
});
