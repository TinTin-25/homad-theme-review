$(document).ready(function() {
    $('.colleciton_special').each(function() {
        var $this = $(this);
        let color = $this.data('color-hover');
        let text_title = $this.get(0).querySelectorAll('.collection-list-special__title span'),
            text_count = $this.get(0).querySelectorAll('.collection-list-special__count span')

        $this.find('.collection-list__special').on('mousemove', function (e) {
            this.img = this.querySelector('.hover-image');
            if (this.img != null) {
                const containerRect = this.getBoundingClientRect();
                const x = e.clientX - containerRect.left;
                const y = e.clientY - containerRect.top;
                this.img.style.left = `${x}px`;
                this.img.style.top = `${y}px`;
                setColorText(text_title, this.img);
                setColorText(text_count, this.img);
            }
        }).on('mouseleave', function (e) {
            $this.find('.collection-list-special__title span').removeAttr('style')
            $this.find('.collection-list-special__count span').removeAttr('style')
        })

        function setColorText(element, imageElement) {
            element.forEach(textElement => {
                const rect = textElement.getBoundingClientRect();
                const imageRect = imageElement.getBoundingClientRect();
                if (
                    imageRect.left < rect.right &&
                    imageRect.right > rect.left &&
                    imageRect.top < rect.bottom &&
                    imageRect.bottom > rect.top
                ) {
                    textElement.style.color = color;
                } else {
                    textElement.style.color = '';
                }
            })
        }
    });
});
