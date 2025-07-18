class FrequentlyBought extends HTMLElement {
  constructor() {
    super();

    this.strings = {
      active: 'active',
      inactive: 'inactive',
      hidden: 'd-none',
      sale: 'on-sale'
    };

    this.subTotal = this.querySelector('.fbvela-subtotal__price');
    this.subTotalValue = this.subTotal ? Number(this.subTotal.dataset.subTotal) : 0;
    this.subTotalCompare = this.querySelector('.fbvela-subtotal__compare-price');
    this.subTotalCompareValue = this.subTotalCompare ? Number(this.subTotalCompare.dataset.subTotalCompare) : 0;
    this.onSalePrice = this.querySelector('.fbvela-onsale__price');

    this.addToCartButton = this.querySelector('.fbvela-actions__submit');
    this.form = this.querySelector('.frequently-bought__form');

    this.checkboxs = this.querySelectorAll('.fbproduct-card__checkbox');
    this.variantSelects = this.querySelectorAll('[name="items[][id]"]');

    this.checkboxs.forEach((element) => {
      element.addEventListener('change', this._onCheckboxChange.bind(this));
    });

    this.variantSelects.forEach((element) => {
      element.addEventListener('change', this._onSelectChange.bind(this));
    });

    if (this.addToCartButton) {
      this.addToCartButton.addEventListener('click', this.onSubmitForm.bind(this));
    }
  }

  _onCheckboxChange(event) {
    const checkbox = event.currentTarget;
    const isMainProduct = checkbox.dataset.main === 'true';

    if (isMainProduct) {
      checkbox.checked = !checkbox.checked;
      return;
    }

    const productCard = checkbox.closest('.fbproduct-card');
    if (productCard) {
      const selectedVariant = productCard.querySelector('[name="items[][id]"] option:checked');

      if (selectedVariant) {
        const available = selectedVariant.dataset.available === 'true';
        if (available) {
          const productId = productCard.dataset.productId;
          const productCardImages = this.querySelectorAll(`.fbproduct-card__image[data-product-id="${productId}"]`);

          // Update class name for product card and product card image
          this.toggleClass(productCard, checkbox.checked);
          productCardImages.forEach((productCardImage) => this.toggleClass(productCardImage, checkbox.checked));

          const currentPrice = Number(selectedVariant.dataset.price);
          const currentPriceCompare = Number(selectedVariant.dataset.priceCompare);

          if (checkbox.checked) {
            this.subTotalValue += currentPrice;
            this.subTotalCompareValue += currentPriceCompare;
          } else {
            this.subTotalValue -= currentPrice;
            this.subTotalCompareValue -= currentPriceCompare;
          }

          this.updatePrice();
          this.updateSlick(productId);
        } else {
          this.updateCheckbox(checkbox, false);
        }
      }
    }
  }

  _onSelectChange(event) {
    const select = event.currentTarget;
    const productCard = select.closest('.fbproduct-card');
    const checkbox = productCard ? productCard.querySelector('.fbproduct-card__checkbox') : null;

    if (productCard && checkbox) {
      const productId = productCard.dataset.productId;
      const variantId = select.value;
      const productCardImages = this.querySelectorAll(`.fbproduct-card__image[data-product-id="${productId}"]`);
      const currentOption = select.querySelector('option:checked');
      const available = currentOption.dataset.available === 'true';
      const currentPrice = Number(currentOption.dataset.price);
      const currentPriceCompare = Number(currentOption.dataset.priceCompare);

      if (available) {
        this.updateCheckbox(checkbox, true);
        this.updateVariantAvailable(productCard, true);
      } else {
        this.updateCheckbox(checkbox, false);
        this.updateVariantAvailable(productCard, false);
      }

      this.toggleClass(productCard, checkbox.checked);
      productCardImages.forEach((productCardImage) => this.toggleClass(productCardImage, checkbox.checked));

      // Go to image
      this.updateSlick(productId);

      // Update variant image
      this.updateVariantImage(variantId, productCard, productCardImages);

      // Update variant price
      this.upateVariantPrice(productCard, currentPrice, currentPriceCompare);

      this.updateSubTotal();
      this.updatePrice();
    }
  }

  updateCheckbox(element, status) {
    element.checked = status;
    element.disabled = !status;
  }

  updatePrice() {
    if (this.subTotal && this.subTotalCompare) {
      this.subTotal.innerHTML = vela.Currency.formatMoney(this.subTotalValue, vela.strings.moneyFormat);
      this.subTotal.dataset.subTotal = this.subTotalValue;
      this.subTotalCompare.innerHTML = vela.Currency.formatMoney(this.subTotalCompareValue, vela.strings.moneyFormat);
      this.subTotalCompare.dataset.subTotalCompare = this.subTotalCompareValue;

      if (this.subTotalCompareValue > this.subTotalValue) {
        this.subTotal.classList.add(this.strings.sale);
        this.subTotalCompare.classList.remove(this.strings.hidden);

        if (this.onSalePrice) {
          this.onSalePrice.parentElement.classList.remove(this.strings.hidden)
        }
      } else {
        this.subTotal.classList.remove(this.strings.sale);
        this.subTotalCompare.classList.add(this.strings.hidden);

        if (this.onSalePrice) {
          this.onSalePrice.parentElement.classList.add(this.strings.hidden)
        }
      }

      if (this.onSalePrice) {
        this.onSalePrice.innerHTML = vela.Currency.formatMoney(this.subTotalCompareValue - this.subTotalValue, vela.strings.moneyFormat);
      }

      if (this.subTotalValue === 0) {
        if (this.addToCartButton) this.addToCartButton.disabled = true;
      } else {
        if (this.addToCartButton) this.addToCartButton.disabled = false;
      }
    }
  }

  updateSubTotal() {
    let subTotal = 0;
    let subTotalCompare = 0;
    const checkboxs = this.querySelectorAll('.fbproduct-card__checkbox:checked');
    checkboxs.forEach((checkbox) => {
      const productCard = checkbox.closest('.fbproduct-card');
      const optionSelected = productCard.querySelector('[name="items[][id]"] option:checked');
      const optionPrice = optionSelected.dataset.price;
      const optionPriceCompare = optionSelected.dataset.priceCompare;

      if (optionPrice) subTotal += Number(optionPrice);
      if (optionPriceCompare) subTotalCompare += Number(optionPriceCompare);
    });

    this.subTotalValue = subTotal;
    this.subTotalCompareValue = subTotalCompare;
  }

  updateSlick(productId) {
    const carousel = this.querySelector('.js-carousel');

    if (carousel) {
      const currentItem = this.querySelector(`.fbproduct-card__image[data-product-id="${productId}"]`);

      if (currentItem) {
        const index = Number(currentItem.dataset.index);
        if (!Number.isNaN(index)) {
          $(carousel).slick('slickGoTo', index);
        }
      }
    }
  }

  updateVariantImage(variantId, element, images) {
    const variantImage = element.querySelector(`.fbproduct-card__image[data-variant-id="${variantId}"]`);
    if (variantImage) {
      images.forEach((image) => {
        const imageContainer = image.querySelector('.fbproduct-card__image-wrap');
        if (imageContainer) {
          imageContainer.innerHTML = variantImage.innerHTML;
        }
      });
    }
  }

  upateVariantPrice(element, currentPrice, currentPriceCompare) {
    const productCardPrice = element.querySelector('.fbproduct-card__price');
    const productCardPriceCompare = element.querySelector('.fbproduct-card__price-compare');
    if (productCardPrice && productCardPriceCompare) {
      const productCardPriceSave = element.querySelector('.fbproduct-card__price-save');
      const currentPriceSave = currentPriceCompare - currentPrice;
      if (currentPriceCompare > currentPrice) {
        productCardPrice.classList.add(this.strings.sale);
        productCardPriceCompare.classList.remove(this.strings.hidden);
        productCardPriceSave.classList.remove(this.strings.hidden);
      } else {
        productCardPrice.classList.remove(this.strings.sale);
        productCardPriceCompare.classList.add(this.strings.hidden);
        productCardPriceSave.classList.add(this.strings.hidden);
      }
      productCardPrice.innerHTML = vela.Currency.formatMoney(currentPrice, vela.strings.moneyFormat);
      productCardPriceCompare.innerHTML = vela.Currency.formatMoney(currentPriceCompare, vela.strings.moneyFormat);
      productCardPriceSave.innerHTML = vela.Currency.formatMoney(currentPriceSave, vela.strings.moneyFormat);
    }
  }

  updateVariantAvailable(container, available) {
    const checkboxLabel = container.querySelector('.fbproduct-card__checkbox-label');
    const elementID = container.querySelector('[name="items[][id]"]');
    const elementQuantity = container.querySelector('[name="items[][quantity]"]');

    // Remove out of stock label
    if (checkboxLabel) {
      const elementOFT = checkboxLabel.querySelector('.fbproduct-card__label');
      if (elementOFT) elementOFT.remove();
    }

    if (available) {
      elementID.disabled = false;
      elementQuantity.disabled = false;
    } else {
      elementID.disabled = true;
      elementQuantity.disabled = true;

      // Update out of stock label
      if (checkboxLabel) {
        const elementOutOfStock = document.createElement('span');
        elementOutOfStock.classList.add('fbproduct-card__label');
        elementOutOfStock.innerText = `(${vela.strings.outStock})`;
        checkboxLabel.appendChild(elementOutOfStock);
      }
    }
  }

  toggleClass(element, active) {
    if (active) {
      element.classList.remove(this.strings.inactive);
      element.classList.add(this.strings.active);
    } else {
      element.classList.remove(this.strings.active);
      element.classList.add(this.strings.inactive);
    }
  }

  onSubmitForm(event) {
    const button = event.currentTarget;
    if (this.form) {
      let spinner = document.createElement('span');
      spinner.classList.add('spinner-border', 'spinner-border-sm');

      const removeSpinner = (element) => {
        const spinnerSelect = element.querySelector('.spinner-border');
        if (spinnerSelect) {
          spinnerSelect.remove();
        }
        element.classList.remove('is-adding');
      };

      button.classList.add('is-adding');
      button.appendChild(spinner);

      const formData = new FormData(this.form);
      try {
        fetch(`${routes.cart_add_url}.js`, {
          method: 'POST',
          body: formData
        })
        .then((response) => {
          return response.json();
        })
        .then(() => {
          // Success
          ajaxCart.load(true);
          removeSpinner(button);
        })
        .catch((error) => {
          removeSpinner(this);
          console.error('Error:', error);
        });
      } catch (e) {
        removeSpinner(button);
      }
    }
  }
}

customElements.define('frequently-bought', FrequentlyBought);
