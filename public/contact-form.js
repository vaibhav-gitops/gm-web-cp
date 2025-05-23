// CSP-Safe Form Handler - No inline scripts needed
class FormHandler {
    constructor() {
        this.initialized = false;
        this.setupComplete = new Set(); // Track which forms have been set up
        this.init();
    }

    init() {
        if (this.initialized) return;

        // Use multiple initialization methods to ensure compatibility
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupForms());
        } else {
            this.setupForms();
        }

        // For Astro pages
        document.addEventListener('astro:page-load', () => this.setupForms());

        // Fallback for navigation
        window.addEventListener('load', () => this.setupForms());

        this.initialized = true;
    }

    setupForms() {
        // Find all forms that need handling
        const downloadForm = document.querySelector('[data-form-type="download"]');
        const contactForm = document.querySelector('[data-form-type="contact"]') ||
            document.getElementById('contactForm') ||
            document.getElementById('form');

        if (downloadForm && !this.setupComplete.has('download')) {
            this.setupDownloadForm(downloadForm);
            this.setupComplete.add('download');
        }

        if (contactForm && contactForm !== downloadForm && !this.setupComplete.has('contact')) {
            this.setupContactForm(contactForm);
            this.setupComplete.add('contact');
        }
    }

    setupDownloadForm(form) {
        const eulaScrollBox = form.querySelector('#eulaScrollBox');
        const acceptTermsCheckbox = form.querySelector('#acceptTerms');
        const downloadButton = form.querySelector('#downloadButton');
        const emailInput = form.querySelector('#email');
        const emailError = form.querySelector('#email-error');

        if (!eulaScrollBox || !acceptTermsCheckbox || !downloadButton || !emailInput) return;

        const emailPattern = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        const validateEmail = () => {
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
        };

        const checkScrolledToBottom = () => {
            const scrollableHeight = eulaScrollBox.scrollHeight - eulaScrollBox.clientHeight;
            const SCROLL_THRESHOLD = 20;
            if (eulaScrollBox.scrollTop + SCROLL_THRESHOLD >= scrollableHeight) {
                acceptTermsCheckbox.disabled = false;
            }
        };

        const updateDownloadButtonState = () => {
            const isEmailValid = validateEmail();
            const isCheckboxChecked = acceptTermsCheckbox.checked;
            downloadButton.disabled = !(isEmailValid && isCheckboxChecked);
        };

        // Event listeners
        emailInput.addEventListener('input', updateDownloadButtonState);
        emailInput.addEventListener('blur', updateDownloadButtonState);
        eulaScrollBox.addEventListener('scroll', checkScrolledToBottom);
        acceptTermsCheckbox.addEventListener('change', updateDownloadButtonState);

        // Check initial scroll state
        checkScrolledToBottom();

        // Form submission with duplicate prevention
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Prevent duplicate submissions
            if (form.dataset.submitting === 'true') {
                return;
            }

            if (!validateEmail()) {
                emailInput.focus();
                return;
            }

            form.dataset.submitting = 'true';
            const buttonText = form.querySelector('#buttonText');
            const spinner = form.querySelector('#spinner');

            if (buttonText && spinner) {
                spinner.classList.remove("hidden");
                buttonText.classList.add("hidden");
            }

            try {
                const response = await fetch("https://7tip4nqocj.execute-api.us-east-1.amazonaws.com/SendDownloadMail", {
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
                form.dataset.submitting = 'false';
                if (buttonText && spinner) {
                    buttonText.classList.remove("hidden");
                    spinner.classList.add("hidden");
                }
                downloadButton.disabled = true;
                form.reset();
                acceptTermsCheckbox.disabled = true;
                acceptTermsCheckbox.checked = false;
            }
        });
    }

    setupContactForm(form) {
        const result = form.querySelector("#result");

        if (!result) return;

        // Setup validation
        this.setupValidation(form);

        // Form submission with duplicate prevention
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            // Prevent duplicate submissions
            if (form.dataset.submitting === 'true') {
                return;
            }

            form.classList.add("was-validated");
            form.setAttribute("data-submitted", "true");

            // Trigger validation
            const inputs = form.querySelectorAll('input[required], textarea[required]');
            inputs.forEach(input => {
                input.dispatchEvent(new Event('input'));
            });

            if (!form.checkValidity()) {
                form.querySelector(":invalid")?.focus();
                return;
            }

            form.dataset.submitting = 'true';
            const buttonText = form.querySelector("#buttonText");
            const spinner = form.querySelector("#spinner");

            if (buttonText && spinner) {
                spinner.classList.remove("hidden");
                buttonText.classList.add("hidden");
            }

            const formData = new FormData(form);
            const object = Object.fromEntries(formData);
            const json = JSON.stringify(object);

            try {
                const response = await fetch("https://7tip4nqocj.execute-api.us-east-1.amazonaws.com/contactus", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: json,
                });

                const responseData = await response.json();

                if (response.status === 200) {
                    result.className = "mt-3 text-center text-green-500";
                    result.innerHTML = responseData.message;
                } else {
                    result.className = "mt-3 text-center text-red-500";
                    result.innerHTML = responseData.message;
                }
                result.style.display = "block";

            } catch (error) {
                result.className = "mt-3 text-center text-red-500";
                result.innerHTML = "Something went wrong!";
                result.style.display = "block";
            } finally {
                form.dataset.submitting = 'false';
                form.reset();
                if (buttonText && spinner) {
                    buttonText.classList.remove("hidden");
                    spinner.classList.add("hidden");
                }
                form.classList.remove("was-validated");
                form.removeAttribute("data-submitted");

                // Hide error messages
                this.resetValidation(form);

                setTimeout(() => {
                    result.style.display = "none";
                }, 8000);
            }
        });
    }

    setupValidation(form) {
        const inputs = form.querySelectorAll('input[required], textarea[required]');

        inputs.forEach(input => {
            const errorMessage = input.parentNode.querySelector('.error-message, .empty-feedback, .invalid-feedback');

            const updateFeedback = () => {
                if (form.classList.contains('was-validated') || form.hasAttribute('data-submitted')) {
                    const isEmpty = input.value.trim() === '';
                    const isInvalid = !input.checkValidity() && !isEmpty;

                    if (errorMessage) errorMessage.classList.add('hidden');

                    if ((isEmpty && input.hasAttribute('required')) || isInvalid) {
                        if (errorMessage) errorMessage.classList.remove('hidden');
                        input.classList.add('border-red-500');
                        input.classList.remove('border-slate-300');
                    } else {
                        input.classList.remove('border-red-500');
                        input.classList.add('border-slate-300');
                    }
                }
            };

            input.addEventListener('input', updateFeedback);
            input.addEventListener('blur', updateFeedback);
        });
    }

    resetValidation(form) {
        const errorMessages = form.querySelectorAll('.error-message, .empty-feedback, .invalid-feedback');
        errorMessages.forEach(error => error.classList.add('hidden'));

        const inputs = form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.classList.remove('border-red-500');
            input.classList.add('border-slate-300');
        });
    }
}

// Initialize the form handler - Use singleton pattern to prevent multiple instances
if (!window.formHandlerInstance) {
    window.formHandlerInstance = new FormHandler();
}