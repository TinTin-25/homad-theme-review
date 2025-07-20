let vela = window.vela || {};
vela.wishlist = {
    // CONTANTS
    ID: 'vela_wishlist',
    name: '',
    symbol: '|',
    maximumItems: 20,
    selectors: {
        count: '[data-wishlist-count]',
        button: '.js-btn-wishlist',
        page: '[data-wishlist-page]',
        grid: '[data-wishlist-grid]',
        empty: '.js-wishlist-empty'
    },
    classes: {
        added: 'is-added',
        adding: 'is-adding',
        empty: 'is-empty',
        loading: 'loading',
        hidden: 'd-none'
    },
    strings: {
        title: 'Wishlist',
        add: vela.strings.add_to_wishlist,
        remove: vela.strings.remove_wishlist
    },
    products: [],

    // FUNCTIONS
    init: () => {
        // Update wishlist item count and button status
        vela.wishlist.updateWishlist();

        // Wishlist button event on click
        vela.wishlist.buttons();
    },
    initPage: async () => {
        const page = document.querySelector(vela.wishlist.selectors.page);
        const wishlistGrid = document.querySelector(vela.wishlist.selectors.grid);

        if (page && wishlistGrid) {
            page.classList.add(vela.wishlist.classes.loading);
            wishlistGrid.replaceChildren();
            const isEmpty = vela.wishlist.products && vela.wishlist.products.length === 0 && true;
            const elementEmpty = page.querySelector(vela.wishlist.selectors.empty);
            isEmpty ? page.classList.add(vela.wishlist.classes.empty) : page.classList.remove(vela.wishlist.classes.empty);

            if (elementEmpty) {
                isEmpty ? elementEmpty.classList.remove(vela.wishlist.classes.hidden) : elementEmpty.classList.add(vela.wishlist.classes.hidden);
            }

            let promises = [];
            vela.wishlist.products.forEach((handle, index) => {
                if (handle && handle !== '') {
                    const url = `${window.Shopify.routes.root}products/${handle}?view=product-card`;
                    promises.push(
                        fetch(url)
                            .then(response => response.text())
                            .then(text => {
                                if (text && text !== '') {
                                    let productItem = document.createElement('div');
                                    productItem.classList.add('col');
                                    productItem.innerHTML = text;
                                    return {
                                        element: productItem,
                                        handle: handle,
                                        index: index
                                    };
                                }
                            })
                            .catch(e => {
                                console.error(e);
                            })
                    );
                }
            });

            if (promises.length > 0) {
                let data = await Promise.all(promises);
                data.forEach(item => {
                    if ('element' in item) {
                        wishlistGrid.append(item.element);
                    }
                });

                // After insert wishlist item
                // Trigger event for product card
                try {
                    vela.wishlist.updateWishlist();
                    vela.swatchProduct();
                } catch (e) {}
            }

            page.classList.remove(vela.wishlist.classes.loading);
        }

    },
    reloadButtons: () => {
        // Update wishlist item count and button status
        vela.wishlist.updateWishlist();
    },
    trackAddToWishlist: (handle) => {
        if (window.analytics && typeof analytics.publish === 'function') {
            analytics.publish('add_to_wishlist', { handle: handle });
        }
    },
    buttons: () => {
        if (jQuery && $) {
            $(document).on('click', vela.wishlist.selectors.button, (e) => {
                e.preventDefault();
                const button = e.currentTarget;
                const isAdded = button.classList.contains(vela.wishlist.classes.added);
                vela.wishlist.addLoading(button);

                const page = document.querySelector(vela.wishlist.selectors.page);

                // Add loading effect
                setTimeout(() => {
                    if (isAdded) {
                        const removeItem = vela.wishlist.removeItem(button.dataset.productHandle);
                        if (removeItem) {
                            vela.wishlist.updateButton(button, false);

                            if (page) {
                                vela.wishlist.initPage();
                            }
                        }
                    } else {
                        const addItem = vela.wishlist.addItem(button.dataset.productHandle);
                        if (addItem) {
                            vela.wishlist.updateButton(button, true);
                            vela.wishlist.trackAddToWishlist(button.dataset.productHandle);

                            if (page) {
                                vela.wishlist.initPage();
                            }
                        }
                    }
                    vela.wishlist.removeLoading(button);
                    vela.wishlist.reloadButtons();
                }, 500);
            });
        }
    },
    addItem: (item) => {
        if (item && item !== '') {
            const currentIndex = vela.wishlist.products.indexOf(item);

            // Remove item if exists
            if (currentIndex !== -1) {
                vela.wishlist.products.splice(currentIndex, 1);
            }

            // Add item to the first index of array
            vela.wishlist.products.unshift(item);
            vela.wishlist.products = vela.wishlist.products.splice(0, vela.wishlist.maximumItems);

            // Update LOCALSTORAGE
            localStorage.setItem(vela.wishlist.ID, vela.wishlist.products.join(vela.wishlist.symbol));

            return true;
        } else {
            return false;
        }
    },
    removeItem: (item) => {
        if (item && item !== '') {
            const currentIndex = vela.wishlist.products.indexOf(item);

            // Remove item if exists
            if (currentIndex !== -1) {
                vela.wishlist.products.splice(currentIndex, 1);
            }

            // Update LOCALSTORAGE
            localStorage.setItem(vela.wishlist.ID, vela.wishlist.products.join(vela.wishlist.symbol));

            return true;
        } else {
            return false;
        }
    },
    addLoading: (selector) => {
        if (selector) {
            const elementLoadingIcon = document.createElement('span');
            elementLoadingIcon.classList.add('spinner-border', 'spinner-border-sm');
            selector.classList.add(vela.wishlist.classes.adding);
            selector.append(elementLoadingIcon);
        }
    },
    removeLoading: (selector) => {
        if (selector) {
            selector.classList.remove(vela.wishlist.classes.adding);
            const elementLoadingIcon = selector.querySelector('.spinner-border');

            if (elementLoadingIcon) {
                elementLoadingIcon.remove();
            }
        }
    },
    updateButton: (button, added) => {
        let buttonLabel = vela.wishlist.strings.add;
        if (added) {
            button.classList.add(vela.wishlist.classes.added);
            buttonLabel = vela.wishlist.strings.remove;
        } else {
            button.classList.remove(vela.wishlist.classes.added);
        }

        button.setAttribute('title', buttonLabel);

        const tooltipText = button.querySelector('.tooltip-inner');
        if (tooltipText) {
            tooltipText.innerHTML = buttonLabel;
        }
        const buttonText = button.querySelector('.text');
        if (buttonText) {
            buttonText.innerHTML = buttonLabel;
        }
    },
    updateWishlist: () => {
        // Update wishlist items count
        document.querySelectorAll(vela.wishlist.selectors.count).forEach(elementCount => {
            elementCount.innerHTML = vela.wishlist.products.length;
        });

        // Update wishlist button on first load
        const buttons = document.querySelectorAll(vela.wishlist.selectors.button);

        buttons.forEach(button => {
            const productHandle = button.dataset.productHandle;
            if (productHandle) {
                const currentIndex = vela.wishlist.products.indexOf(productHandle);
                if (currentIndex !== -1) {
                    vela.wishlist.updateButton(button, true);
                } else {
                    vela.wishlist.updateButton(button, false);
                }
            }
        });
    }
};

// LOAD DATA FROM LOCAL STORAGE
const wishlistData = localStorage.getItem(vela.wishlist.ID);
if (wishlistData !== '' && wishlistData !== null) {
    const duchvProducts = wishlistData.split(vela.wishlist.symbol);
    duchvProducts.forEach(function(item) {
        vela.wishlist.products.push(item);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    vela.wishlist.init();
    vela.wishlist.initPage();
});
