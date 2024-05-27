const CHUNK_SIZE = 1 * 1024 * 1024; // 1MB chunks

function uploadFile(file) {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    let currentChunk = 0;

    function uploadNextChunk() {
        const start = currentChunk * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append('file', chunk);
        formData.append('chunkNumber', currentChunk);
        formData.append('totalChunks', totalChunks);
        formData.append('fileName', file.name);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/upload', true);

        xhr.onload = function() {
            if (xhr.status === 200) {
                currentChunk++;
                if (currentChunk < totalChunks) {
                    uploadNextChunk();
                } else {
                    alert('File upload complete!');
                }
            } else {
                alert('Error uploading chunk ' + currentChunk);
            }
        };

        xhr.onerror = function() {
            alert('Error uploading chunk ' + currentChunk);
        };

        xhr.send(formData);
    }

    uploadNextChunk();
}



document.querySelector('#tp-up').addEventListener('click', async () => {
    try {
        const [fileHandle] = await window.showOpenFilePicker({
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
        const file = await fileHandle.getFile();
        console.log(file);
        uploadFile(file)
    } catch (err) {
        console.error(err);
    }
})