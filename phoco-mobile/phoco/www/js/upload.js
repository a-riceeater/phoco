const CHUNK_SIZE = 1 * 1024 * 1024; // 1MB chunks
const host = localStorage.getItem("host")

/*window.onerror = (a, b, c, d, e) => {
    alert(`message: ${a}`);
    alert(`source: ${b}`);
    alert(`lineno: ${c}`);
    alert(`error: ${e}`);
  
    return true;
  };*/
function formatBytes(bytes) {
    if (isNaN(bytes) || bytes < 0) return '0 Bytes';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function uploadFile(file) {
    return new Promise((resolve, reject) => {
        try {
            alert(file.name)
            const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
            let currentChunk = 0;

            const previewElement = document.querySelector("#up-preview");
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    previewElement.src = e.target.result;
                };
                reader.readAsDataURL(file);
            } else if (file.type.startsWith('video/')) {
                previewElement.src = "/video-preview-ico.jpg";
            }

            document.querySelector("#us-namesize").innerText = `${file.name.length > 9 ? file.name.slice(0, 9) + "..." + file.name.split(".").pop() : file.name} ${file.name.length > 9 ? "" : " - " + formatBytes(file.size)}`;
            document.querySelector("#ui-chunks").innerText = `0/${totalChunks} chunks`;

            function uploadNextChunk() {
                const start = currentChunk * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, file.size);
                const chunk = file.slice(start, end);

                document.querySelector("#ui-sr").innerText = `${formatBytes(file.size - (CHUNK_SIZE * (currentChunk + 1)))} remaining`;

                const formData = new FormData();
                formData.append('file', chunk);
                formData.append('chunkNumber', currentChunk);
                formData.append('totalChunks', totalChunks);
                formData.append('fileName', file.name);

                let failAmount = 0;

                function post() {
                    document.querySelector("#ui-chunks").innerText = `${currentChunk + 1}/${totalChunks} chunks`;
                    const xhr = new XMLHttpRequest();
                    xhr.open('POST', `${host}/upload`, true);

                    xhr.onload = function () {
                        if (xhr.status === 200) {
                            currentChunk++;
                            document.querySelector("#ui-percent").innerText = `${((currentChunk / totalChunks) * 100).toFixed()}%`;
                            if (currentChunk < totalChunks) {
                                setTimeout(uploadNextChunk, 100);
                            } else {
                                var completed = parseInt(document.querySelector(".us-up").innerText) || 0;
                                completed++;
                                document.querySelector(".us-up").innerText = completed;
                                console.log(file.name + " completed");
                                resolve();
                            }
                        } else {
                            if (failAmount > 10) {
                                var failed = parseInt(document.querySelector(".us-fail").innerText) || 0;
                                failed++;
                                document.querySelector(".us-fail").innerText = failed;
                                console.log(file.name + " failed");
                                reject(new Error("Upload failed"));
                            } else {
                                failAmount++;
                                post();
                                console.log("chunk failed");
                            }
                        }
                    };

                    xhr.onerror = function () {
                        if (failAmount > 10) {
                            var failed = parseInt(document.querySelector(".us-fail").innerText) || 0;
                            failed++;
                            document.querySelector(".us-up").innerText = failed;
                            console.log(file.name + " failed");
                            reject(new Error("Upload failed"));
                        } else {
                            failAmount++;
                            post();
                            console.log("chunk failed");
                        }
                    };

                    xhr.send(formData);
                }

                post();
            }

            uploadNextChunk();
        } catch (err) { 
            alert(err)
            console.error(err)
         }
    });
}

/*
document.querySelector('#tp-up').addEventListener('click', async () => {
    document.querySelector(".us-up").innerText = "0";
    document.querySelector(".us-fail").innerText = "0";
    document.querySelector(".us-close").style.display = "none";

    // Check if showOpenFilePicker is supported
    if (window.showOpenFilePicker) {
        try {
            const fileHandles = await window.showOpenFilePicker({
                multiple: true, startIn: "pictures", types: [
                    {
                        description: "Images",
                        accept: {
                            'image/*': [".png", ".gif", ".jpeg", ".jpg", ".cr2"]
                        }
                    },
                    {
                        description: "Videos",
                        accept: {
                            "video/*": [".avi", ".mp4", ".mov", ".mkv", ".webm"]
                        }
                    }
                ]
            });
            const files = await Promise.all(fileHandles.map(async (fileHandle) => {
                const file = await fileHandle.getFile();
                return file;
            }));

            document.querySelector("#upload-status").style.display = "block";

            document.querySelector("#bp-fi").style.width = "2%"

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                await uploadFile(file);
                var pd = (((i + 1) / files.length) * 100).toFixed();
        
                document.querySelector("#bp-fi").style.width = pd + "%"
            }

            document.querySelector(".us-t").innerText = "All Uploads Completed";
            document.querySelector(".us-close").style.display = "flex";
        } catch (err) {
            console.error(err);
        }
    } else {
        // Fallback to file input for browsers that do not support showOpenFilePicker
        document.querySelector('#file-input').click();
    }
});

*/

document.querySelector(".us-close").addEventListener("click", (e) => {
    e.target.style.display = "none"
    document.querySelector("#upload-status").style.display = "none"
})
/*

document.querySelector('#file-input').addEventListener('change', async (event) => {
    const files = Array.from(event.target.files);
    document.querySelector("#bp-fi").style.width = "2%"

    document.querySelector("#upload-status").style.display = "block";

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        await uploadFile(file);
        var pd = ((i + 1 / files.length) * 100).toFixed();

        document.querySelector("#bp-fi").style.width = pd + "%"
    }

    document.querySelector(".us-t").innerText = "All Uploads Completed";
    document.querySelector(".us-close").style.display = "flex";
});*/