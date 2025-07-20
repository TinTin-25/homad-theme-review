(function(){
  function fbTrack(ev, payload){
    if(typeof fbq === 'function') fbq('track', ev, payload);
  }
  function ttTrack(ev, payload){
    if(typeof ttq === 'object' && typeof ttq.track === 'function') ttq.track(ev, payload);
  }
  function ttPage(){
    if(typeof ttq === 'object' && typeof ttq.page === 'function') ttq.page();
  }

  if(window.analytics && typeof analytics.subscribe === 'function'){
    analytics.subscribe('page_viewed', function(){
      fbTrack('PageView');
      ttPage();
    });

    analytics.subscribe('view_content', function(event){
      fbTrack('ViewContent', event.data);
      ttTrack('ViewContent', event.data);
    });

    analytics.subscribe('add_to_cart', function(event){
      fbTrack('AddToCart', event.data);
      ttTrack('AddToCart', event.data);
    });

    analytics.subscribe('initiate_checkout', function(){
      fbTrack('InitiateCheckout');
      ttTrack('InitiateCheckout');
    });

    analytics.subscribe('search', function(event){
      fbTrack('Search', event.data);
      ttTrack('Search', event.data);
    });

    analytics.subscribe('add_to_wishlist', function(event){
      fbTrack('AddToWishlist', event.data);
      ttTrack('AddToWishlist', event.data);
    });

    analytics.subscribe('add_payment_info', function(){
      fbTrack('AddPaymentInfo');
      ttTrack('AddPaymentInfo');
    });

    analytics.subscribe('purchase', function(event){
      fbTrack('Purchase', event.data);
      ttTrack('Purchase', event.data);
    });

    analytics.subscribe('lead', function(){
      fbTrack('Lead');
      ttTrack('Lead');
    });
  }

  document.addEventListener('DOMContentLoaded', function(){
    document.body.addEventListener('submit', function(e){
      var form = e.target.closest('form');
      if(!form) return;
      if(form.matches('.contact-form, form[action*="contact"], form[action*="subscribe"]')){
        if(window.analytics && typeof analytics.publish === 'function'){
          analytics.publish('lead');
        }
      }
    });
  });
})();
