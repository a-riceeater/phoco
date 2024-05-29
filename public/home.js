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