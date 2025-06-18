function setupNavbarToggle() {
    const toggleBtn = document.getElementById("menu-toggle");
    const menuItems = document.getElementById("menu-items");
    const iconOpen = document.getElementById("icon-open");
    const iconClose = document.getElementById("icon-close");

    // More robust element checking with longer timeout for initial load
    if (!toggleBtn || !menuItems || !iconOpen || !iconClose) {
        console.log("Elements not found, retrying...");
        setTimeout(setupNavbarToggle, 100);
        return;
    }

    console.log("Setting up navbar toggle");

    // Ensure menu is hidden initially
    menuItems.classList.add("hidden");
    menuItems.classList.remove("flex");

    // Set initial icon state
    iconOpen.style.display = "block";
    iconClose.style.display = "none";

    // Remove any existing event listeners to prevent duplicates
    const newToggleBtn = toggleBtn.cloneNode(true);
    toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);

    // Add the click event listener to the new button
    newToggleBtn.addEventListener("click", function(e) {
        e.preventDefault();
        e.stopPropagation();

        console.log("Toggle button clicked");

        const isHidden = menuItems.classList.contains("hidden");
        console.log("Menu is currently hidden:", isHidden);

        if (isHidden) {
            // Show menu
            menuItems.classList.remove("hidden");
            menuItems.classList.add("flex");
            iconOpen.style.display = "none";
            iconClose.style.display = "block";
            console.log("Menu opened");
        } else {
            // Hide menu
            menuItems.classList.add("hidden");
            menuItems.classList.remove("flex");
            iconOpen.style.display = "block";
            iconClose.style.display = "none";
            console.log("Menu closed");
        }
    });

    // Close menu when clicking outside
    document.addEventListener("click", function(e) {
        if (!newToggleBtn.contains(e.target) && !menuItems.contains(e.target)) {
            menuItems.classList.add("hidden");
            menuItems.classList.remove("flex");
            iconOpen.style.display = "block";
            iconClose.style.display = "none";
        }
    });

    // Close menu on window resize to desktop size
    window.addEventListener("resize", function() {
        if (window.innerWidth >= 1024) { // lg breakpoint
            menuItems.classList.add("hidden");
            menuItems.classList.remove("flex");
            iconOpen.style.display = "block";
            iconClose.style.display = "none";
        }
    });
}

// Multiple initialization strategies for better reliability
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupNavbarToggle);
} else {
    // DOM is already loaded
    setupNavbarToggle();
}

// Handle Astro page transitions
document.addEventListener("astro:page-load", setupNavbarToggle);

// Fallback initialization after a short delay
setTimeout(setupNavbarToggle, 200);