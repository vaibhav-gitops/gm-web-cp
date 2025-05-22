// Self-executing function for modal, EULA, and form submission functionality
(function() {
    // ====== STATE TRACKING ======
    let modalInitialized = false;
    let eulaInitialized = false;
    let formSubmitInitialized = false;

    // ====== MODAL FUNCTIONALITY ======
    function initializeModalHandlers() {
        if (modalInitialized) return;

        function openModal() {
            const modal = document.querySelector('#downloadModal');
            if (modal) {
                modal.style.display = 'block';
                document.documentElement.style.overflow = 'hidden';
                document.body.style.overflow = 'hidden';
                document.body.style.touchAction = 'none';

                // Reset and initialize EULA logic when modal opens
                resetAndInitializeEULALogic();
            }
        }

        function closeModal() {
            const modal = document.querySelector('#downloadModal');
            if (modal) {
                modal.style.display = 'none';
                document.documentElement.style.overflow = '';
                document.body.style.overflow = '';
                document.body.style.touchAction = '';
            }
        }

        // Event delegation for download links
        document.body.addEventListener('click', (e) => {
            // Check for download links
            if (e.target && e.target.id === 'downloadLink') {
                e.preventDefault();
                openModal();
            }

            // Check for close button clicks
            if (e.target && (
                e.target.classList.contains('close-modal') ||
                (e.target.parentElement && e.target.parentElement.classList.contains('close-modal'))
            )) {
                closeModal();
            }

            // Close when clicking outside modal content
            if (e.target && e.target.id === 'downloadModal') {
                closeModal();
            }
        });

        // Handle touch events
        document.body.addEventListener('touchstart', (e) => {
            if (e.target && e.target.id === 'downloadLink') {
                e.preventDefault();
                openModal();
            }
        });

        // Set up modal-specific event listeners
        const modal = document.querySelector('#downloadModal');
        if (modal) {
            const closeButton = modal.querySelector('.close-modal');
            if (closeButton) {
                closeButton.addEventListener('click', closeModal);
            }

            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal();
                }
            });
        }

        modalInitialized = true;
    }

    // ====== EULA FUNCTIONALITY ======
    function resetAndInitializeEULALogic() {
        const downloadForm = document.getElementById('downloadForm');
        if (!downloadForm) {
            return false;
        }

        // Clear the initialization flag to force reinitialization
        downloadForm.removeAttribute('data-initialized');

        // Get form elements
        const eulaScrollBox = document.getElementById('eulaScrollBox');
        const acceptTermsCheckbox = document.getElementById('acceptTerms');
        const downloadButton = document.getElementById('downloadButton');

        if (!eulaScrollBox || !acceptTermsCheckbox || !downloadButton) {
            return false;
        }

        // Reset form state
        acceptTermsCheckbox.disabled = true;
        acceptTermsCheckbox.checked = false;
        downloadButton.disabled = true;

        // Force scroll back to top
        if (eulaScrollBox) {
            eulaScrollBox.scrollTop = 0;
        }

        // Now initialize the EULA logic
        initializeEULALogic();

        return true;
    }

    function initializeEULALogic() {
        const eulaScrollBox = document.getElementById('eulaScrollBox');
        const acceptTermsCheckbox = document.getElementById('acceptTerms');
        const downloadButton = document.getElementById('downloadButton');
        const emailInput = document.getElementById('email');
        const emailError = document.getElementById('email-error');
        const form = document.getElementById('downloadForm');

        if (!eulaScrollBox || !acceptTermsCheckbox || !downloadButton || !emailInput || !emailError || !form) return;

        const emailPattern = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        function validateEmail() {
            if (emailInput.value === '') {
                emailError.textContent = 'Email is required';
                emailError.classList.remove('hidden');
                return false;
            } else if (!emailPattern.test(emailInput.value)) {
                emailError.textContent = 'Please enter a valid email address';
                emailError.classList.remove('hidden');
                return false;
            } else {
                emailError.classList.add('hidden');
                return true;
            }
        }

        function checkScrolledToBottom() {
            const scrollableHeight = eulaScrollBox.scrollHeight - eulaScrollBox.clientHeight;
            const SCROLL_THRESHOLD = 20;
            if (eulaScrollBox.scrollTop + SCROLL_THRESHOLD >= scrollableHeight) {
                acceptTermsCheckbox.disabled = false;
            }
        }

        checkScrolledToBottom();

        function updateDownloadButtonState() {
            const isEmailValid = validateEmail();
            const isCheckboxChecked = acceptTermsCheckbox.checked;
            downloadButton.disabled = !(isEmailValid && isCheckboxChecked);
        }

        emailInput.addEventListener('input', updateDownloadButtonState);
        emailInput.addEventListener('blur', updateDownloadButtonState);
        eulaScrollBox.addEventListener('scroll', checkScrolledToBottom);
        acceptTermsCheckbox.addEventListener('change', updateDownloadButtonState);

        form.addEventListener('submit', (e) => {
            if (!validateEmail()) {
                e.preventDefault();
                emailInput.focus();
            }
        });
    }

    // ====== FORM SUBMISSION FUNCTIONALITY ======
    function initializeFormSubmission() {
        if (formSubmitInitialized) return;

        const form = document.getElementById('downloadForm');
        const downloadModal = document.getElementById('downloadModal');

        if (!form) {
            return;
        }

        // Remove any existing submit listeners to prevent duplicates
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);

        // Re-add the EULA initialization after cloning
        if (document.getElementById('eulaScrollBox')) {
            initializeEULALogic();
        }

        // Add the submit event listener to the new form
        newForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent default form submission

            const emailInput = document.getElementById('email');
            const acceptTermsCheckbox = document.getElementById('acceptTerms');
            const downloadButton = document.getElementById('downloadButton');
            const buttonText = document.getElementById('buttonText');
            const spinner = document.getElementById('spinner');

            if (!emailInput || !acceptTermsCheckbox || !downloadButton) {
                return;
            }

            spinner.classList.remove("hidden");
            buttonText.classList.add("hidden");

            const apiUrl = "https://7tip4nqocj.execute-api.us-east-1.amazonaws.com/SendDownloadMail";

            try {
                const response = await fetch(apiUrl, {
                    method: "POST",
                    credentials: 'include',
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email: emailInput.value }),
                });

                if (!response.ok) {
                    throw new Error("Failed to send email");
                }

                alert("Thank you! We've sent an email with the Gitmoxi Trial download link. Please check your inbox (and spam folder) in a few minutes.");

            } catch (error) {
                alert("Error sending email. Please try again.");
            } finally {
                buttonText.classList.remove("hidden");
                spinner.classList.add("hidden");
                downloadButton.disabled = true;
                newForm.reset();

                // Re-disable the checkbox for the next time
                const checkbox = document.getElementById('acceptTerms');
                if (checkbox) {
                    checkbox.disabled = true;
                    checkbox.checked = false;
                }

                setTimeout(() => {
                    if (downloadModal) {
                        downloadModal.style.display = 'none';
                        document.documentElement.style.overflow = '';
                        document.body.style.overflow = '';
                        document.body.style.touchAction = '';
                    }
                }, 400);
            }
        });

        formSubmitInitialized = true;
    }

    // ====== CHECK AND INITIALIZE ======
    function checkAndInitializeAll() {
        // First, initialize modal handlers if download link exists
        if (!modalInitialized && document.getElementById('downloadLink')) {
            initializeModalHandlers();
        }

        // Then, check for standalone download form
        if (!eulaInitialized && document.getElementById('downloadForm')) {
            initializeEULALogic();
        }

        // Finally, set up form submission logic
        if (!formSubmitInitialized && document.getElementById('downloadForm')) {
            initializeFormSubmission();
        }
    }

    // ====== RUN AT MULTIPLE POINTS ======

    // 1. Immediate check
    checkAndInitializeAll();

    // 2. On DOMContentLoaded
    document.addEventListener('DOMContentLoaded', checkAndInitializeAll);

    // 3. On window load
    window.addEventListener('load', checkAndInitializeAll);

    // ====== OBSERVE DOM CHANGES ======
    const observer = new MutationObserver((mutations) => {
        let shouldCheck = false;

        for (const mutation of mutations) {
            if (mutation.type === 'childList' && mutation.addedNodes.length) {
                // Look for our target elements
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Direct match or contains our elements
                        if (node.id === 'downloadLink' || node.id === 'downloadForm' ||
                            node.id === 'downloadModal' ||
                            node.querySelector('#downloadLink') ||
                            node.querySelector('#downloadForm') ||
                            node.querySelector('#downloadModal')) {
                            shouldCheck = true;
                            break;
                        }
                    }
                }
            }

            if (shouldCheck) break;
        }

        if (shouldCheck) {
            checkAndInitializeAll();
        }
    });

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false
    });

    // ====== HANDLE NAVIGATION ======

    // Track URL changes
    let lastUrl = location.href;

    // History API navigation
    window.addEventListener('popstate', () => {
        // Reset initialization flags when navigating
        if (location.href !== lastUrl) {
            modalInitialized = false;
            eulaInitialized = false;
            formSubmitInitialized = false;
            lastUrl = location.href;
        }

        setTimeout(checkAndInitializeAll, 100);
    });

    // URL change detector
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            modalInitialized = false;
            eulaInitialized = false;
            formSubmitInitialized = false;
            lastUrl = url;
            setTimeout(checkAndInitializeAll, 100);
        }
    }).observe(document, { subtree: true, childList: true });
})();