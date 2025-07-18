vela.QuickAdd = (function() {
  var selectors = {
    body: 'body',
    quickAdd: '[data-quickadd]',
    quickAddTemplate: '#quickadd-template',
    ajaxCartEdit: '.js-ajaxcart-edit',
    quickAddBtn: '.js-btn-quickadd',
    quickAddContainer: '[data-quickadd-container]',
    quickAddClose: '[data-quickadd-close]',
    quickAddImages: '[data-quickadd-images]',
    quickAddReview: '[data-quickadd-review]',
    quickaddVariant: '.js-quickadd-option-selector',
    originalSelectorId: '[data-quickadd-variant]',
    quickAddProductPrice: '.js-qa-product-price',
    quickAddProductPriceCompare: '.js-qa-product-price-compare',
    quickAddSKU: '[data-quickadd-sku]',
    quickAddAvaiable: '.product-avaiable',
    quickAddAvaiableInStock: '.product-avaiable--instock',
    quickAddAvaiableInStockText: '.product-avaiable__text--instock',
    quickAddAvaiableOutStock: '.product-avaiable--outstock',
    quickAddProductDetailsURL: '.js-qa-product-details',
    quickAddBuyNow: 'vela-buynow'
  };
  var preOrder = false;
  function QuickAdd(container) {
    this.$container = $(container);
    this.cache = {};
    this.productVariants = [];
    this.currentVariant = {};
    this.cacheSelectors();
    this.modal = new bootstrap.Modal(container);
    this.initializeEvents(container);
    this.colorLabels = '';
  }

  QuickAdd.prototype = {
    cacheSelectors: function() {
      this.cache = {
        $body: $('body'),
        $quickAddContainer: this.$container.find(selectors.quickAddContainer)
      };
    },

    initializeEvents: function(container) {
      var $this = this;

      $(selectors.body).on('click', selectors.quickAddBtn, function(e) {
        e.preventDefault();
        var $button = $(this);
        $button.prepend('<span class="spinner-border spinner-border-sm"></span>');
        $button.addClass('is-adding');
        var productHandle = $button.data('handle');
        preOrder = $button.data('preorder');
        $this.colorLabels = $button.data('color-label') ? $button.data('color-label') : '';
        var $productCard = $button.closest('.product-card');
        var review = $productCard.get(0) ? $productCard.get(0).getElementsByTagName('vela-review')[0] : null;
        $.getJSON('/products/' + productHandle + '.js', function(product) {
          if (product.available) {
            $this.firstAvailableVariant(product.variants, $this);
          } else {
            $this.currentVariant = product.variants[0];
          }
          $this.productVariants = product.variants;
          $this.buildQuickAdd(product);
          $this.createImageCarousel();
          $button.find('.spinner-border').remove();
          $button.removeClass('is-adding');
          $this.modal.show();
        });
      });

      // Edit line item from cart
      $(selectors.body).on('click', selectors.ajaxCartEdit, function(e) {
        e.preventDefault();
        var $button = $(this);
        var handle = $button.data('handle');
        var line = $button.data('line');
        var qty = Number($button.data('qty'));
        var variantID = Number($button.data('variant-id'));
        $this.colorLabels = $button.data('color-label');

        if (handle && line) {
          $.getJSON('/products/' + handle + '.js', function(product) {
            const currVariant = product.variants.find((variant) => variant.id === variantID);
            $this.currentVariant = currVariant ? currVariant : product.variants[0];
            $this.productVariants = product.variants;
            $this.buildQuickAdd(product, true);
            $this.createImageCarousel();
            $this.updateReplaceItem(line, variantID, qty);
            $this.modal.show();
          });
        }
      });

      var removeLineItemLoading = function(element) {
        element.removeClass('is-adding');
        element.find('.spinner-border').remove();
        element.removeAttr('disabled');
      };

      var addLineItemLoading = function(element) {
        element.addClass('is-adding');
        if (element.find('.spinner-border').length === 0) {
          element.append('<span class="spinner-border spinner-border-sm"></span>');
        }
        element.attr('disabled', true);
      };

      $(selectors.body).on('click', '.js-hvduc-lineitem-button', function(e) {
        e.preventDefault();
        var $button = $(this);
        var currentLine = $button.data('line');
        var replaceItemContainer = $button.closest('.hvduc-lineitem-container');
        addLineItemLoading($button);

        if (replaceItemContainer.length > 0) {
          var inputVariantID = replaceItemContainer.find('[data-quickadd-variant]');
          var selectorQuantity = replaceItemContainer.find('[name="quantity"]');
          var quantity = selectorQuantity ? selectorQuantity.val() : 1;
          var replaceVariantID = Number(inputVariantID.val()) || null;

          if (replaceVariantID && currentLine) {
            // Process replace item
            var callbackReplace = function() {
              var data = {
                items: [
                  { id: replaceVariantID, quantity: quantity }
                ]
              };
              var paramsAddItem = {
                type: 'POST',
                url: '/cart/add.js',
                data: JSON.stringify(data),
                processData: false,
                contentType: 'application/json',
                dataType: 'json',
                success: function(line_item) {
                  removeLineItemLoading($button);
                  $this.modal.hide();
                  ajaxCart.load();

                  // Reload cart page
                  const cartItems = document.querySelector('cart-items');
                  if (cartItems) {
                    window.location.reload();
                  }
                },
                error: function(XMLHttpRequest, textStatus) {
                  ShopifyAPI.onError(XMLHttpRequest, textStatus);
                  removeLineItemLoading($button);
                  $this.modal.hide();
                  ajaxCart.load();

                  // Reload cart page
                  const cartItems = document.querySelector('cart-items');
                  if (cartItems) {
                    window.location.reload();
                  }
                }
              };
              $.ajax(paramsAddItem);
            };

            ShopifyAPI.changeItem(currentLine, 0, callbackReplace);
          }
        }
      });

      $(selectors.body).on('click', selectors.quickAddClose, function(e) {
        e.preventDefault();
        $this.modal.hide();
      });

      $(selectors.quickAddContainer).on('change', selectors.quickaddVariant, function(e) {
        $this.onVariantChange();
      });

      // MODAL OPEN
      var qaModal = document.querySelector(container);
      qaModal.addEventListener('show.bs.modal', function (event) {});

      qaModal.addEventListener('shown.bs.modal', function (event) {
        $(selectors.quickAddBtn).find('.spinner-border').remove();
        $(selectors.quickAddBtn).removeClass('is-adding');

        // Images
        var images = $this.$container.find(selectors.quickAddImages);
        if (images.hasClass('slick-initialized')) {
          images.slick('setPosition');
        }
        $this.$container.find('.quickadd-images__item').removeClass('opacity-0');
      });
    },

    updateReplaceItem: function(line, variantID, qty) {
      var quickAddButtons = $(selectors.quickAddContainer).find('.product-quickadd__buttons');
      var quickAddBuyNow = $(selectors.quickAddContainer).find('vela-buynow');
      var hvducReplaceButtons = $(selectors.quickAddContainer).find('.js-hvduc-lineitem-button');
      var selectorQuantity = $(selectors.quickAddContainer).find('[name="quantity"]');

      if (quickAddButtons.length > 0) quickAddButtons.addClass('d-none');
      if (quickAddBuyNow.length > 0) quickAddBuyNow.addClass('d-none');
      if (hvducReplaceButtons.length > 0) {
        hvducReplaceButtons.removeClass('d-none');
        hvducReplaceButtons.attr('data-line', line);
        hvducReplaceButtons.attr('data-current-variant', variantID);
      }

      if (selectorQuantity) {
        selectorQuantity.val(qty);
        if (qty > 1) {
          selectorQuantity.prev('.vela-qty__adjust--minus').removeClass('disable');
        }
      }
    },

    firstAvailableVariant: function(variants, global) {
      for (var i = 0; i < variants.length; i++) {
        var variant = variants[i];
        if (variant.available) {
          global.currentVariant = variant;
          break;
        }
      }
    },

    escape(string) {
      var reUnescapedHtml = /[&<>"']/g;
      var htmlEscapes = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      };
      var basePropertyOf = function(object) {
        return function(key) {
          return object == null ? undefined : object[key];
        };
      };
      var escapeHtmlChar = basePropertyOf(htmlEscapes);
      return string.replace(reUnescapedHtml, escapeHtmlChar);
    },

    buildReviews: function(element) {
      if (element) {
        var qaReviews = this.$container.find('.product-quickadd__reviews');
        if (qaReviews.length > 0) {
          qaReviews.html(element.innerHTML);
        }
      }
    },

    buildQuickAdd: function(product, isCart = false) {
      var moneyFormat = vela.strings.moneyFormat;
      var currentVariant = this.currentVariant;
      var source = $(selectors.quickAddTemplate).html();
      var template = Handlebars.compile(source);
      var images = '';
      var price = '';
      var tags = '';
      var qaObject = {
        id: product.id
      };
      if (product.media.length > 0) {
        images += '<div class="quickadd-images__list slick-carousel mx-0" data-quickadd-images>'
        for (var i = 0; i < product.media.length; i++) {
          var media = product.media[i];
          if (media.media_type === 'image') {
            images += '<div class="slick-carousel__item px-0"><div class="quickadd-images__item rounded-1 overflow-hidden opacity-0" data-media-id=' +
              media.id + '><img class="img-fluid" alt="' +
              product.title + '" src="' +
              this.resizeImage(media.src, 'medium') + '" /></div></div>';
          }
        }
        images += '</div>'
      }
      qaObject.variantID = currentVariant.id;
      qaObject.sku = currentVariant.sku !== null && currentVariant.sku !== '' ? currentVariant.sku : 'N/A';
      qaObject.images = images;
      qaObject.title = product.title;
      qaObject.url = product.url;
      price += '<div class="price-container d-flex align-items-center">';
      var productCompareClass = product.compare_at_price > product.price ? '' : 'd-none';
      var productHasComparePrice = product.compare_at_price > product.price ? 'product-price__has-sale' : '';
      price += '<div class="js-qa-product-price product-quickadd__price ' + productHasComparePrice + '">' + vela.Currency.formatMoney(product.price, moneyFormat) + '</div>';
      price += '<div class="js-qa-product-price-compare product-quickadd__price--compare-at ' + productCompareClass + '">' + vela.Currency.formatMoney(product.compare_at_price, moneyFormat) + '</div>';
      price += '</div>';
      qaObject.price = price;
      qaObject.vendor = '<a href="/collections/vendors?q=' + product.vendor + '" title="' + product.vendor + '">'+ product.vendor + '</a>';
      qaObject.type = '<a href="/collections/types?q=' + product.type + '" title="' + product.type + '">' + product.type + '</a>';
      if (product.tags.length > 0) {
        for (var i = 0; i < product.tags.length; i++) {
          if(i != 0) {
            tags += ',&nbsp;';
          }
          tags += '<a href="/collections/all/' + product.tags[i] +'" title="' + product.tags[i] +'">' + product.tags[i] +'</a>';
        }
      }
      qaObject.tags = tags;
      qaObject.variants = this.buildVariant(product);
      $(selectors.quickAddContainer).html(template(qaObject));
      if (isCart) {
        $(selectors.quickAddContainer).addClass('hvduc-lineitem-container');
      }
      // AFTER BUILD HTML
      this.updateMedia(currentVariant);
      this.updateSKU(currentVariant);
      this.updateProductAvaiable(currentVariant);
      this.updateDetailsLink(currentVariant);
      this.updateToolTip();
      this.qaAddTitleVariant();
    },

    convertToSlug: function(str) {
      return str.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
    },

    resizeImage: function (m, j) {
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
    },

    buildVariant: function(product) {
      var result = '';
      var currentVariant = this.currentVariant;
      var selectClass = '';
      if (product.options[0].name !== 'Title') {
        var options = product.options;
        for (var i = 0; i < options.length; i ++) {
          var option = options[i];
          var optionIndex = i + 1;
          
          if (vela.settings.quickAddVariantType === 'select') {
              selectClass = options.length > 1 ? 'col-6' : 'col-12';
          }
          result += '<div class="variants-wrapper product-form__item ' + selectClass + '" data-quickadd-variant-option="' + optionIndex + '">';
          result += '<label class="variants__label">' + option.name + ':<span class="js-swatch-display"></span></label>';
          result += '<div class="variants__options">';
          if (vela.settings.quickAddVariantType === 'select') {
            result += '<select class="js-quickadd-option-selector product-form__input form-select" data-id="quickAddOptionSelector-' + optionIndex + '" data-index="option' + optionIndex + '">';
            for (var j = 0; j < option.values.length; j ++) {
              var value = option.values[j];
              result += '<option value="' + this.escape(value) + '" ';
              result += currentVariant.options[i] === value ? 'selected="selected"' : '';
              result += '>' + value + '</option>';
            }
            result += '</select>';
          } else if (vela.settings.quickAddVariantType === 'radio') {
            for (var j = 0; j < option.values.length; j ++) {
              var value = option.values[j];
              var isDisable = true;
              var colorAttribute = '';
              var colorLabelClasses = '';

              // CHECK Product option is available or disabled
              for (var k = 0; k < this.productVariants.length; k ++) {
                var variantCondition = this.productVariants[k];
                if (variantCondition.available) {
                  if (i == 0 && variantCondition.option1 === value) {
                    isDisable = false;
                    break;
                  } else if (i == 1 && variantCondition.option2 === value && variantCondition.option1 == currentVariant.option1) {
                    isDisable = false;
                    break;
                  } else if (i == 2 && variantCondition.option3 === value && variantCondition.option2 == currentVariant.option2 && variantCondition.option1 == currentVariant.option1) {
                    isDisable = false;
                    break;
                  }
                }
              }

              // HVDUC: Color swatches
              if (vela.settings.quickAddColorSwatch && (this.colorLabels.toLowerCase().indexOf(option.name.toLowerCase()) != -1)) {
                var colorName = this.convertToSlug(value);
                var styleBackgroundColor = 'background-color: ' + colorName.replace(/\s/g, '') + ';';
                var styleBackgroundImage = '';

                if (vela.settings.quickAddSwatchType === 'metafields') {
                  colorLabelClasses = 'vela-swatch--' + colorName;
                } else if (vela.settings.quickAddSwatchType === 'variant') {
                  colorAttribute += 'data-variantImage="true"';
                  for (var k = 0; k < this.productVariants.length; k ++) {
                    var tempVariant = this.productVariants[k];
                    for( var t = 0; t < tempVariant.options.length; t ++){
                      var image_color = '';
                      var option_name =  this.convertToSlug(tempVariant.options[t]);
                      if(option_name == colorName  && tempVariant.featured_image ) {
                        image_color = tempVariant.featured_image.src;
                        break;
                      }
                    }

                    if (image_color != '') {
                      var colorImageUrl = this.resizeImage(image_color, 'small');
                      styleBackgroundImage = 'background-image: url(' + colorImageUrl + ');';
                      break;
                    }
                  }
                }

                colorAttribute += `data-color="${colorName}"`;
                colorAttribute += `data-qv-toggle="tooltip" title="${value}"`;
                colorAttribute += `style="${styleBackgroundColor} ${styleBackgroundImage}"`;
              }
              result += '<div class="quickadd-option-selector">';
              result += '<input type="radio" data-single-option-button';
              result += currentVariant.options[i] === value ? ' checked ' : ' ';
              if (isDisable) {
                result += 'disabled="disabled"';
              }
              result += 'value="' + this.escape(value) + '" data-index="option' + optionIndex + '" name="option' + option.position + '" ';
              result += 'class="js-quickadd-option-selector';
              if (isDisable) {
                result += ' disabled';
              }
              result += '" id="quickadd-product-option-' + i + '-' + value.toLowerCase() + '">';
              result += '<label for="quickadd-product-option-' + i + '-' + value.toLowerCase() + '" ' + colorAttribute;
              if (isDisable) {
                colorLabelClasses += ' disabled';
              }
              result += ' class="' + colorLabelClasses + '"'
              result += '>' + value + '<span class="d-none"></span></label>';
              result += '</div>';
            }
          }
          result += '</div>';
          result += '</div>';
        }
      }
      return result;
    },

    qaAddTitleVariant: function() {
      var variant = this.currentVariant;
      var form = $('.product-quickadd__variants');
      for (var i=0,length=variant.options.length; i<length; i++ ) {
        var j = i + 1;
        var headerValue = form.find('.product-form__item[data-quickadd-variant-option="' + j + '"] .js-swatch-display');
        headerValue.text(variant.options[i]);
      }
    },

    createImageCarousel: function() {
      $(selectors.quickAdd).find(selectors.quickAddImages).slick({
        infinite: false,
        arrows: false,
        rows: 0
      });
    },

    getCurrentOptions: function() {
      var currentOptions = [];
      $(selectors.quickAddContainer).find(selectors.quickaddVariant).each(function(index, element) {
        var $element = $(element);
        var type = $element.attr('type');
        var currentOption = {};

        if (type === 'radio' || type === 'checkbox') {
          if ($element[0].checked) {
            currentOption.value = $element.val();
            currentOption.index = $element.data('index');
            currentOptions.push(currentOption);
          }
        } else {
          currentOption.value = $element.val();
          currentOption.index = $element.data('index');
          currentOptions.push(currentOption);
        }
      });

      return currentOptions;
    },

    getVariantFromOptions: function() {
      var selectedValues = this.getCurrentOptions();
      var variants = this.productVariants;

      var variant = variants.find(function(item) {
        return selectedValues.every(function(values) {
          return item[values.index] === values.value;
        });
      });

      return variant;
    },

    updateVariantsButton: function () {
      var selectedValues = this.getCurrentOptions();
      var variants = this.productVariants;

      for (var i = 2; i <= 3; i++) {
        if ($('[data-quickadd-variant-option="' + i + '"]', selectors.quickAddContainer).length) {
          $('[data-quickadd-variant-option="' + i + '"] ' + selectors.quickaddVariant, selectors.quickAddContainer).each(function() {
            var $self = $(this);
            var optionValue = $self.val();
            var foundIndex;
            if (i === 2) {
              foundIndex = variants.findIndex(function(variant) {
                return variant.option1 === selectedValues[0].value && variant.option2 === optionValue && variant.available === true;
              });
            } else if (i === 3) {
              foundIndex = variants.findIndex(function(variant) {
                return variant.option1 === selectedValues[0].value && variant.option2 === selectedValues[1].value && variant.option3 === optionValue && variant.available === true;
              });
            }
            if (foundIndex !== -1) {
              $self.removeAttr('disabled', 'disabled').removeClass('disabled');
              $self.next('label').removeClass('disabled');
            } else {
              $self.attr('disabled', 'disabled').addClass('disabled');
              $self.next('label').addClass('disabled');
            }
          });
        }
      }
    },

    updateVariantsButtonDisabed: function() {
      for (var i = 2; i <= 3; i++) {
        if ($('[data-quickadd-variant-option="' + i + '"]', selectors.quickAddContainer).length) {
          var isUpdate = false;
          $('[data-quickadd-variant-option="' + i + '"] ' + selectors.quickaddVariant, selectors.quickAddContainer).each(function() {
            var $element = $(this);
            var type = $element.attr('type');
            if (type === 'radio' || type === 'checkbox') {
              if (this.checked && $element.hasClass('disabled')) {
                $element.prop('checked', false);
                isUpdate = true;
                return false;
              }
            }
          });
          $('[data-quickadd-variant-option="' + i + '"] ' + selectors.quickaddVariant, selectors.quickAddContainer).each(function() {
            var $element = $(this);
            var type = $element.attr('type');
            if (isUpdate && (type === 'radio' || type === 'checkbox') && !$element.hasClass('disabled')) {
              $element.prop('checked', true);
              isUpdate = false;
              $element.trigger('change');
              return false;
            }
          });
        }
      }
    },

    updateMasterSelect: function(variant) {
      if (variant) {
        $(selectors.originalSelectorId, selectors.quickAddContainer).val(variant.id);
      }
    },

    updateMedia: function(variant) {
      if (variant && variant.featured_media && variant.featured_media.id) {
        $(selectors.quickAddImages, selectors.quickAddContainer).find('.quickadd-images__item').each(function() {
          var imageID = $(this).data('media-id');
          if (variant.featured_media.id == imageID) {
            var slickIndex = $(this).closest('.slick-carousel__item').data('slick-index');
            if (slickIndex !== undefined && slickIndex !== null) {
              $(selectors.quickAddImages, selectors.quickAddContainer).slick('slickGoTo', slickIndex);
            }
          }
        });
      }
    },

    updatePrice: function(variant) {
      var moneyFormat = vela.strings.moneyFormat;
      if (!variant) {
        $(selectors.quickAddProductPrice, selectors.quickAddContainer).addClass('d-none');
        $(selectors.quickAddProductPriceCompare, selectors.quickAddContainer).addClass('d-none');
      } else {
        $(selectors.quickAddProductPrice, selectors.quickAddContainer).removeClass('d-none');
        $(selectors.quickAddProductPriceCompare, selectors.quickAddContainer).removeClass('d-none');
        $(selectors.quickAddProductPrice, selectors.quickAddContainer).html(
          vela.Currency.formatMoney(variant.price, moneyFormat)
        );
        if (variant.compare_at_price > variant.price) {
          $(selectors.quickAddProductPriceCompare, selectors.quickAddContainer).html(
            vela.Currency.formatMoney(variant.compare_at_price, moneyFormat)
          ).removeClass('d-none');
          $(selectors.quickAddProductPrice, selectors.quickAddContainer).addClass('on-sale');
        } else {
          $(selectors.quickAddProductPriceCompare, selectors.quickAddContainer).addClass('d-none');
          $(selectors.quickAddProductPrice, selectors.quickAddContainer).removeClass('on-sale');
        }
      }
    },

    updateSKU: function(variant) {
      var sku = variant && variant.sku !== null && variant.sku !== '' ? variant.sku : 'N/A';
      $(selectors.quickAddSKU, selectors.quickAddContainer).html(sku);
    },

    updateProductAvaiable: function(variant) {
      var classActive = 'product-avaiable--active';
      var translations = vela.strings;
      
      $(selectors.quickAddAvaiable, selectors.quickAddContainer).removeClass(classActive);
      if(preOrder) {
        $(selectors.quickAddAvaiableInStockText, selectors.quickAddContainer).addClass('text-info').html(translations.preOrder);
      }
      if (variant) {
        if (variant.available) {
          $(selectors.quickAddQty, selectors.quickAddContainer).removeClass('d-none');
          $(selectors.quickAddAvaiableInStock, selectors.quickAddContainer).addClass(classActive);
        } else {
          $(selectors.quickAddQty, selectors.quickAddContainer).addClass('d-none');
          $(selectors.quickAddAvaiableOutStock, selectors.quickAddContainer).addClass(classActive);
        }

        // Button add to cart
        if (variant.available) {
          $(selectors.quickAddContainer).find('.btn--add-to-cart').removeClass('disabled').prop('disabled', false);
          if ( preOrder ) {
            $(selectors.quickAddContainer).find('.btn--add-to-cart .btn__text').html(translations.preOrder);
          } else {
            $(selectors.quickAddContainer).find('.btn--add-to-cart .btn__text').html(translations.addToCart);
          }
        } else {
          $(selectors.quickAddContainer).find('.btn--add-to-cart')
            .addClass('disabled')
            .prop('disabled', true);
          $(selectors.quickAddContainer).find('.btn--add-to-cart .btn__text').html(translations.soldOut);
        }
      } else {
        $(selectors.quickAddQty, selectors.quickAddContainer).addClass('d-none');
        $(selectors.quickAddContainer).find('.btn--add-to-cart')
          .addClass('disabled')
          .prop('disabled', true);
        $(selectors.quickAddContainer).find('.btn--add-to-cart .btn__text').html(translations.unavailable);
      }
    },

    updateDetailsLink: function(variant) {
      if (variant) {
        var productURL = $(selectors.quickAddProductDetailsURL, selectors.quickAddContainer).data('url') + '?variant=' + variant.id;
        $(selectors.quickAddProductDetailsURL, selectors.quickAddContainer).removeClass('d-none').attr('href', productURL);
      } else {
        $(selectors.quickAddProductDetailsURL, selectors.quickAddContainer).addClass('d-none');
      }
    },
    
    updateToolTip: function() {
      $('[data-qa-toggle="tooltip"]', selectors.quickAddContainer).tooltip();
    },

    onVariantChange: function() {
      var variant = this.getVariantFromOptions();
      if ($('[data-single-option-button]', selectors.quickAddContainer).length) {
        this.updateVariantsButton();
        if (!variant || !variant.available) {
          this.updateVariantsButtonDisabed();
          return;
        }
      }
      this.updateMasterSelect(variant);
      this.updateMedia(variant);
      this.updatePrice(variant);
      this.updateSKU(variant);
      this.updateProductAvaiable(variant);
      this.updateDetailsLink(variant);
      this.currentVariant = variant;
      this.qaAddTitleVariant();
    }
  };

  return QuickAdd;
})();

$(document).ready(function() {
  new vela.QuickAdd('[data-quickadd]');
});
