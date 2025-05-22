document.addEventListener("astro:page-load", () => {
    // Handle multiple forms - try different IDs
    const form = document.getElementById("form") || document.getElementById("contactForm");

    if (!form) return;

    const result = form.querySelector("#result");
    const buttonText = form.querySelector("#buttonText");
    const spinner = form.querySelector("#spinner");

    if (!result || !buttonText || !spinner) return;

    // Custom validation logic for form feedback
    function setupFormValidation() {
        const inputs = form.querySelectorAll('input[required], textarea[required]');

        inputs.forEach(input => {
            // Look for different error message class names
            const errorMessage = input.parentNode.querySelector('.empty-feedback, .invalid-feedback, .error-message');

            // Show/hide feedback based on validation state
            function updateFeedback() {
                if (form.classList.contains('was-validated') || form.hasAttribute('data-submitted')) {
                    const isEmpty = input.value.trim() === '';
                    const isInvalid = !input.checkValidity() && !isEmpty;

                    // Hide error message first
                    if (errorMessage) errorMessage.classList.add('hidden');

                    // Show appropriate feedback
                    if (isEmpty && input.hasAttribute('required')) {
                        if (errorMessage) errorMessage.classList.remove('hidden');
                        input.classList.add('border-red-500');
                        input.classList.remove('border-slate-300');
                    } else if (isInvalid) {
                        if (errorMessage) errorMessage.classList.remove('hidden');
                        input.classList.add('border-red-500');
                        input.classList.remove('border-slate-300');
                    } else {
                        input.classList.remove('border-red-500');
                        input.classList.add('border-slate-300');
                    }
                }
            }

            // Listen for input changes
            input.addEventListener('input', updateFeedback);
            input.addEventListener('blur', updateFeedback);
        });
    }

    // Initialize validation
    setupFormValidation();

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        form.classList.add("was-validated");
        form.setAttribute("data-submitted", "true");

        // Trigger validation feedback
        const inputs = form.querySelectorAll('input[required], textarea[required]');
        inputs.forEach(input => {
            input.dispatchEvent(new Event('input'));
        });

        if (!form.checkValidity()) {
            form.querySelector(":invalid").focus();
            return;
        }

        spinner.classList.remove("hidden");
        buttonText.classList.add("hidden");

        const formData = new FormData(form);
        const object = Object.fromEntries(formData);
        const json = JSON.stringify(object);

        fetch("https://7tip4nqocj.execute-api.us-east-1.amazonaws.com/contactus", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: json,
        })
            .then(async (response) => {
                const json = await response.json();
                if (response.status === 200) {
                    result.classList.add("text-green-500");
                    result.classList.remove("text-red-500");
                    result.innerHTML = json.message;
                } else {
                    result.classList.add("text-red-500");
                    result.classList.remove("text-green-500");
                    result.innerHTML = json.message;
                }
                result.style.display = "block";
            })
            .catch(() => {
                result.classList.add("text-red-500");
                result.classList.remove("text-green-500");
                result.innerHTML = "Something went wrong!";
                result.style.display = "block";
            })
            .finally(() => {
                form.reset();
                buttonText.classList.remove("hidden");
                spinner.classList.add("hidden");
                form.classList.remove("was-validated");
                form.removeAttribute("data-submitted");

                // Hide all error messages
                const errorMessages = form.querySelectorAll('.empty-feedback, .invalid-feedback, .error-message');
                errorMessages.forEach(error => error.classList.add('hidden'));

                // Reset input border colors
                const inputs = form.querySelectorAll('input, textarea');
                inputs.forEach(input => {
                    input.classList.remove('border-red-500');
                    input.classList.add('border-slate-300');
                });

                setTimeout(() => {
                    result.style.display = "none";
                }, 8000);
            });
    });
}, { once: true });