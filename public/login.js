function login() {
    const username = document.querySelector("#username-input").value.trim();
    const password = document.querySelector("#password-input").value;

    if (!username || !password) incorrect()
}

function incorrect() {
    document.querySelector("#incorrect").style.opacity = "0"
    setTimeout(() => document.querySelector("#incorrect").style.opacity = "1", 500);
}

document.querySelector("#login-btn").addEventListener("click", login);
document.querySelectorAll("input").forEach(el => {
    el.addEventListener("keyup", (e) => {
        if (e.key == "Enter") login();
    })
})