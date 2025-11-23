// Gallery lightbox (masonry gallery) for images + video
// Finds .masonry-item entries and opens them in a lightbox (#lightbox)
(() => {
    const gallery = document.getElementById('masonry-gallery');
    const lightbox = document.getElementById('lightbox');
    if (!gallery || !lightbox) return;

    const items = Array.from(gallery.querySelectorAll('.masonry-item'));
    if (items.length === 0) return;

    const mediaContainer = lightbox.querySelector('.lightbox-media');
    const closeBtn = lightbox.querySelector('.lightbox-close');
    const prevBtn = lightbox.querySelector('.lightbox-prev');
    const nextBtn = lightbox.querySelector('.lightbox-next');

    let currentIndex = -1;
    let currentMediaEl = null;

    // Build a simple index of sources and types for navigation
    const catalog = items.map((it) => {
        const type = it.dataset.type === 'video' ? 'video' : 'image';
        const src = type === 'video' ? it.dataset.src : (it.querySelector('img') ? it.querySelector('img').getAttribute('src') : null);
        const alt = type === 'image' && it.querySelector('img') ? it.querySelector('img').getAttribute('alt') : '';
        return { el: it, type, src, alt };
    });

    function openAt(index) {
        if (index < 0 || index >= catalog.length) return;
        const entry = catalog[index];
        if (!entry || !entry.src) return;

        // Clear previous media
        mediaContainer.innerHTML = '';
        currentIndex = index;

        if (entry.type === 'image') {
            const img = document.createElement('img');
            img.src = entry.src;
            img.alt = entry.alt || '';
            img.loading = 'eager';
            img.className = 'lightbox-image';
            mediaContainer.appendChild(img);
            currentMediaEl = img;
        } else if (entry.type === 'video') {
            const video = document.createElement('video');
            video.src = entry.src;
            video.controls = true;
            video.autoplay = true;
            video.playsInline = true;
            video.className = 'lightbox-video';
            mediaContainer.appendChild(video);
            currentMediaEl = video;
            // Try to play on supported browsers
            const playPromise = video.play();
            if (playPromise && typeof playPromise.then === 'function') {
                playPromise.catch(() => {
                    // Autoplay might be blocked; show controls and let user start
                    video.autoplay = false;
                });
            }
        }

        // Show lightbox
        lightbox.classList.add('show');
        lightbox.setAttribute('aria-hidden', 'false');

        // Manage focus for accessibility
        if (closeBtn) closeBtn.focus();

        // Update visible state of prev/next (always available but can loop)
        // We'll leave them visible and allow looping navigation
    }

    function closeLightbox() {
        // Pause any playing video
        if (currentMediaEl && currentMediaEl.tagName === 'VIDEO') {
            try { currentMediaEl.pause(); } catch (e) {}
            currentMediaEl.src = '';
        }
        mediaContainer.innerHTML = '';
        currentMediaEl = null;
        currentIndex = -1;
        lightbox.classList.remove('show');
        lightbox.setAttribute('aria-hidden', 'true');
    }

    function showPrev() {
        if (catalog.length === 0) return;
        let idx = (currentIndex - 1 + catalog.length) % catalog.length;
        openAt(idx);
    }
    function showNext() {
        if (catalog.length === 0) return;
        let idx = (currentIndex + 1) % catalog.length;
        openAt(idx);
    }

    // Click handlers: open when clicking an item or its image
    items.forEach((it, idx) => {
        it.addEventListener('click', (e) => {
            e.preventDefault();
            openAt(idx);
        });
        // Also allow keyboard activation
        it.setAttribute('tabindex', '0');
        it.addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter' || ev.key === ' ') {
                ev.preventDefault();
                openAt(idx);
            }
        });
    });

    // Buttons
    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    if (prevBtn) prevBtn.addEventListener('click', showPrev);
    if (nextBtn) nextBtn.addEventListener('click', showNext);

    // Close on overlay click (but not when clicking content)
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (lightbox.classList.contains('show')) {
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') showPrev();
            if (e.key === 'ArrowRight') showNext();
        }
    });

    // Basic swipe support on touch devices for the lightbox-content
    let startX = 0;
    let startY = 0;
    let isSwiping = false;
    const threshold = 40; // px

    lightbox.addEventListener('touchstart', (e) => {
        if (!e.touches || e.touches.length !== 1) return;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isSwiping = true;
    }, { passive: true });

    lightbox.addEventListener('touchmove', (e) => {
        if (!isSwiping || !e.touches || e.touches.length !== 1) return;
        // prevent default scrolling when swiping horizontally inside lightbox
        const dx = e.touches[0].clientX - startX;
        const dy = e.touches[0].clientY - startY;
        if (Math.abs(dx) > Math.abs(dy)) e.preventDefault();
    }, { passive: false });

    lightbox.addEventListener('touchend', (e) => {
        if (!isSwiping) return;
        isSwiping = false;
        const endX = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientX : startX;
        const dx = endX - startX;
        if (Math.abs(dx) > threshold) {
            if (dx > 0) showPrev(); else showNext();
        }
    });

    // Expose for console debugging (optional)
    window.__unityGallery = { openAt, closeLightbox, showNext, showPrev, catalog };
})();
