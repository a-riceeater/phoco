if (localStorage.getItem("host")) window.location = "login.html"

function login() {
    var host = document.querySelector("#host-input").value.trim();

    if (!host) return incorrect();
    if (host.endsWith("/")) host = host.slice(0, host.length - 1)

    fetch(host + "/api/validate-phoco", {
        method: 'GET',
    })
        .then((res) => {
            console.log(res.status)
            if (res.status == 200) {
                localStorage.setItem("host", host);
                window.location = "login.html"
            } else incorrect();
        })
        .catch((err) => {
            console.error(err);
            incorrect();
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