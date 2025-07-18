window.vela = window.vela || {};

vela.Disclosure = (function() {
  var selectors = {
    disclosureInput: '[data-disclosure-input]',
    disclosureOptions: '[data-disclosure-option]'
  };

  function Disclosure($disclosure) {
    this.$container = $disclosure;
    this.cache = {};
    this._cacheSelectors();
    this._connectOptions();
  }

  Disclosure.prototype = {
    _cacheSelectors: function() {
      this.cache = {
        $disclosureInput: this.$container.find(selectors.disclosureInput),
        $disclosureOptions: this.$container.find(selectors.disclosureOptions)
      };
    },

    _connectOptions: function() {
      this.cache.$disclosureOptions.on(
        'click',
        function(evt) {
          evt.preventDefault();
          this._submitForm($(evt.currentTarget).data('value'));
        }.bind(this)
      );
    },

    _submitForm: function(value) {
      this.cache.$disclosureInput.val(value);
      this.$container.parents('form').submit();
    },

    unload: function() {
      this.cache.$disclosureOptions.off();
      this.$container.off();
    }
  };

  return Disclosure;
})();

vela.Currency = (function() {
  var moneyFormat = '${{amount}}';
  function formatMoney(cents, format) {
    if (typeof cents === 'string') {
      cents = cents.replace('.', '');
    }
    var value = '';
    var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
    var formatString = format || moneyFormat;

    function formatWithDelimiters(number, precision, thousands, decimal) {
      thousands = thousands || ',';
      decimal = decimal || '.';
      if (isNaN(number) || number === null) {
        return 0;
      }
      number = (number / 100.0).toFixed(precision);
      var parts = number.split('.');
      var dollarsAmount = parts[0].replace(
        /(\d)(?=(\d\d\d)+(?!\d))/g,
        '$1' + thousands
      );
      var centsAmount = parts[1] ? decimal + parts[1] : '';
      return dollarsAmount + centsAmount;
    }

    switch (formatString.match(placeholderRegex)[1]) {
      case 'amount':
        value = formatWithDelimiters(cents, 2);
        break;
      case 'amount_no_decimals':
        value = formatWithDelimiters(cents, 0);
        break;
      case 'amount_with_comma_separator':
        value = formatWithDelimiters(cents, 2, '.', ',');
        break;
      case 'amount_no_decimals_with_comma_separator':
        value = formatWithDelimiters(cents, 0, '.', ',');
        break;
      case 'amount_no_decimals_with_space_separator':
        value = formatWithDelimiters(cents, 0, ' ');
        break;
      case 'amount_with_apostrophe_separator':
        value = formatWithDelimiters(cents, 2, "'");
        break;
    }
    return formatString.replace(placeholderRegex, value);
  }
  return {
    formatMoney: formatMoney
  };
})();

vela.resizeImage = function (m, j) {
  if (j == null) {
      return m;
  }
  if (j == "master") {
      return m.replace(/http(s)?:/, "");
  }
  var i = m.match(/\.(jpg|jpeg|gif|png|bmp|bitmap|tiff|tif|webp)(\?v=\d+)?/i);
  if (i != null) {
      var k = m.split(i[0]);
      var l = i[0];
      return (k[0] + "_" + j + l).replace(/http(s)?:/, "");
  } else {
      return null;
  }
}

if (typeof ShopifyAPI === 'undefined') {
  ShopifyAPI = {};
}

ShopifyAPI.attributeToString = function(attribute) {
  if (typeof attribute !== 'string') {
    attribute += '';
    if (attribute === 'undefined') {
      attribute = '';
    }
  }
  return jQuery.trim(attribute);
}

ShopifyAPI.onCartUpdate = function() {
  // When cart update
};

ShopifyAPI.updateCartNote = function(note, callback) {
  var params = {
    type: 'POST',
    url: '/cart/update.js',
    data: 'note=' + ShopifyAPI.attributeToString(note),
    dataType: 'json',
    success: function(cart) {
      if (typeof callback === 'function') {
        callback(cart);
      } else {
        ShopifyAPI.onCartUpdate(cart);
      }
    },
    error: function(XMLHttpRequest, textStatus) {
      ShopifyAPI.onError(XMLHttpRequest, textStatus);
    }
  };
  jQuery.ajax(params);
};

ShopifyAPI.onError = function(XMLHttpRequest) {
  var data = eval('(' + XMLHttpRequest.responseText + ')');
  if (data.message) {
    alert(data.message + '(' + data.status + '): ' + data.description);
  }
};

ShopifyAPI.addItemFromForm = function(form, callback, errorCallback) {
  var formData = new FormData(form);
  var params = {
    type: 'POST',
    url: '/cart/add.js',
    data: formData,
    processData: false,
    contentType: false,
    dataType: 'json',
    success: function(line_item) {
      if (typeof callback === 'function') {
        callback(line_item, form);
      } else {
        ShopifyAPI.onItemAdded(line_item, form);
      }
    },
    error: function(XMLHttpRequest, textStatus) {
      if (typeof errorCallback === 'function') {
        errorCallback(XMLHttpRequest, textStatus, form);
      } else {
        ShopifyAPI.onError(XMLHttpRequest, textStatus);
      }
    }
  };
  jQuery.ajax(params);
};

ShopifyAPI.getCart = function(callback, added) {
  jQuery.getJSON('/cart.js', function(cart) {
    if (typeof callback === 'function') {
      callback(cart, added);
    } else {
      ShopifyAPI.onCartUpdate(cart);
    }
  });
};

ShopifyAPI.changeItem = function(line, quantity, callback) {
  var params = {
    type: 'POST',
    url: '/cart/change.js',
    data: 'quantity=' + quantity + '&line=' + line,
    dataType: 'json',
    success: function(cart) {
      if (typeof callback === 'function') {
        callback(cart);
      } else {
        ShopifyAPI.onCartUpdate(cart);
      }
    },
    error: function(XMLHttpRequest,cart) {
          var data = eval('(' + XMLHttpRequest.responseText + ')');
          if (data.message) {
            if (data.status === 422) {
              var $toast = $('.ajaxcart-toast');
              $toast.find('.toast-body').html(data.description);
              $toast.toast('show');
            }
          }
          callback(cart);
    }
  };
  jQuery.ajax(params);
};

var ajaxCart = (function(module, $) {
  'use strict';

  // Public functions
  var init, loadCart;

  // Private general variables
  var settings, isUpdating, $body;

  // Private plugin variables
  var $formContainer,
    $cartCountSelector,
    $cartCostSelector,
    $cartContainer;

  // Private functions
  var initializeEvents,
    updateCountPrice,
    formOverride,
    itemAddedCallback,
    itemErrorCallback,
    cartModalAdded,
    cartUpdateCallback,
    buildCart,
    cartCallback,
    shippingBar,
    adjustCart,
    adjustCartCallback,
    validateQty;

  /*============================================================================
    Initialise the plugin and define global options
 ==============================================================================*/
  init = function(options) {
    // Default settings
    settings = {
      formSelector: '[data-product-form]',
      cartContainer: '[data-cart-container]',
      addToCartSelector: 'button[type="submit"]',
      cartCountSelector: '[data-cart-count]',
      cartCostSelector: '[data-cart-cost]',
      cartRemoveSelector: '[data-cart-remove]',
      headerCartSelector: '.js-header-cart',
      cartModalSelector: '.js-cart-modal',
      cartModalCloseSelector: '.js-cart-modal-close',
      moneyFormat: vela.strings.moneyFormat,
      disableAjaxCart: false,
      cartTemplate: '#ajaxcart-template',
      cartModalHeaderTemplate: '#ajaxcart-header-template'
    };

    // Override defaults with arguments
    $.extend(settings, options);

    // Select DOM elements
    $formContainer = $(settings.formSelector);
    $cartContainer = $(settings.cartContainer);
    $cartCountSelector = $(settings.cartCountSelector);
    $cartCostSelector = $(settings.cartCostSelector);

    $body = $('body');
    isUpdating = false;
    initializeEvents();
    if (!settings.disableAjaxCart) {
      formOverride();
    }
    adjustCart();
  };

  initializeEvents = function() {
    $body.on('click', settings.cartModalCloseSelector, function() {
      $(settings.cartModalSelector).fadeOut(400, function() {
        $(this).remove();
      });
      $(settings.cartModalSelector).removeClass('show');
    });

    $body.on('click', settings.headerCartSelector, function(e) {
      if (vela.settings.cartType == 'modal' && $(window).width() > 767 && !$('body').hasClass('template-cart')) {
        e.preventDefault();
        return;
      }
    });

    $body.on('click', settings.cartRemoveSelector, function(e) {
      if (isUpdating) {
        return;
      }
      var $el = $(this),
        line = $el.data('line');
      if (line) {
        isUpdating = true;
        setTimeout(function() {
          ShopifyAPI.changeItem(line, 0, adjustCartCallback);
        }, 250);
      }
    });

    $body.on('change', '.ajaxcart__note-input', function() {
      var newNote = $(this).val();
      ShopifyAPI.updateCartNote(newNote, function() {});
    });
    $body.on('change', '.coupon_code_input', function() {
      var newDiscount = $(this).val();
      vela.setCookie('vela_discount', newDiscount, 1);
    });
  };

  loadCart = function(isOpen = false) {
    if (vela.settings.cartType !== 'page') {
      if($('.js-drawer').length > 0 || $('[data-cart-container]').length > 0 ) {
        $body.addClass('ajaxcart--is-loading');
      }
      ShopifyAPI.getCart(cartUpdateCallback, isOpen);
    } else {
      window.location.replace(window.location.origin + routes.cart_url);
    }
  };

  updateCountPrice = function(cart) {
    if ($cartCountSelector) {
      $cartCountSelector.html(cart.item_count);
    }
    if ($cartCostSelector) {
      $cartCostSelector.html(
        vela.Currency.formatMoney(cart.total_price, vela.strings.moneyFormat)
      );
    }
  };

  formOverride = function() {
    $body.on('submit', settings.formSelector, function(evt) {
      evt.preventDefault();
      var $addToCart = $(evt.target).find(settings.addToCartSelector);
      $addToCart.prepend('<span class="spinner-border spinner-border-sm"></span>');
      $addToCart.addClass('is-adding');
      $('.ajaxcart-toast').toast('hide');
      ShopifyAPI.addItemFromForm(evt.target, itemAddedCallback, itemErrorCallback);
    });
  };

  itemAddedCallback = function(lineItem, form) {
    var $addToCart = $(form).find(settings.addToCartSelector);
    $addToCart.find('.spinner-border').remove();
    $addToCart.removeClass('is-adding');
    if (vela.settings.cartType == 'modal') {
      cartModalAdded(lineItem);
    }

    // Close bootstrap modal
    if ($('[data-quickview]').length > 0) {
      $('[data-quickview]').modal('hide');
    }
    if ($('[data-quickadd]').length > 0) {
      $('[data-quickadd]').modal('hide');
    }
    ShopifyAPI.getCart(cartUpdateCallback, true);
  };

  itemErrorCallback = function(XMLHttpRequest, textStatus, form) {
    var data = eval('(' + XMLHttpRequest.responseText + ')');
    var $addToCart = $(form).find(settings.addToCartSelector);
    $addToCart.find('.spinner-border').remove();
    $addToCart.removeClass('is-adding');

    if (data.message) {
      if (data.status === 422) {
        var $toast = $('.ajaxcart-toast');
        $toast.find('.toast-body').html(data.description);
        $toast.toast('show');
      }
    }
  };

  cartModalAdded = function(lineItem) {
    var data = {},
      image = '//cdn.shopify.com/s/assets/admin/no-image-medium-cc9732cb976dd349a0df1d39816fbcc7.gif',
      source = $(settings.cartModalHeaderTemplate).html(),
      pre_order = false,
      template = Handlebars.compile(source);
    if (lineItem.image != null) {
      image = lineItem.image;
    }
    $('.pre_order-cart >span').each(function(){
      var preOrder_prohandle = $(this).data('handle');
      if( lineItem.handle == preOrder_prohandle ) {
        pre_order = true;
      }
    });
    data = {
      name: lineItem.product_title,
      image: image,
      pre_order: pre_order,
      variation: lineItem.variant_title === null ? false : true,
      options: lineItem.options_with_values,
      price: vela.Currency.formatMoney(
        lineItem.final_price,
        vela.strings.moneyFormat
      )
    }

    $body.append(template(data));
    $('.js-cart-modal').fadeIn(400);
    $('.js-cart-modal').addClass('show');
  };

  cartUpdateCallback = function(cart, added) {
    updateCountPrice(cart);
    buildCart(cart);
    if (added) {
      $body.trigger('drawer.open');
    }
  };

  buildCart = function(cart) {
    $cartContainer.empty();
    if ( vela.settings.shippingBarEnable) {
      shippingBar(cart);
    }
    // Show empty cart
    if (cart.item_count === 0) {
      $cartContainer.append(
        '<div class="cart-empty-message"><div class="icon-cart-empty"></div>' +
          vela.strings.cartEmpty +
          '</div>\n' +
          '<div class="cookie-message">' +
          vela.strings.cartCookies +
          '</div>'
      );

      cartCallback(cart);
      return;
    }
    var items = [],
      item = {},
      data = {},
      source = $(settings.cartTemplate).html();

    var template = Handlebars.compile(source);

    $.each(cart.items, function(index, cartItem) {
      var prodImg;
      var unitPrice = null;
      if (cartItem.image !== null) {
        prodImg = cartItem.image
          .replace(/(\.[^.]*)$/, '_medium$1')
          .replace('http:', '');
      } else {
        prodImg =
          '//cdn.shopify.com/s/assets/admin/no-image-medium-cc9732cb976dd349a0df1d39816fbcc7.gif';
      }

      if (cartItem.properties !== null) {
        $.each(cartItem.properties, function(key, value) {
          if (key.charAt(0) === '_' || !value) {
            delete cartItem.properties[key];
          }
        });
      }

      if (cartItem.properties !== null) {
        $.each(cartItem.properties, function(key, value) {
          if (key.charAt(0) === '_' || !value) {
            delete cartItem.properties[key];
          }
        });
      }

      if (cartItem.line_level_discount_allocations.length !== 0) {
        for (var discount in cartItem.line_level_discount_allocations) {
          var amount =
            cartItem.line_level_discount_allocations[discount].amount;

          cartItem.line_level_discount_allocations[
            discount
          ].formattedAmount = vela.Currency.formatMoney(
            amount,
            vela.strings.moneyFormat
          );
        }
      }

      if (cart.cart_level_discount_applications.length !== 0) {
        for (var cartDiscount in cart.cart_level_discount_applications) {
          var cartAmount =
            cart.cart_level_discount_applications[cartDiscount]
              .total_allocated_amount;

          cart.cart_level_discount_applications[
            cartDiscount
          ].formattedAmount = vela.Currency.formatMoney(
            cartAmount,
            vela.strings.moneyFormat
          );
        }
      }

      if (cartItem.unit_price_measurement) {
        unitPrice = {
          addRefererenceValue:
            cartItem.unit_price_measurement.reference_value !== 1,
          price: vela.Currency.formatMoney(
            cartItem.unit_price,
            vela.strings.moneyFormat
          ),
          reference_value: cartItem.unit_price_measurement.reference_value,
          reference_unit: cartItem.unit_price_measurement.reference_unit
        };
      }

      // Create item's data object and add to 'items' array
      item = {
        key: cartItem.key,
        line: index + 1, // Shopify uses a 1+ index in the API
        url: cartItem.url,
        img: prodImg,
        name: cartItem.product_title,
        prodHandle: cartItem.handle,
        variation: cartItem.variant_title === null ? false : true,
        variant: cartItem.variant,
        options: cartItem.options_with_values,
        variant_id: cartItem.variant_id,
        properties: cartItem.properties,
        itemAdd: cartItem.quantity + 1,
        itemMinus: cartItem.quantity - 1,
        itemQty: cartItem.quantity,
        price: vela.Currency.formatMoney(
          cartItem.original_line_price,
          vela.strings.moneyFormat
        ),
        discountedPrice: vela.Currency.formatMoney(
          cartItem.final_line_price,
          vela.strings.moneyFormat
        ),
        discounts: cartItem.line_level_discount_allocations,
        discountsApplied:cartItem.line_level_discount_allocations.length === 0 ? false : true,
        vendor: cartItem.vendor,
        unitPrice: unitPrice
      };

      items.push(item);
    });

    // Gather all cart data and add to DOM
    data = {
      items: items,
      lastLineItemID: cart.items[cart.items.length - 1].product_id,
      note: cart.note,
      totalPrice: vela.Currency.formatMoney(
        cart.total_price,
        vela.strings.moneyFormat
      ),
      cartDiscounts: cart.cart_level_discount_applications,
      cartDiscountsApplied: cart.cart_level_discount_applications.length === 0 ? false : true
    };
    $cartContainer.append(template(data));
    cartCallback(cart);
    var discount_code = vela.getCookie('vela_discount');
    if( discount_code ) {
      $(".js-drawer .coupon_code_input").val(discount_code);
    }
    var gift_proHandle = $(".ajaxcart__gift--button").data("prohandle");
    $.each(data.items, function() {
      $.each(this, function( index , value) {
        if(( index == "prodHandle" && value == gift_proHandle )) {
          $(".ajaxcart__gift--button").addClass("d-none");
        }
      });
    });
    
    $('.pre_order-cart >span').each(function(){
      var preOrder_prohandle = $(this).data('handle');
      $.each(data.items, function( index , value) {
        var editButton = $('.ajaxcart__product[data-line="'+ value.line + '"]').find('.js-ajaxcart-edit');
        if(value.prodHandle == preOrder_prohandle ) {
          $('.ajaxcart__product[data-line="'+ value.line + '"] .pro_preorder').removeClass('d-none');
          if (editButton.length > 0) {
            editButton.attr('data-pre-order', true);
          }
        } else {
          if (editButton.length > 0) {
            editButton.attr('data-pre-order', false);
          }
        }
      });
     
    });
  };
  shippingBar = function(cart) {  
    var shipping_value = $('.shipping-bar-cart').data('shipping_value');
    if( (shipping_value > cart.total_price) && shipping_value != 0){
      var minus_spend = shipping_value - cart.total_price;
      var spend = vela.Currency.formatMoney(minus_spend,settings.moneyFormat);
      var percent	= cart.total_price/shipping_value*100;
      $('.shipping-bar-cart .title-spend .spend').html(spend);
      $('.shipping-bar-cart .progress-bar').css("width",percent+"%");
      if (cart.item_count === 0) {
        $('.shipping-bar-cart').removeClass('shipping-progress');
        $('.shipping-bar-cart').removeClass('shipping-free');
      } else {
        $('.shipping-bar-cart').removeClass('shipping-free');
        $('.shipping-bar-cart').addClass('shipping-progress');
      }
    }else {
      $('.shipping-bar-cart').addClass('shipping-free');
      $('.shipping-bar-cart').addClass('effect');
      $('.shipping-bar-cart').removeClass('shipping-progress');
      $('.shipping-bar-cart .progress-bar').css("width","100%");
      setTimeout(function() {
        $('.shipping-bar-cart').removeClass('effect');
      },5000);
    }
  };
  cartCallback = function(cart) {
    $body.removeClass('ajaxcart--is-loading');
    $body.trigger("ajaxCart.afterCartLoad", cart);
    if (window.Shopify && Shopify.StorefrontExpressButtons) {
      Shopify.StorefrontExpressButtons.initialize();
    }
    $body.trigger('drawer.footer');
  };

  adjustCart = function() {
    $body.on('click', '.ajaxcart__qty-adjust', function() {
      if (isUpdating) {
        return;
      }
      var $el = $(this),
        line = $el.data('line'),
        $qtySelector = $el.siblings('.ajaxcart__qty-num'),
        qty = parseInt($qtySelector.val().replace(/\D/g, ''));

      qty = validateQty(qty);

      if ($el.hasClass('ajaxcart__qty--plus')) {
        qty += 1;
      } else {
        qty -= 1;
        if (qty <= 0) qty = 0;
      }

      if (line) {
        updateQuantity(line, qty);
      } else {
        $qtySelector.val(qty);
      }
    });

    $body.on('change', '.ajaxcart__qty-num', function() {
      if (isUpdating) {
        return;
      }
      var $el = $(this),
        line = $el.data('line'),
        qty = parseInt($el.val().replace(/\D/g, ''));

      qty = validateQty(qty);

      if (line) {
        updateQuantity(line, qty);
      }
    });

    $body.on('click', '.ajaxcart__qty-num', function() {
      $(this).select();
    });

    $body.on('submit', 'form.ajaxcart', function(evt) {
      if (isUpdating) {
        evt.preventDefault();
      }
    });

    $body.on('focus', '.ajaxcart__qty-adjust', function() {
      var $el = $(this);
      setTimeout(function() {
        $el.select();
      }, 50);
    });

    function updateQuantity(line, qty) {
      isUpdating = true;

      var $row = $('.ajaxcart__product[data-line="' + line + '"]').addClass(
        'is-loading'
      );

      if (qty === 0) {
        $row.parent().addClass('is-removed');
      }

      setTimeout(function() {
        ShopifyAPI.changeItem(line, qty, adjustCartCallback);
      }, 250);
    }
  };

  adjustCartCallback = function(cart) {
    updateCountPrice(cart);
    setTimeout(function() {
      ShopifyAPI.getCart(buildCart);
      isUpdating = false;
    }, 150);
  };

  validateQty = function(qty) {
    if (parseFloat(qty) === parseInt(qty) && !isNaN(qty)) {
      // We have a valid number!
    } else {
      qty = 1;
    }
    return qty;
  };
  
  module = {
    init: init,
    load: loadCart
  };

  return module;

})(ajaxCart || {}, jQuery);

vela.drawerCart = (function(module) {
  var $body, $drawer, drawerCloseSelector, headerCartSelector, drawerIsOpen;

  var init, drawerOpen, drawerClose, drawerFooter;

  var classes = {
    open: 'drawer--open'
  };

  init = function() {
    $body = $('body');
    $drawer = $('.js-drawer');
    drawerCloseSelector = '.js-drawer-close';
    headerCartSelector = '.js-header-cart';
    drawerIsOpen = false;

    $body.on('drawer.open', function(evt) {
      drawerOpen(evt);
    });

    $body.on('drawer.close', function(evt) {
      drawerClose(evt);
    });

    $body.on('drawer.footer', function() {
      drawerFooter();
    });

    $body.on('click', headerCartSelector, function(evt) {
      evt.preventDefault();
      $body.trigger('drawer.open', evt);
    });

    $body.on('click', drawerCloseSelector, function(evt) {
      evt.preventDefault();
      $body.trigger('drawer.close', evt);
    });
  };

  drawerOpen = function(evt) {
    if (drawerIsOpen) {
      if (evt) {
        evt.preventDefault();
      }
      return;
    }

    if (evt) {
      evt.preventDefault();
    }

    $body.addClass(classes.open);
    drawerIsOpen = true;
  };

  drawerClose = function(evt) {
    if (!drawerIsOpen) {
      return;
    }

    if (evt.keyCode !== 27) {
      evt.preventDefault();
    }

    $body.removeClass(classes.open);
    drawerIsOpen = false;
  };

  drawerFooter = function() {
    if (!$drawer.hasClass('drawer--has-fixed-footer')) {
      return;
    }
    var $cartFooter = $('.ajaxcart__footer').removeAttr('style');
    var $cartInner = $('.ajaxcart__inner').removeAttr('style');
    var cartFooterHeight = $cartFooter.outerHeight();
    $('.drawer__inner').css('top', ( $('.drawer__header').outerHeight() + 15));
    $cartInner.css('bottom', cartFooterHeight);
    $cartFooter.css('height', cartFooterHeight);
    if(vela.settings.shippingCalcEnable) {
      Shopify.Cart.ShippingCalculator.show( {
        submitButton: vela.settings.shippingCalcSubmitButton,
        submitButtonDisabled: vela.settings.shippingCalcSubmitButtonDisabled,
        customerIsLoggedIn: vela.settings.shippingCalcCustomerIsLoggedIn,
        moneyFormat: vela.strings.shop_money_with_currency_format
      });
    }
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl)
    });
  };

  module = {
    init: init
  }

  return module;
})();

vela.variables = {
  productPageLoad: false,
  productPageSticky: true,
  mediaTablet: 'screen and (max-width: 1024px)',
  mediaMobile: 'screen and (max-width: 767px)',
  isTablet: false,
  isMobile: false
};

vela.initializeEvents = function() {
  var $body = $('body'),
    passwordToggle = '.js-password-toggle',
    scrollToTop = '.js-scroll-to-top',
    collectionSidebarToggle = '.js-sidebar-toggle';
  var classes = {
    passwordShow: 'password-toggle--show'
  };
  $body.on('click', passwordToggle, function(e) {
    e.preventDefault();
    var $this = $(this);
    var $passwordField = $this.siblings('.form-control');
    var isShow = $this.hasClass(classes.passwordShow) ? true : false;
    if (isShow) {
      $this.removeClass(classes.passwordShow);
      $passwordField.attr('type', 'password');
    } else {
      $this.addClass(classes.passwordShow);
      $passwordField.attr('type', 'text');
    }
  });

  $body.on('click', scrollToTop, function(e) {
    e.preventDefault();
    $('body, html').stop().animate({ scrollTop: 0 }, '500');
  });

  $body.on('click', collectionSidebarToggle,function(evt) {
    evt.preventDefault();
    $body.toggleClass('collection-sidebar--open');
  });

  $(window).scroll(function() {
    if ($(window).scrollTop() >= 200) {
      $(scrollToTop).fadeIn();
    } else {
      $(scrollToTop).fadeOut();
    }
  });
};

vela.setBreakpoints = function() {
  enquire.register(vela.variables.mediaTablet, {
    match: function() {
      vela.variables.isTablet = true;
    },
    unmatch: function() {
      vela.variables.isTablet = false;
    }
  });
  enquire.register(vela.variables.mediaMobile, {
    match: function() {
      vela.variables.isMobile = true;
    },
    unmatch: function() {
      vela.variables.isMobile = false;
    }
  });
};

vela.updateSlickSwipe = function(element, allowSwipe){
  if (!element.hasClass('slick-initialized')) {
    return;
  }
  var slickOptions = {
    accessibility: allowSwipe,
    draggable: allowSwipe,
    swipe: allowSwipe,
    touchMove: allowSwipe
  };
  element.slick('slickSetOption', slickOptions, false);
};

vela.showLoading = function () {
  $('body').append(vela.loading != undefined && vela.loading != '' ? vela.loading : '');
};

vela.hideLoading = function() {
  $('.vela-loading').remove();
};

vela.cartInit = function() {
  if (vela.settings.cartType == 'modal' || vela.settings.cartType == 'drawer') {
    ajaxCart.init();
    ajaxCart.load();

    if (vela.settings.cartType == 'drawer') {
      vela.drawerCart.init();
    }
  }
};

vela.slideshow = function() {
  var slideshow = '.js-vela-slideshow';
  $('body').on('slideshow:carousel', function(event, classes) {
    $(classes).each(function() {
      var $element = $(this);
      var fade = $element.data('fade');
      var autoplay = $element.data('autoplay');
      var autoplayInterval = $element.data('autoplayinterval');
      var autoplayNavigation = $element.data('navigation');
      var autoplayPagination = $element.data('pagination');
      var config = {
        fade: true,
        rows: 0,
        arrows: autoplayNavigation,
        autoplay: autoplay,
        autoplaySpeed: autoplayInterval
      };
  
      (fade === undefined || fade == null) ? true : config.fade = fade;
      (autoplayInterval === undefined || autoplayInterval == null) ? true : config.autoplaySpeed = autoplayInterval;
      (autoplayPagination === undefined || autoplayPagination == null || autoplayPagination != true) ? config.dots = false : config.dots = true;
  
      if (!$element.hasClass('slick-initialized')) {
        $element.slick(config);
      }
    });

    $('.hvduc-sheading').each(function() {
      var $element = $(this);
      if (!$element.hasClass('slick-initialized')) {
        $element.slick({
          rows: 0,
          arrows: false,
          infinite: true,
          vertical: true,
          speed: 0,
          draggable: false,
        });

        setInterval(function() {
          $element.find('.slick-active').addClass('hvduc-outup');
          setTimeout(function() {
            $element.find('.hvduc-outup').removeClass('hvduc-outup');
            $element.slick('slickNext');
          }, 200);
        }, 3000);
      }
    });
  });

  $('body').trigger('slideshow:carousel', slideshow);
};

vela.slickCarousel = function() {
  var velCarousel = '.js-carousel';
  $('body').on('carousel:init', function(event, classes) {
    $(classes).each(function() {
      var $element = $(this),
        nav = $element.data('nav'),
        dots = $element.data('dots'),
        center = $element.data('center'),
        infinite = $element.data('infinite'),
        autoplay = $element.data('autoplay'),
        autoplaySpeed = $element.data('autoplayspeed'),
        speedSlide = $element.data('speedslide'),
        columnone = $element.data('columnone'),
        columntwo = $element.data('columntwo'),
        columnthree = $element.data('columnthree'),
        columnfour = $element.data('columnfour'),
        variableWidth = $element.data('variablewidth'),
        slideVertical = $element.data('vertical'),
        slidefade = $element.data('fade'),
        rows = $element.data('rows');
        (variableWidth === undefined || variableWidth == null || variableWidth != true) ? variableWidth = false : variableWidth = true;
        (slideVertical === undefined || slideVertical == null || slideVertical != true) ? slideVertical = false : slideVertical = true;
        (slidefade  === undefined || slidefade  == null || slidefade  != true) ? slidefade  = false : slidefade = true;
      var config = {
        arrows: nav,
        vertical: slideVertical,
        slidesToShow: columnone,
        slidesToScroll: 1,
        fade: slidefade,
        responsive: [
          {
            breakpoint: 992,
            settings: {
              slidesToShow: columntwo,
              slidesToScroll: 1
            }
          },
          {
            breakpoint: 768,
            settings: {
              slidesToShow: columnthree,
              slidesToScroll: columnthree,
              touchMove: true,
              variableWidth: variableWidth
            }
          }
        ]
      };
      (center === undefined || center == null || center != true) ? config.centerMode = false : config.centerMode = true;
      (dots === undefined || dots == null || dots != true) ? config.dots = false : config.dots = true;
      (infinite === undefined || infinite == null || infinite != true) ? config.infinite = false : config.infinite = true;
      (speedSlide === undefined || speedSlide == null) ? config.speed = '400' : config.speed = speedSlide;
      if (autoplay) {
        config.autoplay = autoplay;
        config.autoplaySpeed = autoplaySpeed;
        config.cssEase = "linear";
      }
      if (rows !== undefined && rows != null && rows != 1) {
        config.rows = rows;
        config.slidesPerRow = columnone;
        config.slidesToShow = 1,
        config.responsive = [
          {
            breakpoint: 992,
            settings: {
              slidesPerRow: columntwo,
              slidesToShow: 1
            }
          },
          {
            breakpoint: 768,
            settings: {
              variableWidth: true,
              slidesPerRow: columnthree,
              slidesToShow: 1
            }
          },
          {
            breakpoint: 576,
            settings: {
              slidesPerRow: columnfour,
              slidesToShow: 1
            }
          }
        ]
      } else {
        config.rows = 0;
      }
      if (!$element.hasClass('slick-initialized')) {
        $element.slick(config);
      }
      function updateItemWidth() {
        var itemSpace = (16*columnthree) + 24;
        var itemWidth = Math.round((window.innerWidth - itemSpace) / (columnthree + 0.5)) + 'px';
        var m_itemSpace = (16*columnfour) + 24;
        var m_itemWidth = Math.round((window.innerWidth - m_itemSpace) / (columnfour + 0.5)) + 'px';
        $element.css({"--card-w-sm": m_itemWidth, "--card-w": itemWidth});
      } 
      if(variableWidth) {
        updateItemWidth();
        $(window).resize(updateItemWidth);
      }
    });
  });
  $('body').trigger('carousel:init', velCarousel);
  $('.product-tabs__nav-link').on('shown.bs.tab', function() {
    var productTabs = $(this).closest('.product-tabs');
    if (productTabs.find(velCarousel).length > 0) {
      productTabs.find(velCarousel).slick('setPosition');
    }
  });
};

vela.countdown = function() {
  $('body').on('vela:countdown', function(event, classes) {
    $(classes).each(function() {
      var $element = $(this);
      var finalDate = $element.data('countdown');
      
      $element.countdown(finalDate, function(event) {
        var strTime = '<div class="countdown__item"><span>%D</span><span>' + vela.strings.countdownDays + '</span></div>' +
          '<div class="countdown__item"><span>%H</span><span>' + vela.strings.countdownHours + '</span></div>' +
          '<div class="countdown__item"><span>%M</span><span>' + vela.strings.countdownMinutes + '</span></div>' +
          '<div class="countdown__item"><span>%S</span><span>' + vela.strings.countdownSeconds + '</span></div>';
        $element.html(event.strftime(strTime));
      })
      .on('finish.countdown', function() {
        $element.html(vela.strings.countdownFinish);
      });
    });
  });

  var countdown = '[data-countdown]';
  $('body').trigger('vela:countdown', countdown);
};

vela.newsletter = function() {
  var alertNewsletter = function(message, type) {
    return `<div class="js-alert-newsletter alert-dismissible fade show alert alert--mailchimp alert-${type}">${message} <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>`;
  };

  $('.js-vela-newsletter').each(function() {
    var $form = $(this);
    $form.on('submit', function(event) {
      event.preventDefault();
      $('.js-alert-newsletter').remove();

      $.ajax({
        type: $form.attr('method'),
        url: $form.attr('action'),
        data: $form.serialize(),
        cache: false,
        dataType: 'json',
        contentType: 'application/json; charset=utf-8',
        success: function(data) {
          if (data.result === 'success') {
            $form.prepend(alertNewsletter(vela.strings.newsletterSuccess ,'success'));
            $('.js-input-newsletter').val('');
          } else {
            $form.prepend(alertNewsletter(data.msg.replace('0 - ', '') ,'danger'));
          }
        },
        error: function(err) {
          $form.prepend(alertNewsletter(err ,'danger'));
        }
      });
    });
  });

  // NEWSLETTER POPUP
  var newsletterCookie = 'vela_newsletter_popup';
  var newsletterPopup = '.js-newsletter-popup';
  var newsletterPopupClose = '.js-newsletter-popup-close';
  var newsletterPopupDontShowAgain = '[data-newsletter="dontshowagain"]';
  var classNameNewsletterActive = 'adv-popup--active';

  if (vela.getCookie(newsletterCookie) === 'true') {
    $(newsletterPopup).remove();
  } else {
    setTimeout(function() {
      $(newsletterPopup).addClass(classNameNewsletterActive);
    }, 5000);
  }

  $(newsletterPopup).on('click', newsletterPopupClose, function() {
    $(newsletterPopup).removeClass(classNameNewsletterActive);
  });

  $(newsletterPopup).on('click', newsletterPopupDontShowAgain, function() {
    vela.setCookie(newsletterCookie, true, 30);
    $(newsletterPopup).removeClass(classNameNewsletterActive);
  });
};
vela.velaBannerTop = function () {
  cBannerTop = vela.getCookie('velaBannerTop');
  if (cBannerTop == 1) $('#bannerTop').remove();
  $('#bannerTop .btn-bannerTop').on('click', function() {
    vela.setCookie('velaBannerTop', 1, 30);
    $('#bannerTop').remove();
  });
};
vela.swatchProduct = function() {
  $('.product-card__swatch--list .more_option').on( "click", function() {
    $(this).toggleClass('more_option_active');
    $(this).parent().find('.extendlink').toggleClass('more_option_item');
  });
	$( ".product-card__swatch--list > li" ).click(function() {
    $(this).parent('.product-card__swatch--list').find('li').removeClass('is-active');
    $(this).addClass('is-active');
    var newImageSrc = $(this).find('.d-none .swatch-variant_item').data('src');
    var newImageSrcset = $(this).find('.d-none .swatch-variant_item').data('bgset');
    var imgSecondary = $(this).parents('.product-grid__inner').find('.img-secondary img');
    
    if (newImageSrc != 'undefined'){
      if(imgSecondary.length > 0) {
        imgSecondary.attr({ src: newImageSrc , srcset: newImageSrcset });
      }
      $(this).parents('.product-grid__inner').find('.product-card__img-primary img').attr({ src: newImageSrc , srcset: newImageSrcset });
    }
    return false;
  });
}
vela.showPassWord = function() {
  $('.showPass').on( "click", function() {
    var parent = $(this).closest('.position-relative');
    var inputPass = $(parent).find('.hidden-label');
    var iconEye = $(parent).find('.eye');
    var iconEyeBlind = $(parent).find('.eye-blind');
    $(inputPass).focus();
    if ($(inputPass).attr("type") === "password") {
      $(inputPass).attr("type", "text");
    } else {
      $(inputPass).attr("type", "password");
    }
    if ($(iconEye).hasClass('d-none')) {
      $(iconEye).removeClass('d-none');
    } else {
      $(iconEye).addClass('d-none');
    }
    if ($(iconEyeBlind).hasClass('d-none')) {
      $(iconEyeBlind).removeClass('d-none');
    } else {
      $(iconEyeBlind).addClass('d-none');
    }
  });
}
vela.customNumberInput = function() {
  var $body = $('body'),
    qtyAdjust = '.js-qty-adjust',
    $qtyAdjustPlus = $('.vela-qty__adjust--plus'),
    qtyNumber = '.js-qty-number',
    qtyNumberMin = $(qtyNumber).data('min'),
    qtyNumberMax = $(qtyNumber).data('max');
  var validateQty;
  
  $body.on('click', qtyAdjust, function() {
    var $el = $(this),
      $qtySelector = $el.siblings(qtyNumber),
      qty = parseInt($qtySelector.val().replace(/\D/g, ''));
    qty = validateQty(qty);
    var qtyWrap = $el.closest('.vela-qty');
    if ($el.hasClass('vela-qty__adjust--plus')) {
      qty += 1;
      qtyAdjust_min = qtyWrap.find('.vela-qty__adjust--minus');
      qtyAdjust_min.hasClass('disable') ? qtyAdjust_min.removeClass('disable') : '';
      if (qtyNumberMax != 'undefined' && qty >= qtyNumberMax) $el.addClass('disable');
    } else {
      qty -= 1;
      if (qty <= 0) qty = 0;
      if (qty <= 0 && $qtySelector.attr('min') == '1') qty = 1;
      if (qty <= 1 || qtyNumberMin >= qty) $el.addClass('disable'); 
      if (qtyNumberMax != 'undefined' && qty < qtyNumberMax) $qtyAdjustPlus.removeClass('disable');
    }
    $qtySelector.val(qty);
  });

  $body.on('focus', qtyAdjust, function() {
    var $el = $(this);
    setTimeout(function() {
      $el.select();
    }, 50);
  });

  validateQty = function(qty) {
    if (parseFloat(qty) === parseInt(qty) && !isNaN(qty)) {
      // We have a valid number!
    } else {
      qty = 1;
    }
    return qty;
  };
  $body.on('click', qtyNumber, function() {
    $(this).select();
  });
};

vela.preLoading = function() {
  if (vela.settings.enablePreLoading) {
    var counter = 0,
      preLoading = '#pre-loading',
      preLoadingBar = '.pre-loading__bar',
      items = new Array();

    $(preLoading).css({
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 99999,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(255, 255, 255, 1)'
    });

    function getImages(element) {
      $(element).find('*:not(script)').each(function() {
        var url = '';
        if ($(this).css('background-image') != '' &&
          $(this).css('background-image').indexOf('none') == -1 &&
          $(this).css('background-image').indexOf('-gradient') == -1) {
          url = $(this).css('background-image');
          if(url.indexOf('url') != -1) {
            var temp = url.match(/url\((.*?)\)/);
            url = temp[1].replace(/\"/g, '');
          }
        } else if ($(this).get(0).nodeName.toLowerCase() == 'img' && typeof($(this).attr('src')) != 'undefined') {
          url = $(this).attr('src');
        }

        if (url.length > 0 && items.length < 1) {
          items.push(url);
        }
      });
    }

    function runPreLoading() {
      counter++;
      var per = Math.round((counter / items.length) * 100);
      $(preLoadingBar).stop().animate({
          width: per + '%'
      }, 200, 'linear');
      if(counter >= items.length) {
        counter = items.length;
        $(preLoadingBar).stop().animate({
          width: '100%'
        }, 200, 'linear', function() {
          $(preLoading).fadeOut(200, function() {
            $(preLoading).remove();
          });
        }); 
      }
    }

    function preLoadingImage(url) {
      var imgPreLoading = new Image();
      $(imgPreLoading).on('load', function() {
        runPreLoading();
      }).on('error', function() {
        runPreLoading();
      }).attr('src', url);
    }

    function preLoadingStart() {
      if(items.length > 0 ){
        for (var i = 0; i < items.length; i++) {
          preLoadingImage(items[i]);
        }
      } else  {
        $(preLoadingBar).stop().animate({
          width: '100%'
        }, 200, 'linear', function() {
          $(preLoading).fadeOut(200, function() {
            $(preLoading).remove();
          });
        }); 
      }
    }
    getImages('body');
    preLoadingStart();
  }
};
vela.productLoadMore = function () {
  function loadmoreExecute() {
      var velaLoadNode = $('.sectioin-product-more .product-more__btn');
      var velaLoadUrl = $('.sectioin-product-more .product-more__btn').attr("href");
      $.ajax({
          type: 'GET',
          url: velaLoadUrl,
          beforeSend: function() {
            $('.sectioin-product-more .pre-loading').removeClass('d-none');
          },
          success: function(data) {
              velaLoadNode.remove();
              var filteredData = $(data).find(".product-more__content");
              filteredData.insertBefore($(".product-more__bottom"));
              btnMoreEvent();
              updateToolTip();
          },
          dataType: "html"
      });
  }
  function btnMoreEvent(){
      $('.sectioin-product-more .product-more__btn').click(function(e){
          if ($(this).hasClass('disableLoadMore')) {
              e.stopPropagation();
              return false;
          }
          else {
              loadmoreExecute();
              e.stopPropagation();
              return false;
          }
      });
  }
  function updateToolTip(){
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl)
    });
  }
  btnMoreEvent();
};
vela.accordion = function(){
  function accordionFooter(){
      if ( $(window).width() < 768 ){
          if(!$('.accordion-footer').hasClass('accordion')){
              $('.accordion-footer .footer__title').on('click', function(e){
                  $(this).toggleClass('active').parent().find('.accordion-footer__content').stop().slideToggle('medium');
                  e.preventDefault();
              });
              $('.accordion-footer').addClass('accordion').find('.accordion-footer__content').slideUp('fast');
          }
      }
      else {
          $('.accordion-footer .footer__title').removeClass('active').off().parent().find('.accordion-footer__content').removeAttr('style').slideDown('fast');
          $('.accordion-footer').removeClass('accordion');
      }
  }
  accordionFooter();
  $(window).resize(accordionFooter);
};
vela.gallery = function(){
  $('.gallery-image').magnificPopup({
    delegate: 'a',
    type: 'image',
    gallery: {
      enabled: true
    }
  });
};
vela.notification_sale = function() {
  if($(".notification-sale").length){
    var $element 		= $('.notification-sale');
    var time_start 		= 0;
    var start		 	= $element.data('start');
    var start_unit 		= $element.data('start_unit');
    if(start_unit == 'second'){
      time_start = start*1000;
    }else if(start_unit == 'minute'){
      time_start = start*1000*60;
    }
    $(".close-notification",$element).on( "click", function() {
      if($element.hasClass('active')){
        $element.removeClass('active');
      }
    });
    setTimeout(function(){
      vela.notification_sale_start(); 
    },time_start);
  }
}
vela.notification_sale_start = function() {
  if($(".notification-sale").length){
    var $element = $('.notification-sale');
    var list_product = $element.data('list_product');
    var limit = $element.data('limit') - 1;
    var stay = $element.data('stay');
    var stay_unit = $element.data('stay_unit');
    var user_purchased = window.routes.user_purchased;
    var list_time = window.routes.list_time;
    const purchased = user_purchased.split('|');
    const time = list_time.split('|');
    var time_stay = 0;
    if(stay_unit == 'second'){
      time_stay = stay*1000;
    }else if(stay_unit == 'minute'){
      time_stay = stay*1000*60;
    }
    var array1 = list_product.split('""');
    var item = Math.floor(limit*Math.random());
    var array2 = array1[item].split('"');
    if(item == 0){
      var array = array2[1];
    }else{
      var array = array2[0];
    }
    $.getJSON('/products/' + array + '.js', function(product) {
      $("#img",$element).attr("src",vela.resizeImage(product.featured_image, 'small'));
      $("a",$element).attr("href","/products/"+product.handle);
      $('.product-title a',$element).text(product.title);
      $('.notification-purchased .name',$element).text(purchased[item]);
      $('.time-suggest',$element).text(time[item]);
      $element.addClass('active');
    });
    $(".scroll-notification",$element).css("animation-duration", stay+"s");
    setTimeout(function(){
      $element.removeClass('active');
      vela.notification_sale();
    }, time_stay );
  }
}
vela.init = function() {
  vela.preLoading();
  vela.initializeEvents();
  vela.setBreakpoints();
  if(!$('body').hasClass('template-cart')) {
    vela.cartInit();
  }
  vela.slideshow();
  vela.slickCarousel();
  vela.countdown();
  vela.newsletter();
  vela.customNumberInput();
  if (vela.settings.saleNotify) {
    vela.notification_sale();
  }
  vela.accordion();
  vela.gallery();
  vela.productLoadMore();
  vela.velaBannerTop();
  vela.swatchProduct();
  vela.showPassWord();
};

$(document).ready(function() {
  vela.init();
});

var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
  return new bootstrap.Tooltip(tooltipTriggerEl)
});

class VelaBuyNow extends HTMLElement {
  constructor () {
    super();

    this.button = this.querySelector('.js-button');

    if (this.button) {
      this.button.addEventListener('click', this.onClick.bind(this));
    }
  }

  async onClick() {
    let spinner = document.createElement('span');
    spinner.classList.add('spinner-border', 'spinner-border-sm');

    const removeSpinner =  (button) => {
      const spinnerSelect = button.querySelector('.spinner-border');
      if (spinnerSelect) {
        spinnerSelect.remove();
      }
      button.classList.remove('is-adding');
    };

    this.classList.add('is-adding');
    this.appendChild(spinner);

    const clearStatus = await this.onCartClear();
    const form = this.closest('form');

    if (form && clearStatus) {
      const variantSelector = form.querySelector('[data-buynow-variant]');
      const quantitySelector = form.querySelector('[name="quantity"]');
      const quantity = quantitySelector ? quantitySelector.value : 1;

      if (variantSelector) {
        const body = JSON.stringify({
          id: Number(variantSelector.value),
          quantity: Number(quantity),
          return_to: '/checkout'
        });

        fetch(`${routes.cart_add_url}`, {...fetchConfig(), ...{ body }})
          .then((response) => {
            return response.json();
          })
          .then((data) => {
            removeSpinner(this);
            window.location.replace(window.location.origin + '/checkout');
          })
          .catch((error) => {
            removeSpinner(this);
            console.error('Error:', error);
          });
      } else {
        removeSpinner(this);
      }
    } else {
      removeSpinner(this);
    }
  }

  async onCartClear() {
    // Clear all items on current cart
    try {
      const status = await fetch(`${routes.cart_clear_url}`, { ...fetchConfig() })
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          if (data) {
            return true;
          } else {
            return false;
          }
        });

        return status;
    } catch (e) {
      return false;
    }
  }
}

customElements.define('vela-buynow', VelaBuyNow);

// Cart recommendations
class CartRecommendations extends HTMLElement {
  constructor () {
    super();

    this.url = this.dataset.url;
    this.sectionId = this.dataset.sectionId;
    this.limit = this.dataset.limit;
    this.productId = this.dataset.productId;

    if (this.url && this.sectionId && this.limit && this.productId) {
      this.initPage();
    }
  }

  initPage() {
    const url = `${this.url}?section_id=${this.sectionId}&product_id=${this.productId}&limit=${this.limit}`;
    fetch(url)
      .then(response => response.text())
      .then(text => {
        const html = document.createElement('div');
        html.innerHTML = text;
        const sectionContent = html.querySelector('.js-minicart-recommended-container');

        if (sectionContent) {
          this.innerHTML = sectionContent.innerHTML;

          vela.swatchProduct();

          // Update wishlist button status
          if ('wishlist' in vela && 'updateWishlist' in vela.wishlist) {
              vela.wishlist.updateWishlist();
          }

          $('body').trigger('carousel:init', '.js-minicart-recommendations');
        }
      })
      .catch(e => {
        console.error(e);
      });
  }
}

customElements.define('cart-recommendations', CartRecommendations);

class HVDucSelect extends HTMLElement {
  constructor() {
    super();
    this.select = this.querySelector('select');
    this.container = this.querySelector('[data-select="container"]');

    if (this.select && this.container) {
      this.buildSelect();
    }

    document.addEventListener('click', () => {
      this.container.classList.remove('active');
    });
  }

  buildSelect() {
    this.container.innerHTML = '';
    this.select.hidden = true;
    const options = this.select.querySelectorAll('option');
    const optionSelected = this.select.querySelector('option:checked');
    if (optionSelected) {
      this.buildOptionText(optionSelected.text, optionSelected.value);
    }

    // Build content
    const content = document.createElement('div');
    content.classList.add('hvduc-select__content');

    options.forEach((option) => {
      const disabled = option.disabled;

      if (!disabled) {
        const selected = option.selected;
        const button = document.createElement('button');
        button.classList.add('hvduc-select__option')
        if (selected) button.classList.add('active');
        button.setAttribute('data-value', option.value);
        button.setAttribute('type', 'button');
        button.innerText = option.text;
        button.addEventListener('click', this.onClick.bind(this));

        content.appendChild(button);
      }
    });

    this.container.appendChild(content);
  }

  buildOptionText(text, value) {
    const heading = document.createElement('div');
    heading.classList.add('hvduc-select__heading');
    heading.innerText = text;
    heading.setAttribute('data-current-value', value);
    heading.addEventListener('click', (event) => {
      event.stopPropagation();
      event.currentTarget.parentElement.classList.toggle('active');
    });
    this.container.appendChild(heading);
  }

  onClick(event) {
    const button = event.currentTarget;

    if (button.classList.contains('active')) return;

    // Clear class active
    const buttons = this.container.querySelectorAll('button.hvduc-select__option');
    buttons.forEach((item) => item.classList.remove('active'));

    const currText = button.innerText;
    const currValue = button.dataset.value;
    const heading = this.container.querySelector('.hvduc-select__heading');

    if (heading) {
      heading.innerText = currText;
      heading.dataset.currentValue = currValue;
      const option = this.select.querySelector(`option[value="${currValue}"]`);
      option.selected = true;
      this.select.dispatchEvent(new Event('change'));
    }

    button.classList.add('active');
  }
}

customElements.define('hvduc-select', HVDucSelect);

class StickyHeader extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    this.header = document.querySelector('.section-header');
    this.headerIsAlwaysSticky = this.getAttribute('data-sticky-type') === 'always';
    this.headerBounds = {};
    this.setHeaderHeight();
    window.matchMedia('(max-width: 991px)').addEventListener('change', this.setHeaderHeight.bind(this));

    if (this.headerIsAlwaysSticky) {
    this.header.classList.add('shopify-section-header-sticky');
    };

    this.currentScrollTop = 0;
    this.preventReveal = false;
    this.predictiveSearch = this.querySelector('predictive-search');

    this.onScrollHandler = this.onScroll.bind(this);
    this.hideHeaderOnScrollUp = () => this.preventReveal = true;

    this.addEventListener('preventHeaderReveal', this.hideHeaderOnScrollUp);
    window.addEventListener('scroll', this.onScrollHandler, false);

    this.createObserver();
  }
  setHeaderHeight() {
    document.documentElement.style.setProperty('--header-height', `${this.header.offsetHeight}px`);
    var hdHeight = 0;
    document.querySelectorAll('[class^="shopify-section shopify-section-group-header-"]').forEach((element) => {
      hdHeight = Math.ceil(element.offsetHeight) + hdHeight;
    });
    hdHeight = hdHeight - Math.ceil(this.header.offsetHeight);
    var cBannerTop = vela.getCookie('velaBannerTop');
    var bannerHeight = document.querySelector('.header-banner-top');
    if (cBannerTop == 1 && bannerHeight) {  
        hdHeight = hdHeight- Math.ceil(bannerHeight.offsetHeight);
    }
    document.documentElement.style.setProperty('--header-group-height', `${hdHeight}px`);
  }
  disconnectedCallback() {
    this.removeEventListener('preventHeaderReveal', this.hideHeaderOnScrollUp);
    window.removeEventListener('scroll', this.onScrollHandler);
  }
  createObserver() {
    let observer = new IntersectionObserver((entries, observer) => {
      this.headerBounds = entries[0].intersectionRect;
      observer.disconnect();
    });
    observer.observe(this.header);
  }
    onScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (this.predictiveSearch && this.predictiveSearch.isOpen) return;

    if (scrollTop > this.currentScrollTop && scrollTop > this.headerBounds.bottom) {
      this.header.classList.add('scrolled-past-header');
      if (this.preventHide) return;
      requestAnimationFrame(this.hide.bind(this));
    } else if (scrollTop < this.currentScrollTop && scrollTop > this.headerBounds.bottom) {
      this.header.classList.add('scrolled-past-header');
      if (!this.preventReveal) {
        requestAnimationFrame(this.reveal.bind(this));
      } else {
        window.clearTimeout(this.isScrolling);

        this.isScrolling = setTimeout(() => {
        this.preventReveal = false;
        }, 66);

        requestAnimationFrame(this.hide.bind(this));
      }
    } else if (scrollTop <= this.headerBounds.top) {
      this.header.classList.remove('scrolled-past-header');
      requestAnimationFrame(this.reset.bind(this));
    }

    this.currentScrollTop = scrollTop;
    }

  hide() {
    if (this.headerIsAlwaysSticky) return;
    this.header.classList.add('shopify-section-header-hidden', 'shopify-section-header-sticky');
  }
  reveal() {
    if (this.headerIsAlwaysSticky) return;
    this.header.classList.add('shopify-section-header-sticky', 'animate');
    this.header.classList.remove('shopify-section-header-hidden');
  }

  reset() {
    if (this.headerIsAlwaysSticky) return;
    this.header.classList.remove('shopify-section-header-hidden', 'shopify-section-header-sticky', 'animate');
  }
}
customElements.define('sticky-header', StickyHeader);

/*text animation section */
const marquees = [...document.querySelectorAll('.marquee')];
marquees.forEach((marquee) => {
    marquee.innerHTML = marquee.innerHTML;
    marquee.i = 0;
    marquee.step = 3;
    marquee.width = marquee.clientWidth + 1;
    marquee.style.position = '';
    marquee.innerHTML = `${marquee.innerHTML}`.repeat(10);
    marquee.addEventListener('mouseenter', () => (marquee.step = 0), false);
    marquee.addEventListener('mouseleave', () => (marquee.step = 3), false);
});

requestAnimationFrame(move);

function move() {
    marquees.forEach((marquee) => {
        marquee.style.marginLeft = `-${marquee.i}px`;
        marquee.i = marquee.i < marquee.width ? marquee.i + marquee.step : 1;
    });

    requestAnimationFrame(move);
}

class TextAnimations extends HTMLElement {
  constructor() {
    super();

    this.width = this.clientWidth;
    this.content = this.querySelector('.text-animations__content');

    if (this.content) {
      this.contentWidth = this.content.clientWidth;
      this.initPages();
    }
  }

  initPages() {
    const number = Math.floor(this.width / this.contentWidth) + 1;

    this.content.innerHTML = `${this.content.innerHTML}`.repeat(number);
    this.innerHTML = `${this.innerHTML}`.repeat(2);
  }
}

customElements.define('text-animations', TextAnimations);

class ProductCardBis extends HTMLElement {
  constructor() {
    super();
    this.button = this.querySelector('button[data-button="bis"]');
    this.content = this.querySelector('.product-bis');

    if (this.button) {
      this.button.addEventListener('click', this.onClick.bind(this));
    }
  }

  onClick(e) {
    e.preventDefault();
    const modal = document.getElementById('product-card-bis');

    if (modal) {
      const modalContent = modal.querySelector('.bis-notify__content');

      if (modalContent) {
        modalContent.innerHTML = this.content.innerHTML;
      }

      const bsModal = new bootstrap.Modal(modal, {});
      bsModal.show();
    }
  }
}

customElements.define('product-card-bis', ProductCardBis);
