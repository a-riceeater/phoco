
/*document.querySelector("#tb-search").addEventListener("click", (e) => {
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
*/
document.querySelector("#tp-user").addEventListener("click", (e) => {
    e.preventDefault();
    document.querySelector("#user-pop").classList.toggle("hidden")
})

const currentDate = new Date();
const pds = `${currentDate.getMonth() + 1}/${currentDate.getDate()}/${currentDate.getFullYear()}`

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const videoFileTypes = ["mp4", "m4v", "mkv", "mov", "wmv", "avi", "flv", "webm", "mpg", "mpeg", "3gp", "ogv", "mxf", "mts", "m2ts", "vob", "asf", "rm", "rmvb", "f4v", "f4p", "f4a", "f4b", "divx"];

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

fetch(host + "/api/request-photos", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + localStorage.getItem("token")
    },
    body: JSON.stringify({
        start: pds,
        days: 5
    }),
    mode: "cors"
})
    .then((d) => d.json())
    .then((d) => {
        console.log(d)
        if (d.status == 302) {
            localStorage.removeItem("token")
            window.location = "login.html"
        }
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
                //ii.style.height = "165px" // make lazy loading work ?

                if (k2.endsWith(".heic") || k2.endsWith(".heif") || videoFileTypes.includes(k2.split(".").pop())) {
                    ii.src = `${host}/buffers/${k2.replace(/\.[^/.]+$/, ".jpeg")}`
                } else ii.src = `${host}/buffers/${k2.replace(/\.[^/.]+$/, ".jpeg")}`
                img.appendChild(ii);

                ii.addEventListener("load", () => {
                    setTimeout(() => {
                        if (k2.endsWith(".heic") || k2.endsWith(".heif") || videoFileTypes.includes(k2.split(".").pop())) {
                            ii.src = `${host}/thumbnails/${k2.replace(/\.[^/.]+$/, ".jpeg")}`
                        } else ii.src = `${host}/thumbnails/${k2.replace(/\.[^/.]+$/, ".jpeg")}`
                    }, 800)
                }, { once: true })

                img.addEventListener("long-press", (e) => {
                    e.preventDefault()
                    if (selecting) return
                    selecting = true;
                    selectingBar.style.display = "flex"
                    sbAmount.style.display = "grid"
                    sbAmount.textContent = `1 selected`;
                    img.classList.toggle("selected");
                    ii.classList.toggle("selected");

                    document.querySelectorAll(".df-photo-thumb > svg").forEach(el => el.style.opacity = 1)
                    document.querySelectorAll(".df-photo-thumb:before").forEach(el => el.style.opacity = 1)

                    img.childNodes.forEach(el => {
                        if (el.nodeName == "svg") {
                            el.classList.add("selected")
                        }
                    })
                });

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

                        if (!selecting) {
                            document.querySelectorAll(".df-photo-thumb > svg").forEach(el => el.style.opacity = 0)
                            document.querySelectorAll(".df-photo-thumb:before").forEach(el => el.style.opacity = 0)
                            sbAmount.style.display = "none"
                        }
                    } else {
                        ii.src.split("/").pop().SHA256()
                            .then((id) => {
                                navigate("/photo/" + id, ii.src.split("/").pop())
                                document.querySelector("#photo-view").classList.remove("hidden")

                                if (!videoFileTypes.includes(k2.split(".").pop())) {
                                    document.querySelector("#pv-video").style.display = "none"
                                    document.querySelector("#pv-img").style.display = "block"
                                }

                                if (k2.endsWith(".heic") || k2.endsWith(".heif") || videoFileTypes.includes(k2.split(".").pop())) {
                                    console.log("ends with")
                                    document.querySelector("#pv-img").src = `${host}/thumbnails/${k2.replace(/\.[^/.]+$/, ".jpeg")}`
                                } else document.querySelector("#pv-img").src = `${host}/thumbnails/${k2.replace(/\.[^/.]+$/, ".jpeg")}`

                                document.querySelector("#pv-img").style.transform = `translate(-50%, -50%) scale(${1})`;

                                document.querySelector("#pv-img").addEventListener("load", () => {
                                    setTimeout(() => {
                                        if (k2.endsWith(".heic") || k2.endsWith(".heif")) {
                                            document.querySelector("#pv-img").src = `${host}/photos/${k2.replace(/\.[^/.]+$/, ".png")}`
                                        } else document.querySelector("#pv-img").src = `${host}/photos/${k2}`

                                        if (videoFileTypes.includes(k2.split(".").pop())) {
                                            document.querySelector("#pv-img").style.display = "none"
                                            document.querySelector("#pv-video").style.display = "block"
                                            document.querySelector("#pv-video").src = `${host}/photos/${k2}`
                                            return
                                        }

                                        let lastTap = 0;
                                        let scale = 1;

                                        document.querySelector("#pv-img").addEventListener('touchend', (event) => {
                                            const currentTime = new Date().getTime();
                                            const tapLength = currentTime - lastTap;

                                            if (tapLength < 300 && tapLength > 0) toggleZoom(event)

                                            lastTap = currentTime;
                                        }, false);

                                        function toggleZoom(event) {
                                            scale === 1 ? scale = 3 : scale = 1

                                            const rect = document.querySelector("#pv-img").getBoundingClientRect();
                                            const offsetX = event.changedTouches[0].pageX - rect.left;
                                            const offsetY = event.changedTouches[0].pageY - rect.top;

                                            const transformOriginX = (offsetX / rect.width) * 100;
                                            const transformOriginY = (offsetY / rect.height) * 100;

                                            document.querySelector("#pv-img").style.transformOrigin = `${transformOriginX}% ${transformOriginY}%`;
                                            document.querySelector("#pv-img").style.transform = `translate(-50%, -50%) scale(${scale})`;
                                        }
                                    }, 500)
                                }, { once: true })

                                document.querySelector("#pvid-fname").innerText = k2;

                                fetch(`${host}/api/request-metadata/${date.getMonth() + 1}-${date.getDate()}-${date.getFullYear()}/${k2}`, {
                                    headers: {
                                        "Content-Type": "application/json",
                                        Authorization: "Bearer " + localStorage.getItem("token")
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
    .catch((err) => {
        localStorage.removeItem("token")
        window.location = 'login.html'
        console.error(err);
        alert("Failed to fetch photos...")
        document.querySelector("#photos-container").innerHTML = `
        <h1>Failed to load photos...</h1>
        <p>${err}</p>
        `
    })

const navigate = (url, title) => {
    //window.history.pushState("", "", url)
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

/*
document.querySelector("#pcv-info").addEventListener("click", () => {
    if (document.querySelector("#pv-info").style.right == "-350px") {
        document.querySelector("#pv-im").style.width = "calc(100% - 350px)"
        document.querySelector("#pv-info").style.right = "0px"
    } else {
        document.querySelector("#pv-im").style.width = "100%"
        document.querySelector("#pv-info").style.right = "-350px"
    }
})
*/
document.querySelector("#pv-back").addEventListener("click", () => {
    document.querySelector("#photo-view").style.left = "-100%"
    setTimeout(() => {
        document.querySelector("#photo-view").style.left = "0"
        document.querySelector("#photo-view").classList.add("hidden")
    }, 500)
    navigate("/", "Photos")
})

fetch(`${host}/api/request-uinfo`, {
    method: "GET",
    headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token")
    }
})
    .then((d) => d.json())
    .then((d) => {
        console.log(d)
    })

document.addEventListener('swiped-up', (e) => {
    console.log(e.target);

    if (!document.querySelector("#photo-view").classList.contains("hidden")) {
        console.log("photo view swipe up")
        document.querySelector("#pv-im").style.top = "-600px"
        document.querySelector("#pv-info").style.bottom = "0px"
    }
});

document.addEventListener('swiped-down', (e) => {
    console.log(e.target);

    if (document.querySelector("#pv-info").style.bottom == "0px") {
        document.querySelector("#pv-info").style.bottom = "-600px"
        document.querySelector("#pv-im").style.top = "0px"
    } else if (!document.querySelector("#photo-view").classList.contains("hidden")) {
        if (document.querySelector("#pv-img").style.transform == `translate(-50%, -50%) scale(3)`) return
        document.querySelector("#photo-view").style.top = "100%"
        setTimeout(() => {
            document.querySelector("#photo-view").style.top = "0"
            document.querySelector("#photo-view").classList.add("hidden")
        }, 500)
    }
});

document.addEventListener('gesturestart', (event) => {
    //if (!document.querySelector("#pv-img").classList.contains("hidden")) return
    event.preventDefault();
}, false);

document.querySelector("#pvc-dot").addEventListener("click", () => {
    if (!document.querySelector("#photo-view").classList.contains("hidden")) {
        document.querySelector("#pv-im").style.top = "-600px"
        document.querySelector("#pv-info").style.bottom = "0px"
    }
})

document.querySelector("#pcv-afav").addEventListener("click", (e) => {
    e.target.classList.add("hidden")
    document.querySelector("#pcv-rfav").classList.remove("hidden")
})

document.querySelector("#pcv-rfav").addEventListener("click", (e) => {
    e.target.classList.add("hidden")
    document.querySelector("#pcv-afav").classList.remove("hidden")
})

document.querySelector("#up-lg").addEventListener("click", (e) => {
    localStorage.removeItem("token")
    window.location = 'login.html'
})

document.querySelector("#pv-img").addEventListener("click", (e) => {
    setTimeout(() => {

        document.querySelector("#pv-quick").classList.toggle("op-hidden")
        document.querySelector("#pv-controls").classList.toggle("op-hidden")
        document.querySelector("#pv-back").classList.toggle("op-hidden")

        document.querySelector("#pv-im").style.setProperty("--baop", document.querySelector("#pv-back").classList.contains("op-hidden") ? 0 : 1)
    }, 500)
})

document.querySelector("#pv-video").addEventListener("click", (e) => {
    setTimeout(() => {

        document.querySelector("#pv-quick").classList.toggle("op-hidden")
        document.querySelector("#pv-controls").classList.toggle("op-hidden")
        document.querySelector("#pv-back").classList.toggle("op-hidden")

        document.querySelector("#pv-im").style.setProperty("--baop", document.querySelector("#pv-back").classList.contains("op-hidden") ? 0 : 1)
    }, 500)
})

/*

import * as cordovaGallery from 'cordova-gallery-access';

alert("loading photos")

document.addEventListener("deviceready", () => {
    alert("Device ready")

    cordovaGallery.load().then(items => {
        alert(items.length)
    }).catch(e => console.error(e));
    
    Photos.photos( 
        function(photos) {
            console.log(photos);
            alert("loaded photos")
            alert(JSON.stringify(photos))
        },
        function(error) {
            alert(error)
            console.error("Error: " + error);
        });    
}, false);
*/


document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
    alert("Device ready")

    cordova.plugins.diagnostic.requestCameraRollAuthorization(function (granted) {
        if (granted) {
            //getRecentPhotos(5)
        /*
                    
            function getRecentPhotos(count) {
                cordova.plugins.photoLibrary.getLibrary(
                    function(library) {
                        // Sort photos by creation date (descending)
                        library = library.library.sort((a, b) => b.creationDate - a.creationDate);
        
                        // Get the most recent photos
                        let recentPhotos = library.slice(0, count);
        
                        // Process each photo
                        recentPhotos.forEach(function(photo) {
                            window.resolveLocalFileSystemURL(photo.photoURL, function(fileEntry) {
                                fileEntry.file(function(file) {
                                    // Call your uploadFile function with the file object
                                    uploadFile(file);
                                });
                            }, onError);
                        });
                    },
                    function(err) {
                        console.error('Error getting library: ', err);
                    },
                    {
                        includeAlbumData: false // We don't need album data
                    }
                );
            }*/
            Photos.photos(
                function (ps) {
                    //document.body.innerHTML = JSON.stringify(ps[0])
                    const photo = ps[0];
                    alert(JSON.stringify(ps[0]))
                    Photos.image(photo.id,
                        async function (data) {
                            var blob = new Blob([data], { "type": photo.contentType });
                            alert(blob.size)

                            document.querySelector(".us-up").innerText = "0";
                            document.querySelector(".us-fail").innerText = "0";
                            document.querySelector(".us-close").style.display = "none";

                            document.querySelector("#upload-status").style.display = "block";

                            var file = new File([blob], photo.name, { type: photo.contentType, lastModified: Date.now() });
                            alert("hjs " + typeof file)
                            alert("hjs" + JSON.stringify(file))
                            uploadFile(file);                            

                            document.querySelector(".us-t").innerText = "All Uploads Completed";
                            document.querySelector(".us-close").style.display = "flex";
                        },
                        function (error) {
                            alert(error)
                            console.error("Error: " + error);
                        });
                },
                function (error) {
                    alert(error)
                    console.error("Error: " + error);
                });
        }
    }, function (error) {
        console.error(error)
        alert(error);
    });/*
    
    // Check for photo library permission
    cordova.plugins.diagnostic.requestRuntimePermission(function(status){
        if(status === cordova.plugins.diagnostic.permissionStatus.GRANTED){
            console.log("Permission granted to access the photo library.");
            // Open photo library
            openPhotoLibrary();
        } else {
            alert("permission required")
            console.error("Permission denied to access the photo library.");
            
        }
    }, function(error){
        console.error("The following error occurred: " + error);
    }, cordova.plugins.diagnostic.permission.READ_EXTERNAL_STORAGE);*/
}

