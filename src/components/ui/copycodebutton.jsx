import { useEffect } from "react";

function CopyCodeButton() {
    useEffect(() => {
        const copyButtonLabel = "Copy";

        // Select all pre blocks only once when the component mounts
        const codeBlocks = Array.from(document.querySelectorAll("pre"));

        const addCopyButton = (codeBlock) => {
            // Skip if already initialized or if inside the EULA container
            if (codeBlock.querySelector(".copy-code") || codeBlock.closest(".eula-scroll-box")) return;

            const wrapper = document.createElement("div");
            wrapper.style.position = "relative";

            const copyButton = document.createElement("button");
            copyButton.className = "copy-code";
            copyButton.appendChild(document.createTextNode(` ${copyButtonLabel}`));

            codeBlock.setAttribute("tabindex", "0");
            codeBlock.appendChild(copyButton);

            codeBlock.parentNode.insertBefore(wrapper, codeBlock);
            wrapper.appendChild(codeBlock);

            // Handle copy button click event
            copyButton.addEventListener("click", async () => {
                const code = codeBlock.querySelector("code").innerText;

                // Copy code to clipboard
                await navigator.clipboard.writeText(code);
                copyButton.innerText = "Copied";

                // Reset the button text after 2 seconds
                setTimeout(() => {
                    copyButton.innerText = copyButtonLabel;
                }, 2000);
            });
        };

        // Initialize copy buttons for all code blocks
        codeBlocks.forEach(addCopyButton);

        // Cleanup event listeners when the component unmounts
        return () => {
            codeBlocks.forEach((codeBlock) => {
                const copyButton = codeBlock.querySelector(".copy-code");
                if (copyButton) {
                    copyButton.removeEventListener("click", () => {});
                }
            });
        };
    }, []);

    return null; // No visual output is needed
}

export default CopyCodeButton;
