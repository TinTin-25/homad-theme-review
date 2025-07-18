if (!customElements.get('pickup-availability')) {
  class PickupAvailability extends HTMLElement {
    constructor() {
      super();

      if (!this.hasAttribute('available')) return;

      this.errorHtml = this.querySelector('template').content.firstElementChild.cloneNode(true);
      this.fetchAvailability(this.dataset.variantId);
    }

    fetchAvailability(variantId) {
      if (!variantId) return;

      let rootUrl = this.dataset.rootUrl;
      if (!rootUrl.endsWith('/')) {
        rootUrl = rootUrl + '/';
      }
      const variantSectionUrl = `${rootUrl}variants/${variantId}/?section_id=pickup-availability`;

      fetch(variantSectionUrl)
        .then((response) => response.text())
        .then((text) => {
          const sectionInnerHTML = new DOMParser()
            .parseFromString(text, 'text/html')
            .querySelector('.shopify-section');
          this.renderPreview(sectionInnerHTML);
        })
        .catch((e) => {
          this.renderError();
        });
    }

    update(variant) {
      if (variant?.available) {
        this.fetchAvailability(variant.id);
      } else {
        this.removeAttribute('available');
        this.innerHTML = '';
      }
    }

    renderError() {
      this.innerHTML = '';
      this.appendChild(this.errorHtml);
    }

    renderPreview(sectionInnerHTML) {
      const modal = document.getElementById('modal-pickup-availability');
      if (modal) modal.remove();

      if (!sectionInnerHTML.querySelector('pickup-availability-preview')) {
        this.innerHTML = '';
        this.removeAttribute('available');
        return;
      }

      this.innerHTML = sectionInnerHTML.querySelector('pickup-availability-preview').outerHTML;
      this.setAttribute('available', '');

      document.body.appendChild(sectionInnerHTML.querySelector('.pickup-availability-modal'));
    }
  }

  customElements.define('pickup-availability', PickupAvailability);
}
