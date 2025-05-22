document.addEventListener(
    "astro:page-load",
    () => {
        const form = document.getElementById("form");
        const result = document.getElementById("result");
        const buttonText = document.getElementById('buttonText');
        const spinner = document.getElementById('spinner');

        form.addEventListener("submit", function (e) {
            e.preventDefault();
            form.classList.add("was-validated");
            if (!form.checkValidity()) {
                form.querySelectorAll(":invalid")[0].focus();
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
                    let json = await response.json();
                    if (response.status == 200) {
                        result.classList.add("text-green-500");
                        result.innerHTML = json.message;
                    } else {
                        result.classList.add("text-red-500");
                        result.innerHTML = json.message;
                    }
                })
                .catch((error) => {
                    result.innerHTML = "Something went wrong!";
                })
                .then(function () {
                    form.reset();
                    buttonText.classList.remove("hidden");
                    spinner.classList.add("hidden");
                    form.classList.remove("was-validated");
                    setTimeout(() => {
                        result.style.display = "none";
                    }, 8000);
                });
        });
    },
    { once: true },
);