document.querySelector("#tb-search").addEventListener("click", (e) => {
    document.querySelector("#tb-search-input").focus();
});

document.querySelector("#tb-search-input").addEventListener("focusout", (e) => {
    document.querySelector("#tb-search").style.borderRadius = '35px / 35px'
    document.querySelector("#tb-search").style.borderTopLeftRadius = ''
    document.querySelector("#tb-search").style.borderTopRightRadius = ''
    document.querySelector("#search-drop").style.display = "none"

    if (e.target.innerText == "") {
        document.querySelector("#tb-search-place").style.display = "block";
    }
});

document.querySelector("#tb-search-input").addEventListener("focus", (e) => {
    if (e.target.innerText == "") {
        document.querySelector("#tb-search-place").style.display = "block";
    } else {
        document.querySelector("#tb-search-place").style.display = "none";
    }
})

document.querySelector("#tb-search-input").addEventListener("keydown", (e) => {
    setTimeout(() => {
        if (e.target.innerText == "") {
            document.querySelector("#tb-search-place").style.display = "block";
        } else {
            document.querySelector("#tb-search-place").style.display = "none";
        }
    })
})

document.querySelector("#tb-search-input").addEventListener("focus", () => {
    document.querySelector("#tb-search").style.borderRadius = '0px'
    document.querySelector("#tb-search").style.borderTopLeftRadius = '35px'
    document.querySelector("#tb-search").style.borderTopRightRadius = '35px'
    document.querySelector("#search-drop").style.display = "block"
})

document.querySelector("#tp-user").addEventListener("click", (e) => {
    e.preventDefault();
    if (document.querySelector("#user-pop").style.display == "none") {
        document.querySelector("#user-pop").style.display = "block"
    } else {
        document.querySelector("#user-pop").style.display = "none"
    }
})

const currentDate = new Date();
const pds = `${currentDate.getMonth() + 1}/${currentDate.getDate()}/${currentDate.getFullYear()}`

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

var selecting = false;
const selectingBar = document.getElementById("selecting-bar");
const sbAmount = document.getElementById("sb-amount");

fetch("/api/request-photos", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        start: pds,
        days: 5
    })
})
    .then((d) => d.json())
    .then((d) => {
        console.log(d)
        for (const [key, value] of Object.entries(d)) {
            const date = new Date(key);
            const dateContainer = document.createElement("div");
            dateContainer.innerHTML = `
            <p class="dc-title">${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
            dateContainer.classList.add("dc-date-container")

            document.querySelector("#photos-container").appendChild(dateContainer)
            for (const [k2, v2] of Object.entries(value)) {
                const img = document.createElement("div");
                img.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/></svg>
                `
                img.classList.add("df-photo-thumb")
                dateContainer.appendChild(img)

                const ii = document.createElement("img");
                ii.src = `/buffers/${k2}`
                img.appendChild(ii);

                ii.addEventListener("load", () => {
                    setTimeout(() => {
                        ii.src = `/thumbnails/${k2}`
                    }, 800)
                }, { once: true })

                img.addEventListener("click", (e) => {
                    e.preventDefault();

                    console.log(e.target.nodeName);
                    if (selecting) {
                        img.classList.toggle("selected");
                        ii.classList.toggle("selected");
                        selecting = !!document.querySelectorAll(".df-photo-thumb.selected").length;

                        switch (e.target.nodeName) {
                            case "svg":
                                e.target.classList.toggle("selected");
                                break;
                            case "path":
                                e.target.parentNode.classList.toggle("selected");
                                break;
                            default:
                                img.childNodes.forEach(el => {
                                    if (el.nodeName == "svg") {
                                        el.classList.toggle("selected");
                                    }
                                });
                        }

                        selectingBar.style.display = selecting ? "flex" : "none";

                        const selectedCount = document.querySelectorAll(".df-photo-thumb.selected").length;
                        sbAmount.textContent = `${selectedCount} selected`;

                        return;
                    }

                    switch (e.target.nodeName) {
                        case "svg":
                            e.target.classList.toggle("selected");
                            ii.classList.toggle("selected");
                            img.classList.toggle("selected");
                            selecting = !!document.querySelectorAll(".df-photo-thumb.selected").length;
                            break;
                        case "path":
                            e.target.parentNode.classList.toggle("selected");
                            ii.classList.toggle("selected");
                            img.classList.toggle("selected");
                            selecting = !!document.querySelectorAll(".df-photo-thumb.selected").length;
                            break;
                    }

                    selectingBar.style.display = selecting ? "flex" : "none";

                    const selectedCount = document.querySelectorAll(".df-photo-thumb.selected").length;
                    sbAmount.textContent = `${selectedCount} selected`;

                    if (!selecting) {
                        ii.src.split("/").pop().SHA256()
                            .then((id) => {
                                navigate("/photo/" + id, ii.src.split("/").pop())
                                document.querySelector("#photo-view").style.display = "block"
                                document.querySelector("#pv-img").src = `/thumbnails/${ii.src.split("/").pop()}`
                                document.querySelector("#pv-img").addEventListener("load", () => {
                                    setTimeout(() => document.querySelector("#pv-img").src = `/photos/${ii.src.split("/").pop()}`, 500)
                                }, { once: true })
                            })
                    }
                });
            }
        }
    })

const navigate = (url, title) => {
    window.history.pushState("", "", url)
    document.title = title + " - phoco"
}

String.prototype.SHA256 = function () {
    const utf8 = new TextEncoder().encode(this);
    return crypto.subtle.digest('SHA-256', utf8).then((hashBuffer) => {
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray
            .map((bytes) => bytes.toString(16).padStart(2, '0'))
            .join('');
        return hashHex;
    });
}

document.querySelector("#pcv-info").addEventListener("click", () => {
    if (document.querySelector("#pv-info").style.right == "-300px") {
        document.querySelector("#pv-im").style.width = "calc(100% - 300px)"
        document.querySelector("#pv-info").style.right = "0px"
    } else {
        document.querySelector("#pv-im").style.width = "100%"
        document.querySelector("#pv-info").style.right = "-300px"
    }
})

document.querySelector("#pv-back").addEventListener("click", () => {
    document.querySelector("#photo-view").style.display = "none"
    navigate("/", "Photos")
})