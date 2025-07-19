(function () {
  const applyStyle = () => {
    const chat = document.querySelector("inbox-online-store-chat");
    if (!chat || !chat.shadowRoot) return false;

    const button = chat.shadowRoot.querySelector(".chat-toggle.mobile-only");
    if (button) {
      button.style.position = "fixed";
      button.style.bottom = "65px";
      button.style.right = "8px";
      button.style.zIndex = "9999";
      return true;
    }

    return false;
  };

  const init = () => {
    if (applyStyle()) {
      const chat = document.querySelector("inbox-online-store-chat");
      const observer = new MutationObserver(() => applyStyle());
      observer.observe(chat.shadowRoot, { childList: true, subtree: true });
      window.addEventListener("resize", applyStyle);
    } else {
      requestAnimationFrame(init);
    }
  };

  requestAnimationFrame(init);
})();
