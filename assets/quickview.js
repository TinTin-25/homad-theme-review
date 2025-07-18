vela.QuickView = (function() {
  var selectors = {
    body: 'body',
    quickView: '[data-quickview]',
    quickViewTemplate: '#quickview-template',
    quickViewBtn: '.js-btn-quickview',
    quickViewContainer: '[data-quickview-container]',
    quickViewClose: '[data-quickview-close]',
    quickViewImages: '[data-quickview-images]',
    quickViewReview: '[data-quickview-review]',
    quickviewVariant: '.js-quickview-option-selector',
    originalSelectorId: '[data-quickview-variant]',
    quickViewProductPrice: '.js-qv-product-price',
    quickViewProductPriceCompare: '.js-qv-product-price-compare',
    quickViewSKU: '[data-quickview-sku]',
    quickViewAvaiable: '.product-avaiable',
    quickViewAvaiableInStock: '.product-avaiable--instock',
    quickViewAvaiableInStockText: '.product-avaiable__text--instock',
    quickViewAvaiableOutStock: '.product-avaiable--outstock',
    quickViewProductDetailsURL: '.js-qv-product-details',
    quickViewBuyNow: 'vela-buynow',
    quickViewNotify: '#qv-notify-popup'
  };
  var preOrder = false;
  function QuickView(container) {
    this.$container = $(container);
    this.cache = {};
    this.productVariants = [];
    this.currentVariant = {};
    this.cacheSelectors();
    this.modal = new bootstrap.Modal(container);
    this.initializeEvents(container);
    this.colorLabels = '';
  }

  QuickView.prototype = {
    cacheSelectors: function() {
      this.cache = {
        $body: $('body'),
        $quickViewContainer: this.$container.find(selectors.quickViewContainer)
      };
    },

    initializeEvents: function(container) {
      var $this = this;

      $(selectors.body).on('click', selectors.quickViewBtn, function(e) {
        e.preventDefault();
        var $button = $(this);
        $button.prepend('<span class="spinner-border spinner-border-sm"></span>');
        $button.addClass('is-adding');
        var productHandle = $button.data('handle');
        preOrder = $button.data('preorder');
        $this.colorLabels = $button.data('color-label') ? $button.data('color-label') : '';
        var shortProductDesc = $button.find('.proShortDesc').html();
        var $productCard = $button.closest('.product-card');
        var review = $productCard.get(0) ? $productCard.get(0).getElementsByTagName('vela-review')[0] : null;
        var endDate = $button.data('end_date');

        $.getJSON('/products/' + productHandle + '.js', function(product) {
          if (product.available) {
            $this.firstAvailableVariant(product.variants, $this);
          } else {
            $this.currentVariant = product.variants[0];
          }

          $this.productVariants = product.variants;
          $this.buildQuickView(product, shortProductDesc);
          $this.createImageCarousel($this.$container);
          $this.buildReviews(review);
          $this.buildCountDown(endDate);
          if (vela && 'wishlist' in vela) {
            vela.wishlist.reloadButtons();
          }
          $this.modal.show();
        });
      });

      $(selectors.body).on('click', selectors.quickViewClose, function(e) {
        e.preventDefault();
        $this.$container.removeClass('transition');

        // Trigger update wishlist button
        if (vela && 'wishlist' in vela) {
          vela.wishlist.reloadButtons();
        }

        // Close modal delay
        setTimeout(function() {
          $this.modal.hide();
        }, 500);
      });

      $(selectors.quickViewContainer).on('change', selectors.quickviewVariant, function(e) {
        $this.onVariantChange();
      });

      // MODAL OPEN
      var qvModal = document.querySelector(container);
      qvModal.addEventListener('show.bs.modal', function (event) {});

      qvModal.addEventListener('shown.bs.modal', function (event) {
        $this.$container.addClass('transition');
        $(selectors.quickViewBtn).find('.spinner-border').remove();
        $(selectors.quickViewBtn).removeClass('is-adding');

        // Images
        var images = $this.$container.find(selectors.quickViewImages);
        if (images.hasClass('slick-initialized')) {
          images.slick('setPosition');
        }
        $this.$container.find('.quickview-images__item').removeClass('opacity-0');
      });
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

    firstAvailableVariant: function(variants, global) {
      for (var i = 0; i < variants.length; i++) {
        var variant = variants[i];
        if (variant.available) {
          global.currentVariant = variant;
          break;
        }
      }
    },

    buildReviews: function(element) {
      if (element) {
        var qvReviews = this.$container.find('.product-quickview__reviews');

        if (qvReviews.length > 0) {
          qvReviews.html(element.innerHTML);
        }
      }
    },

    buildCountDown: function(element) {
      if (element) {
        this.$container.find('.product-quickview__countdown').removeClass('d-none');
        this.$container.find('.product-quickview__countdown--list').attr("data-countdown",element);
        vela.countdown();
      }
    },

    buildQuickView: function(product,shortProductDesc) {
      var moneyFormat = vela.strings.moneyFormat;
      var currentVariant = this.currentVariant;
      var source = $(selectors.quickViewTemplate).html();
      var template = Handlebars.compile(source);
      var images = '';
      var price = '';
      var tags = '';
      var shortDescription = shortProductDesc;
      var qvObject = {
        id: product.id
      };
      if (product.media.length > 0) {
        images += '<div class="quickview-images__list slick-carousel row g-0" data-quickview-images>'
        for (var i = 0; i < product.media.length; i++) {
          var media = product.media[i];
          if (media.media_type === 'image') {
            images += '<div class="slick-carousel__item"><div class="quickview-images__item opacity-0" data-media-id=' +
            media.id + '><img class="img-fluid" alt="' +
            product.title + '" src="' +
            media.src + '" /></div></div>';
          }
        }
        images += '</div>'
      }
      qvObject.variantID = currentVariant.id;
      qvObject.sku = currentVariant.sku !== null && currentVariant.sku !== '' ? currentVariant.sku : 'N/A';
      qvObject.images = images;
      qvObject.title = product.title;
      qvObject.url = product.url;
      price += '<div class="price-container d-flex align-items-center">';
      var productCompareClass = product.compare_at_price > product.price ? '' : 'd-none';
      var productHasComparePrice = product.compare_at_price > product.price ? 'product-price__has-sale' : '';
      price += '<div class="js-qv-product-price product-quickview__price ' + productHasComparePrice + '">' + vela.Currency.formatMoney(product.price, moneyFormat) + '</div>';
      price += '<div class="js-qv-product-price-compare product-quickview__price--compare-at ' + productCompareClass + '">' + vela.Currency.formatMoney(product.compare_at_price, moneyFormat) + '</div>';
      price += '</div>';
      qvObject.price = price;
      qvObject.shortDescription = shortDescription;
      qvObject.vendor = '<a href="/collections/vendors?q=' + product.vendor + '" title="' + product.vendor + '">'+ product.vendor + '</a>';
      qvObject.type = '<a href="/collections/types?q=' + product.type + '" title="' + product.type + '">' + product.type + '</a>';
      if (product.tags.length > 0) {
        for (var i = 0; i < product.tags.length; i++) {
          if(i != 0) {
            tags += ',&nbsp;';
          }
          tags += '<a href="/collections/all/' + product.tags[i] +'" title="' + product.tags[i] +'">' + product.tags[i] +'</a>';
        }
      }
      qvObject.tags = tags;
      qvObject.variants = this.buildVariant(product);
      qvObject.handle = product.handle;
      $(selectors.quickViewContainer).html(template(qvObject));
      // AFTER BUILD HTML
      this.updateMedia(currentVariant);
      this.updateSKU(currentVariant);
      this.updateProductAvaiable(currentVariant);
      this.updateDetailsLink(currentVariant);
      this.updateToolTip();
      this.updateNotifyMe(currentVariant, product);
      this.qvAddTitleVariant();
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
      var selectClass = "";

      if (product.options[0].name !== 'Title') {
        var options = product.options;

        for (var i = 0; i < options.length; i ++) {
          var option = options[i];
          var optionIndex = i + 1;

          if (vela.settings.quickViewVariantType === 'select') selectClass = options.length > 1 ? 'col-6' : 'col-12';
          result += '<div class="variants-wrapper product-form__item ' + selectClass + '" data-quickview-variant-option="' + optionIndex + '">';
          result += '<label class="variants__label">' + option.name + ':<span class="js-swatch-display"></span></label>';
          result += '<div class="variants__options">';

          if (vela.settings.quickViewVariantType === 'select') {
            result += '<select class="js-quickview-option-selector product-form__input form-select" data-id="quickViewOptionSelector-' + optionIndex + '" data-index="option' + optionIndex + '">';

            for (var j = 0; j < option.values.length; j ++) {
              var value = option.values[j];
              result += '<option value="' + this.escape(value) + '" ';
              result += currentVariant.options[i] === value ? 'selected="selected"' : '';
              result += '>' + value + '</option>';
            }
            result += '</select>';
          } else if (vela.settings.quickViewVariantType === 'radio') {
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
              if (vela.settings.quickViewColorSwatch && (this.colorLabels.toLowerCase().indexOf(option.name.toLowerCase()) != -1)) {
                var colorName = this.convertToSlug(value);
                var styleBackgroundColor = 'background-color: ' + colorName.replace(/\s/g, '') + ';';
                var styleBackgroundImage = '';

                if (vela.settings.quickViewSwatchType === 'metafields') {
                  colorLabelClasses = 'vela-swatch--' + colorName;
                } else if (vela.settings.quickViewSwatchType === 'variant') {
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

              result += '<div class="quickview-option-selector">';
              result += '<input type="radio" data-single-option-button';
              result += currentVariant.options[i] === value ? ' checked ' : ' ';

              if (isDisable) {
                result += 'disabled="disabled"';
              }

              result += 'value="' + this.escape(value) + '" data-index="option' + optionIndex + '" name="option' + option.position + '" ';
              result += 'class="js-quickview-option-selector';

              if (isDisable) {
                result += ' disabled';
              }

              result += '" id="quickview-product-option-' + i + '-' + value.toLowerCase() + '">';
              result += '<label for="quickview-product-option-' + i + '-' + value.toLowerCase() + '" ' + colorAttribute;

              if (isDisable) {
                colorLabelClasses += ' disabled';
              }

              result += ` class="${colorLabelClasses}"`;
              result += `>${value}<span class="d-none"></span></label>`;
              result += '</div>';
            }
          }
          result += '</div>';
          result += '</div>';
        }
      }
      return result;
    },

    qvAddTitleVariant: function() {
      var variant = this.currentVariant;
      var form = $('.product-quickview__variants');

      for (var i=0,length=variant.options.length; i<length; i++ ) {
        var j = i + 1;
        var headerValue = form.find('.product-form__item[data-quickview-variant-option="' + j + '"] .js-swatch-display');
        headerValue.text(variant.options[i]);
      }
    },

    createImageCarousel: function($container) {
      $container.find(selectors.quickViewImages).slick({
        infinite: false,
        rows: 0,
        dots: true,
        customPaging : function(slider, i) {
          return (i + 1) + '/' + slider.slideCount;
        },
      });
    },

    getCurrentOptions: function() {
      var currentOptions = [];
      $(selectors.quickViewContainer).find(selectors.quickviewVariant).each(function(index, element) {
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
        if ($('[data-quickview-variant-option="' + i + '"]', selectors.quickViewContainer).length) {
          $('[data-quickview-variant-option="' + i + '"] ' + selectors.quickviewVariant, selectors.quickViewContainer).each(function() {
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
        if ($('[data-quickview-variant-option="' + i + '"]', selectors.quickViewContainer).length) {
          var isUpdate = false;
          $('[data-quickview-variant-option="' + i + '"] ' + selectors.quickviewVariant, selectors.quickViewContainer).each(function() {
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
          $('[data-quickview-variant-option="' + i + '"] ' + selectors.quickviewVariant, selectors.quickViewContainer).each(function() {
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
        $(selectors.originalSelectorId, selectors.quickViewContainer).val(variant.id);
      }
    },

    updateMedia: function(variant) {
      if (variant && variant.featured_media && variant.featured_media.id) {
        $(selectors.quickViewImages, selectors.quickViewContainer).find('.quickview-images__item').each(function() {
          var imageID = $(this).data('media-id');
          if (variant.featured_media.id == imageID) {
            var slickIndex = $(this).closest('.slick-carousel__item').data('slick-index');
            if (slickIndex !== undefined && slickIndex !== null) {
              $(selectors.quickViewImages, selectors.quickViewContainer).slick('slickGoTo', slickIndex);
            }
          }
        });
      }
    },

    updatePrice: function(variant) {
      var moneyFormat = vela.strings.moneyFormat;
      if (!variant) {
        $(selectors.quickViewProductPrice, selectors.quickViewContainer).addClass('d-none');
        $(selectors.quickViewProductPriceCompare, selectors.quickViewContainer).addClass('d-none');
      } else {
        $(selectors.quickViewProductPrice, selectors.quickViewContainer).removeClass('d-none');
        $(selectors.quickViewProductPriceCompare, selectors.quickViewContainer).removeClass('d-none');
        $(selectors.quickViewProductPrice, selectors.quickViewContainer).html(
          vela.Currency.formatMoney(variant.price, moneyFormat)
        );
        if (variant.compare_at_price > variant.price) {
          $(selectors.quickViewProductPriceCompare, selectors.quickViewContainer).html(
            vela.Currency.formatMoney(variant.compare_at_price, moneyFormat)
          ).removeClass('d-none');
          $(selectors.quickViewProductPrice, selectors.quickViewContainer).addClass('on-sale');
        } else {
          $(selectors.quickViewProductPriceCompare, selectors.quickViewContainer).addClass('d-none');
          $(selectors.quickViewProductPrice, selectors.quickViewContainer).removeClass('on-sale');
        }
      }
    },

    updateSKU: function(variant) {
      var sku = variant && variant.sku !== null && variant.sku !== '' ? variant.sku : 'N/A';
      $(selectors.quickViewSKU, selectors.quickViewContainer).html(sku);
    },

    updateProductAvaiable: function(variant) {
      var classActive = 'product-avaiable--active';
      var translations = vela.strings;
      var addToCartButton = $(selectors.quickViewContainer).find('.btn--add-to-cart');
      var qvNotify = $(selectors.quickViewContainer).find('.qv-notify-me');
      var qvQuantity = $(selectors.quickViewContainer).find('.product-quantity');

      $(selectors.quickViewAvaiable, selectors.quickViewContainer).removeClass(classActive);
      if(preOrder) {
        $(selectors.quickViewAvaiableInStockText, selectors.quickViewContainer).addClass('text-info').html(translations.preOrder);
      }
      if (variant) {
        if (variant.available) {
          $(selectors.quickViewQty, selectors.quickViewContainer).removeClass('d-none');
          $(selectors.quickViewAvaiableInStock, selectors.quickViewContainer).addClass(classActive);
        } else {
          $(selectors.quickViewQty, selectors.quickViewContainer).addClass('d-none');
          $(selectors.quickViewAvaiableOutStock, selectors.quickViewContainer).addClass(classActive);
        }

        // Button add to cart
        if (variant.available) {
          addToCartButton.removeClass('disabled').prop('disabled', false);
          addToCartButton.removeClass('d-none');
          if ( preOrder ) {
            $(selectors.quickViewContainer).find('.btn--add-to-cart .btn__text').html(translations.preOrder);
          } else {
            $(selectors.quickViewContainer).find('.btn--add-to-cart .btn__text').html(translations.addToCart);
          }

          $(selectors.quickViewContainer).find(selectors.quickViewBuyNow).removeClass('d-none');

          if (qvNotify.length > 0) {
            qvNotify.addClass('d-none');
          }
          if (qvQuantity.length > 0) {
            qvQuantity.removeClass('d-none');
          }
        } else {
          addToCartButton.addClass('disabled').prop('disabled', true);
          $(selectors.quickViewContainer).find('.btn--add-to-cart .btn__text').html(translations.soldOut);
          $(selectors.quickViewContainer).find(selectors.quickViewBuyNow).addClass('d-none');

          // Out of stock notification
          if (qvNotify.length > 0) {
            addToCartButton.addClass('d-none');
            qvNotify.removeClass('d-none');
          }
          if (qvQuantity.length > 0) {
            qvQuantity.addClass('d-none');
          }
        }
      } else {
        addToCartButton.addClass('disabled').prop('disabled', true);
        addToCartButton.removeClass('d-none');

        $(selectors.quickViewQty, selectors.quickViewContainer).addClass('d-none');
        $(selectors.quickViewContainer).find('.btn--add-to-cart .btn__text').html(translations.unavailable);
        $(selectors.quickViewContainer).find(selectors.quickViewBuyNow).addClass('d-none');

        if (qvNotify.length > 0) {
          qvNotify.addClass('d-none');
        }
        if (qvQuantity.length > 0) {
          qvQuantity.addClass('d-none');
        }
      }
    },

    updateDetailsLink: function(variant) {
      if (variant) {
        var productURL = $(selectors.quickViewProductDetailsURL, selectors.quickViewContainer).data('url') + '?variant=' + variant.id;
        $(selectors.quickViewProductDetailsURL, selectors.quickViewContainer).removeClass('d-none').attr('href', productURL);
      } else {
        $(selectors.quickViewProductDetailsURL, selectors.quickViewContainer).addClass('d-none');
      }
    },

    updateToolTip: function() {
      $('[data-qv-toggle="tooltip"]', selectors.quickViewContainer).tooltip();
    },

    updateNotifyMe: function(variant, product) {
      const qvNotify = $(selectors.quickViewNotify);
      const notifyProductImage = qvNotify.find('[data-product-image]');
      const productImage = notifyProductImage.get(0);

      if (qvNotify.length > 0) {
        if (product) {
          const notifyProductTitle = qvNotify.find('[data-product-title]');
          
          const notifyInputID = qvNotify.find('[data-input-id]');
          const notifyInputTile = qvNotify.find('[data-input-title]');
          const notifyInputURL = qvNotify.find('[data-input-url]');

          notifyProductTitle.html(product.title);
          notifyInputID.val(product.id);
          notifyInputTile.val(product.title);
          notifyInputURL.val(routes.origin + product.url);

          // First image
          if (productImage) {
            let image = document.createElement('img');
            image.setAttribute('alt', product.title);
            image.setAttribute('src', product.images[0]);
            image.classList.add('img-fluid', 'position-relative');
            image.style.zIndex = 10000;
            productImage.querySelectorAll('img').forEach((item) => {
              item.remove();
            });
            productImage.insertBefore(image, productImage.firstChild);
          }
        }

        if (variant && !variant.available) {
          // Out of stock
          // Price
          // Media
          const notifyInputVariantID = qvNotify.find('[data-variant-id]');
          const notifyInputVariant = qvNotify.find('[data-variant]');
          const notifyVariantOptions = qvNotify.find('[data-product-options]');

          notifyInputVariantID.val(variant.id);
          if (variant.title != 'Default Title') {
            notifyInputVariant.val(variant.title ? variant.title : '');
            notifyVariantOptions.html(variant.title ? variant.title : '');
          }
          if (variant.featured_image) {
            // First image
            if (productImage) {
              let image = document.createElement('img');
              image.setAttribute('alt', variant.name);
              image.setAttribute('src', variant.featured_image.src);
              image.classList.add('img-fluid', 'position-relative');
              image.style.zIndex = 10000;
              productImage.querySelectorAll('img').forEach((item) => {
                item.remove();
              });
              productImage.insertBefore(image, productImage.firstChild);
            }
          }

          // Update price
          const productPriceContainer = qvNotify.find('[data-product-price]');
          const productPrice = productPriceContainer.find('.js-price');
          const productPriceCompare = productPriceContainer.find('.js-price-compare');
          const moneyFormat = vela.strings.moneyFormat;
          const priceFormat = vela.Currency.formatMoney(variant.price, moneyFormat);

          productPrice.html(priceFormat);

          if (variant.compare_at_price > variant.price) {
            productPriceCompare.removeClass('d-none');
            productPriceCompare.html(vela.Currency.formatMoney(variant.compare_at_price, moneyFormat));
            productPrice.addClass('on-sale');
          } else {
            productPriceCompare.addClass('d-none');
            productPriceCompare.html('');
            productPrice.removeClass('on-sale');
          }
        }
      }
    },

    onVariantChange: function() {
      var variant = this.getVariantFromOptions();
      if ($('[data-single-option-button]', selectors.quickViewContainer).length) {
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
      this.qvAddTitleVariant();
      this.updateNotifyMe(variant);
    }
  };

  return QuickView;
})();

$(document).ready(function() {
  new vela.QuickView('[data-quickview]');
});
