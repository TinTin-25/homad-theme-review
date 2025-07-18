class HvducHeading extends HTMLElement {
  constructor () {
    super();

    this.form = this.querySelector('form');
    this.selects = this.querySelectorAll('select');
    this.submitButton = this.querySelector('[data-button="submit"]');

    this.elementCategories = this.querySelector('[data-filter="categories"]');

    if (this.selects && this.submitButton) {
      this.selects.forEach(element => {
        element.addEventListener('change', () => {
          this.submitButton.hidden = false;
        });
      });
    }

    this.init();
  }

  init() {
    if (this.form) {
      this.form.addEventListener('submit', (e) => {
        e.preventDefault();

        if (this.elementCategories) {
          // this.form.action = this.elementCategories.value;
          // this.form.submit();

          const formData = new FormData(this.form);
          const formDataEntries = [...formData.entries()];
          const formParams = formDataEntries.map(x => `${encodeURIComponent(x[0])}=${encodeURIComponent(x[1])}`).join('&');
          this.submitButton.hidden = true;
          const productGrid = this.querySelector('.hvduc-heading__grid');
          const productEmpty = this.querySelector('.hvduc-heading__empty');
          const headingFilterContent = this.querySelector('.heading-filter__content');
          const url = `${this.elementCategories.value}?${formParams}`;
          if (productGrid) {
            headingFilterContent.classList.add('loading');
            fetch(url)
              .then((response) => response.text())
              .then((responseText) => {
                const html = new DOMParser().parseFromString(responseText, 'text/html');
                const htmlProductGrid = html.getElementById('main-collection-product-grid');

                if (htmlProductGrid && !htmlProductGrid.classList.contains('collection--empty')) {
                  const limit = Number(productGrid.dataset.limit) || 4;
                  const items = htmlProductGrid.querySelectorAll('.row > .col');
                  productGrid.innerHTML = '';
                  productEmpty.hidden = true;
                  for (let i = 0; i < items.length; i++) {
                    if (i >= limit) break;
                    productGrid.appendChild(items[i]);
                  }
                  if (items.length > limit) {
                    this.toggleLoadMore(true, url);
                  } else {
                    this.toggleLoadMore(false);
                  }

                  vela.swatchProduct();
                  // Update wishlist button status
                  if ('wishlist' in vela && 'updateWishlist' in vela.wishlist) {
                      vela.wishlist.updateWishlist();
                  }
                } else {
                  productGrid.innerHTML = '';
                  productEmpty.hidden = false;
                  this.toggleLoadMore(false);
                }
                headingFilterContent.classList.remove('loading');
              })
              .catch((e) => {
                headingFilterContent.classList.remove('loading');
              });
          }
        }
      });
    }
  }

  toggleLoadMore(isActive, url) {
    const productLoadMore = this.querySelector('.hvduc-heading__loadmore');

    if (productLoadMore) {
      productLoadMore.hidden = !isActive;

      if (isActive) {
        const a = productLoadMore.querySelector('a');
        if (a) {
          a.setAttribute('href', url);
        }
      }
    }
  }
}

customElements.define('hvduc-heading', HvducHeading);
