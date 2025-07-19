(function () {
  const rapiBundleSelector = ".rapi-bundles__bar";
  const discountedSelector = ".rapi-bundles__bar-price";
  const fullPriceSelector = ".rapi-bundles__bar-full-price";

  function showPricesRapi(discountedText, fullText) {
    const discountedEl = document.getElementById("dealeasy-override-price");
    const compareEl = document.getElementById("dealeasy-compare-price");

    if (!discountedEl || !compareEl) {
      console.warn("❌ Elementos de precio no encontrados");
      return;
    }

    // Oculta todos los precios originales
    document
      .querySelectorAll(
        ".js-product-price, .js-product-compare-price, .product-unit-price"
      )
      .forEach(el => {
        if (el !== discountedEl && el !== compareEl) el.style.display = "none";
      });

    // Actualiza y muestra los nuevos precios
    discountedEl.textContent = discountedText;
    discountedEl.style.display = "inline-block";

    compareEl.textContent = fullText;
    compareEl.style.display = "inline-block";

    console.log("✅ Precios de Rapi aplicados:", discountedText, fullText);
  }

  function activarRapiBundles() {
    document.querySelectorAll(rapiBundleSelector).forEach(option => {
      option.addEventListener("click", () => {
        const discount = option
          .querySelector(discountedSelector)
          ?.textContent.trim();
        const full = option.querySelector(fullPriceSelector)?.textContent.trim();
        if (discount && full) showPricesRapi(discount, full);
      });
    });
  }

  function esperarBundles() {
    const observer = new MutationObserver(() => {
      if (
        document.querySelector(rapiBundleSelector) &&
        document.getElementById("dealeasy-override-price") &&
        document.getElementById("dealeasy-compare-price")
      ) {
        console.log("🟢 Detectados bundles Rapi");
        activarRapiBundles();
        observer.disconnect();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  document.addEventListener("DOMContentLoaded", esperarBundles);
})();
