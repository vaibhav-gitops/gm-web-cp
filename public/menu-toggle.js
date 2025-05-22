document.addEventListener("DOMContentLoaded", () => {
    const toggleBtn = document.getElementById("menu-toggle");
    const menuItems = document.getElementById("menu-items");
    const iconOpen = document.getElementById("icon-open");
    const iconClose = document.getElementById("icon-close");

    if (!toggleBtn || !menuItems) return;

    toggleBtn.addEventListener("click", () => {
        const isOpen = menuItems.classList.contains("flex");

        menuItems.classList.toggle("hidden", isOpen);
        menuItems.classList.toggle("flex", !isOpen);
        iconOpen.classList.toggle("hidden", !isOpen);
        iconClose.classList.toggle("hidden", isOpen);
    });
});
