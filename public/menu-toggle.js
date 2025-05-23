function setupNavbarToggle() {
    const toggleBtn = document.getElementById("menu-toggle");
    const menuItems = document.getElementById("menu-items");
    const iconOpen = document.getElementById("icon-open");
    const iconClose = document.getElementById("icon-close");

    if (!toggleBtn || !menuItems || !iconOpen || !iconClose) {
        setTimeout(setupNavbarToggle, 50);
        return;
    }

    // Initial icon state
    iconOpen.style.display = "block";
    iconClose.style.display = "none";

    // Prevent duplicate bindings
    toggleBtn.removeEventListener("click", toggleHandler);
    toggleBtn.addEventListener("click", toggleHandler);

    function toggleHandler() {
        const isHidden = menuItems.classList.contains("hidden");

        if (isHidden) {
            menuItems.classList.remove("hidden");
            menuItems.classList.add("flex");
            iconOpen.style.display = "none";
            iconClose.style.display = "block";
        } else {
            menuItems.classList.add("hidden");
            menuItems.classList.remove("flex");
            iconOpen.style.display = "block";
            iconClose.style.display = "none";
        }
    }
}

setupNavbarToggle();
document.addEventListener("astro:page-load", setupNavbarToggle);
