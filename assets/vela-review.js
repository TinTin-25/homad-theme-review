class VelaReview extends HTMLElement {
  constructor() {
    super();
    this.style = this.dataset.styles;

    this.initElement();
  }

  initElement() {
    setTimeout(() => {
      const reviewWidget = this.querySelector('.jdgm-widget');
      const reviewWidgetBadge = this.querySelector('.jdgm-prev-badge');

      if (reviewWidget && reviewWidgetBadge) {
        const reviewContent = document.createElement('div');
        reviewContent.classList.add('vela-review__content');
        const reviewAverage = Number(reviewWidgetBadge.dataset.averageRating);
        const reviewCount = reviewWidgetBadge.querySelector('.jdgm-prev-badge__text').innerHTML;

        // const starIcon = '<svg class="vela-review__star-icon" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M1728 647q0 22-26 48l-363 354 86 500q1 7 1 20 0 21-10.5 35.5t-30.5 14.5q-19 0-40-12l-449-236-449 236q-22 12-40 12-21 0-31.5-14.5t-10.5-35.5q0-6 2-20l86-500-364-354q-25-27-25-48 0-37 56-46l502-73 225-455q19-41 49-41t49 41l225 455 502 73q56 9 56 46z"/></svg>';
        // const starIconEmpty = '<svg class="vela-review__star-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M528.1 171.5L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6zM388.6 312.3l23.7 138.4L288 385.4l-124.3 65.3 23.7-138.4-100.6-98 139-20.2 62.2-126 62.2 126 139 20.2-100.6 98z"/></svg>';
        const starIcon = '<span class="jdgm-star jdgm--on"></span>';
        // const starIconEmpty = '<span class="jdgm-star jdgm--off"></span>';
        const reviewString = `<span class="vela-review__badge"><span class="vela-review__star">${starIcon}</span><span class="vela-review__rating">${reviewAverage.toFixed(2)}</span></span><span class="vela-review__count">${reviewCount}</span>`;
        reviewContent.innerHTML = reviewString;

        this.clearContent();
        this.appendChild(reviewContent);
      }
    }, '2000');
  }

  clearContent() {
    this.querySelectorAll('.vela-review__content').forEach((element) => {
      element.remove();
    });
  }
}

customElements.define('vela-review', VelaReview);
