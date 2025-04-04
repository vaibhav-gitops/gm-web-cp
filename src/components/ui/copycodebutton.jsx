import { useEffect } from "react";

function CopyCodeButton() {
    useEffect(() => {
        const copyButtonLabel = "Copy";
        const copiedButtonLabel = "Copied";

        // Select all pre blocks
        const codeBlocks = Array.from(document.querySelectorAll("pre"));

        const addCopyButton = (codeBlock) => {
            if (codeBlock.querySelector(".copy-code") || codeBlock.closest(".eula-scroll-box")) return;

            // Create copy button
            const copyButton = document.createElement("button");
            copyButton.className = "copy-code";
            copyButton.innerText = copyButtonLabel;

            // Apply styling similar to GitHub
            Object.assign(copyButton.style, {
                position: "absolute",
                top: "8px",
                right: "8px",
                padding: "4px 8px",
                border: "none",
                background: "rgba(255, 255, 255, 0.1)",
                color: "#ddd",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "bold",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                transition: "background 0.2s ease-in-out",
                zIndex: "9",
            });

            // Hover effect
            copyButton.addEventListener("mouseenter", () => (copyButton.style.background = "rgba(255, 255, 255, 0.2)"));
            copyButton.addEventListener("mouseleave", () => (copyButton.style.background = "rgba(255, 255, 255, 0.1)"));

            // Ensure the code block has relative positioning
            codeBlock.style.position = "relative";
            codeBlock.style.overflowX = "auto"; // Prevents layout issues on mobile

            // Append button inside pre block
            codeBlock.appendChild(copyButton);

            // Handle copy event
            copyButton.addEventListener("click", async () => {
                const code = codeBlock.querySelector("code").innerText;

                try {
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        await navigator.clipboard.writeText(code);
                    } else {
                        // Fallback for mobile
                        const textArea = document.createElement("textarea");
                        textArea.value = code;
                        textArea.style.position = "absolute";
                        textArea.style.left = "-9999px";
                        document.body.appendChild(textArea);
                        textArea.select();
                        document.execCommand("copy");
                        document.body.removeChild(textArea);
                    }

                    copyButton.innerText = copiedButtonLabel;
                    setTimeout(() => (copyButton.innerText = copyButtonLabel), 2000);
                } catch (err) {
                    console.error("Copy failed:", err);
                    alert("Copying not supported on this browser.");
                }
            });
        };

        codeBlocks.forEach(addCopyButton);

        // Cleanup function
        return () => {
            document.querySelectorAll(".copy-code").forEach((btn) => btn.remove());
        };
    }, []);

    return null;
}

export default CopyCodeButton;
