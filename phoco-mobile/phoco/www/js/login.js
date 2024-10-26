const host = localStorage.getItem("host")
if (localStorage.getItem("token")) window.location = 'index.html'

function login() {
    const username = document.querySelector("#username-input").value.trim();
    const password = document.querySelector("#password-input").value;

    if (!username || !password) return incorrect();

    fetch(host + "/api/auth/login", {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: username,
            password: password
        }),
        mode: "cors"
    })
        .then((data) => data.json())
        .then((data) => {
            console.log(data)
            if (data.login) { 
                localStorage.setItem("token", data.token)
                window.location = "index.html" 
            }
            else incorrect();
        })
        .catch((err) => {
            console.error(err);
            alert("An error occured.")
        })
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