// public/youtube-player.js
document.addEventListener('DOMContentLoaded', () => {
    // Delegate click listener to the document for any overlay with a data attribute
    document.body.addEventListener('click', (event) => {
        const overlay = event.target.closest('[data-yt-overlay]');
        if (!overlay) return;

        const videoId = overlay.getAttribute('data-video-id');
        const containerId = overlay.getAttribute('data-container-id');
        const container = document.getElementById(containerId);

        if (!container || !videoId) return;

        // Create iframe dynamically on click to avoid initial branding
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=0&modestbranding=1&rel=0&showinfo=0&playsinline=1`;
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        iframe.className = 'w-full h-full';

        // Replace the thumbnail and overlay
        container.innerHTML = '';
        container.appendChild(iframe);
    });
});
