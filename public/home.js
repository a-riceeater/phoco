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

const dateYesterday = (date) => {
    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    return date.getMonth() === yesterday.getMonth() &&
        date.getDate() === yesterday.getDate() &&
        date.getFullYear() === yesterday.getFullYear();
}

const formatDate = (date) => {
    let hours = date.getHours();
    let minutes = date.getMinutes();

    let ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;

    let offset = -date.getTimezoneOffset();
    let sign = offset >= 0 ? '+' : '-';
    offset = Math.abs(offset);
    let offsetHours = Math.floor(offset / 60);
    let offsetMinutes = offset % 60;

    offsetMinutes = offsetMinutes < 10 ? '0' + offsetMinutes : offsetMinutes;

    let gmtOffset = `GMT${sign}${offsetHours}:${offsetMinutes}`;
    return `${hours}:${minutes}${ampm} ${gmtOffset}`;
}

var selecting = false;
const selectingBar = document.getElementById("selecting-bar");
const sbAmount = document.getElementById("sb-amount");

async function fetchAndConvertHeic(url, image) {
    try {
        const response = await fetch(url);
        const heicBlob = await response.blob();

        const convertedBlob = await heic2any({
            blob: heicBlob,
            toType: 'image/jpeg',
            quality: 0.8
        });

        const reader = new FileReader();
        reader.onloadend = function () {
            const base64data = reader.result;
            image.src = base64data;
        };

        reader.readAsDataURL(convertedBlob);
    } catch (error) {
        console.error('Conversion failed:', error);
    }
}

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
                dateContainer.appendChild(img);

                const ii = document.createElement("img");
                ii.setAttribute("loading", "lazy");

                if (k2.endsWith(".heic") || k2.endsWith(".heif")) {
                    ii.src = `/buffers/${k2.replace(/\.[^/.]+$/, ".jpeg")}`, ii
                } else ii.src = `/buffers/${k2.replace(/\.[^/.]+$/, ".jpeg")}`
                img.appendChild(ii);

                ii.addEventListener("load", () => {
                    setTimeout(() => {
                        if (k2.endsWith(".heic") || k2.endsWith(".heif")) {
                            ii.src = `/thumbnails/${k2.replace(/\.[^/.]+$/, ".jpeg")}`, ii
                        } else ii.src = `/thumbnails/${k2.replace(/\.[^/.]+$/, ".jpeg")}`
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

                                if (k2.endsWith(".heic") || k2.endsWith(".heif")) {
                                    console.log("ends with")
                                    document.querySelector("#pv-img").src = `/thumbnails/${k2.replace(/\.[^/.]+$/, ".jpeg")}`
                                } else document.querySelector("#pv-img").src = `/thumbnails/${k2.replace(/\.[^/.]+$/, ".jpeg")}`

                                document.querySelector("#pv-img").style.transform = `translate(-50%, -50%) scale(${1})`;

                                document.querySelector("#pv-img").addEventListener("load", () => {
                                    setTimeout(() => {
                                        if (k2.endsWith(".heic") || k2.endsWith(".heif")) {
                                            document.querySelector("#pv-img").src = `/photos/${k2.replace(/\.[^/.]+$/, ".png")}`
                                        } else document.querySelector("#pv-img").src = `/photos/${k2}`

                                        let scale = 1;
                                        const zoomSpeed = 0.1;

                                        function zoom(event) {
                                            event.preventDefault();
                                        
                                            const { clientX, clientY } = event;
                                            const { left, top, width, height } = document.querySelector("#pv-img").getBoundingClientRect();
                                            const offsetX = clientX - left;
                                            const offsetY = clientY - top;
                                            const dx = offsetX / width;
                                            const dy = offsetY / height;
                                        
                                            const wheel = event.deltaY < 0 ? 1 : -1;
                                            const zoomFactor = (1 + wheel * zoomSpeed);
                                            scale *= zoomFactor;
                                        
                                            scale = Math.min(Math.max(scale, 1), 7.5);
                                        
                                            const originX = (dx * 100).toFixed(2) + '%';
                                            const originY = (dy * 100).toFixed(2) + '%';
                                        
                                            document.querySelector("#pv-img").style.transformOrigin = `${originX} ${originY}`;
                                            document.querySelector("#pv-img").style.transform = `translate(-50%, -50%) scale(${scale})`;

                                            if (scale > 1) {
                                                document.querySelector("#pv-img").style.cursor = 'grab';
                                            } else {
                                                document.querySelector("#pv-img").style.cursor = 'default';
                                            }
                                        }
                                        
                                        function startPan(event) {
                                            if (scale <= 1) return;

                                            event.preventDefault();
                                            document.querySelector("#pv-img").style.cursor = 'grabbing';
                                        
                                            let startX = event.clientX;
                                            let startY = event.clientY;
                                        
                                            function pan(event) {
                                                const dx = event.clientX - startX;
                                                const dy = event.clientY - startY;
                                        
                                                const currentTransform = document.querySelector("#pv-img").style.transform;
                                                const translateMatch = currentTransform.match(/translate\((-?\d+\.?\d*)px, (-?\d+\.?\d*)px\)/);
                                        
                                                let currentTranslateX = 0;
                                                let currentTranslateY = 0;
                                                if (translateMatch) {
                                                    currentTranslateX = parseFloat(translateMatch[1]);
                                                    currentTranslateY = parseFloat(translateMatch[2]);
                                                }
                                        
                                                const newTranslateX = currentTranslateX + dx;
                                                const newTranslateY = currentTranslateY + dy;
                                        
                                                document.querySelector("#pv-img").style.transform = `translate(${newTranslateX}px, ${newTranslateY}px) scale(${scale})`;
                                        
                                                startX = event.clientX;
                                                startY = event.clientY;
                                            }
                                        
                                            function stopPan() {
                                                document.removeEventListener('mousemove', pan);
                                                document.removeEventListener('mouseup', stopPan);
                                                document.querySelector("#pv-img").style.cursor = 'grab';
                                            }
                                        
                                            document.addEventListener('mousemove', pan);
                                            document.addEventListener('mouseup', stopPan);
                                        }

                                        document.querySelector("#pv-img").addEventListener('wheel', zoom);
                                        document.querySelector("#pv-img").addEventListener('mousedown', startPan);
                                    }, 500)
                                }, { once: true })

                                document.querySelector("#pvid-fname").innerText = k2;

                                fetch(`/api/request-metadata/${date.getMonth() + 1}-${date.getDate()}-${date.getFullYear()}/${k2}`, {
                                    headers: {
                                        "Content-Type": "application/json"
                                    },
                                    method: "GET"
                                })
                                    .then((d) => d.json())
                                    .then((metadata) => {
                                        const photoDate = new Date(metadata.date || metadata.uploaded);
                                        console.log(metadata);
                                        document.querySelector("#pvid-camera").innerText = `${metadata.make || ""} ${metadata.model || "Unkown Camera"}`
                                        document.querySelector("#pvid-shutter").innerText = metadata.shutter || ""
                                        document.querySelector("#pvid-mm").innerText = metadata.lensInfo ? metadata.lensInfo[1] + "mm" : ""
                                        document.querySelector("#pvid-iso").innerText = metadata.iso ? `ISO ${metadata.iso}` : ""
                                        document.querySelector("#pvid-aperture").innerText = metadata.fstop || "0"

                                        document.querySelector("#megapixels").innerText = metadata.megapixels ? `${metadata.megapixels}MP` : "";
                                        document.querySelector("#resolution").innerText = metadata.resolution || ""
                                        const { latitude, longitude } = metadata.gps;
                                        document.querySelector("#pvid-location").innerText = `${latitude ? latitude.toFixed(4) : ""}${latitude && longitude ? "," : ""} ${longitude ? longitude.toFixed(4) : ""}`;

                                        document.querySelector("#pvid-day").innerText = `${months[photoDate.getMonth()]} ${photoDate.getDate()}, ${photoDate.getFullYear()}`;
                                        document.querySelector("#pvid-date-de").innerHTML = `${dateYesterday(photoDate) ? "Yesterday" : days[photoDate.getDay()]}, <span class="cd">${formatDate(photoDate).split(" ")[0]}</span> <span class="cd">${formatDate(photoDate).split(" ")[1]}</span>`
                                        document.querySelector("#pvid-size").innerText = formatBytes(metadata.size);
                                    })
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
    if (document.querySelector("#pv-info").style.right == "-350px") {
        document.querySelector("#pv-im").style.width = "calc(100% - 350px)"
        document.querySelector("#pv-info").style.right = "0px"
    } else {
        document.querySelector("#pv-im").style.width = "100%"
        document.querySelector("#pv-info").style.right = "-350px"
    }
})

document.querySelector("#pv-back").addEventListener("click", () => {
    document.querySelector("#photo-view").style.display = "none"
    navigate("/", "Photos")
})  