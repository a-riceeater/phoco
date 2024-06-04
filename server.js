const express = require("express");
const path = require("path");
const fs = require("fs-extra");
const bodyParser = require("body-parser");
const multiparty = require('multiparty');
const multer = require('multer');
const exifr = require('exifr');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const { generateThumbnail } = require("./thumbnail");
const { promisify } = require('util');
const convert = require('heic-convert');
const Crypto = require("crypto-js")

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();

app.use(express.static(path.join(__dirname, "public")));
app.use("/photos", express.static(path.join(__dirname, "uploads")));
app.use("/thumbnails", express.static(path.join(__dirname, "thumbnails")));
app.use("/buffers", express.static(path.join(__dirname, "buffers")));

/*
app.use(bodyParser.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(bodyParser.urlencoded({ limit: '2mb', extended: true }));
app.use(bodyParser.text({ type: 'multipart/form-data', limit: '2mb' }));
app.use(bodyParser.text({ type: 'text/plain', limit: '2mb' }));*/
app.use(require("serve-favicon")(path.join(__dirname, "public", "logo.png")));

var uploadDestination = "uploads/" // integrate changing later via settings

const upload = multer({ dest: uploadDestination });
var photoMetadata;

if (fs.existsSync((path.join(uploadDestination + "metadata.json")))) photoMetadata = JSON.parse(fs.readFileSync(path.join(uploadDestination + "metadata.json"), "utf8"));
else {
    fs.writeFileSync(path.join(uploadDestination + "metadata.json"), "{}", "utf8");
    photoMetadata = {}
}

const writeMetadata = () => {
    fs.writeFileSync(path.join(uploadDestination + "metadata.json"), JSON.stringify(photoMetadata), "utf8");
}

Date.prototype.subtractDays = function (days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() - days);
    return date;
}

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "html", "home.html"));
})

const calculateMegapixels = (width, height) => {
    return ((width * height) / 1000000).toFixed(1);
};

app.post('/upload', upload.single('file'), async (req, res) => {
    const { chunkNumber, totalChunks, fileName } = req.body;
    const chunkPath = req.file.path;
    const uploadDir = path.join(__dirname, 'uploads', fileName + '_chunks');

    try {
        await fs.ensureDir(uploadDir);
        const destPath = path.join(uploadDir, `${fileName}.part.${chunkNumber}`);

        await fs.move(chunkPath, destPath);

        if (parseInt(chunkNumber, 10) + 1 === parseInt(totalChunks, 10)) {
            var finalFilePath = path.join(__dirname, 'uploads', fileName);
            // if (finalFilePath.endsWith(".heif") || finalFilePath.endsWith(".heic")) finalFilePath = finalFilePath.replace(/\.[^/.]+$/, ".jpeg")

            const fileStream = fs.createWriteStream(finalFilePath);

            for (let i = 0; i < totalChunks; i++) {
                const chunkFile = path.join(uploadDir, `${fileName}.part.${i}`);
                const data = await fs.readFile(chunkFile);
                fileStream.write(data);
                await fs.remove(chunkFile);
            }
            fileStream.end();

            await fs.remove(uploadDir);
            res.sendStatus(200);

            if (finalFilePath.endsWith(".heif") || finalFilePath.endsWith(".heic")) {
                (async () => {
                    const inputBuffer = await promisify(fs.readFile)(finalFilePath);
                    const outputBuffer = await convert({
                        buffer: inputBuffer,
                        format: 'PNG',
                    });

                    await promisify(fs.writeFile)(finalFilePath.replace(/\.[^/.]+$/, ".png"), outputBuffer);
                    fs.removeSync(finalFilePath);
                    finalFilePath = finalFilePath.replace(/\.[^/.]+$/, ".png")
                    writeData()
                })();
            } else writeData()

            function writeData() {
                generateThumbnail(finalFilePath, path.join(__dirname, "buffers", fileName), 144, 31); // buffer

                exifr.parse(finalFilePath)
                    .then((ex) => {
                        const photoDate = new Date((ex && ex.DateTimeOriginal) || new Date());
                        const pds = `${photoDate.getMonth() + 1}/${photoDate.getDate()}/${photoDate.getFullYear()}`
                        if (!photoMetadata[pds]) photoMetadata[pds] = {};

                        console.log(ex)
                        if (!ex) ex = {}

                        generateThumbnail(finalFilePath, path.join(__dirname, "thumbnails", fileName), (ex.ExifImageHeight || ex.ImageHeight) || 1080, 25); // thumbnail

                        photoMetadata[pds][fileName] = {
                            date: photoDate,
                            uploaded: new Date(),
                            dateOff: ex.OffsetTimeOriginal,
                            fstop: ex.FNumber,
                            iso: ex.ISO,
                            shutter: ex.ExposureTime ? `1/${Math.round(1 / ex.ExposureTime)}` : undefined,
                            megapixels: calculateMegapixels(ex.ExifImageWidth || ex.ImageWidth, ex.ExifImageHeight || ex.ImageHeight) || undefined,
                            resolution: `${ex.ExifImageWidth || ex.ImageWidth} x ${ex.ExifImageHeight || ex.ImageHeight}`,
                            make: ex.Make,
                            model: ex.Model,
                            lensInfo: ex.LensInfo,
                            size: fs.statSync(finalFilePath).size,
                            gps: {
                                latitudeRef: ex.GPSLatitudeRef,
                                latitude: ex.latitude,
                                longitudeRef: ex.GPSLongitudeRef,
                                longitude: ex.longitude,
                                altitudeRef: ex.GPSAltitudeRef ? ex.GPSAltitudeRef[0] : undefined,
                                altitude: ex.GPSAltitude,
                                timeStamp: ex.GPSTimeStamp,
                                speedRef: ex.GPSSpeedRef,
                                speed: ex.GPSSpeed,
                                imgDirectionRef: ex.GPSImgDirectionRef,
                                imgDirection: ex.GPSImgDirection,
                                destBearingRef: ex.GPSDestBearingRef,
                                destBearing: ex.GPSDestBearing,
                                dateStamp: ex.GPSDateStamp,
                                horizontalPositioningError: ex.GPSHPositioningError
                            }
                        }

                        const sortedDb = Object.keys(photoMetadata)
                            .sort((a, b) => new Date(b) - new Date(a))
                            .reduce((acc, key) => {
                                acc[key] = photoMetadata[key];
                                return acc;
                            }, {});

                        photoMetadata = sortedDb;

                        writeMetadata();
                    })
                    .catch((err) => {
                        console.error(err)
                        return
                        ffmpeg.ffprobe(finalFilePath, (err, metadata) => {
                            console.log(metadata);
                            const photoDate = new Date();
                            const pds = `${photoDate.getMonth() + 1}/${photoDate.getDate()}/${photoDate.getFullYear()}`
                            if (!photoMetadata[pds]) photoMetadata[pds] = {};

                            var m = metadata.streams[0];

                            photoMetadata[pds][fileName] = {
                                uploaded: new Date(),
                                width: m.width,
                                height: m.height,
                                megapixels: calculateMegapixels(m.width, m.height),

                            }

                            writeMetadata()
                        });
                    })
            }
        } else {
            res.sendStatus(200);
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error uploading file');
    }
});

app.use(express.json());

const findPhotosForDates = (start, days, photoMetadata) => {
    let files = {};
    let currentDate = new Date(start);
    let photoDates = Object.keys(photoMetadata).map(date => new Date(date));
    photoDates.sort((a, b) => b - a); // Sort dates in descending order

    const findClosestDate = (targetDate) => {
        let left = 0;
        let right = photoDates.length - 1;

        while (left <= right) {
            let mid = Math.floor((left + right) / 2);
            if (photoDates[mid] <= targetDate) {
                right = mid - 1;
            } else {
                left = mid + 1;
            }
        }
        return photoDates[left] || null;
    };

    for (let i = 0; i < days; i++) {
        let targetDate = new Date(currentDate);
        targetDate.setDate(currentDate.getDate() - i);

        let closestDate = findClosestDate(targetDate);

        if (closestDate) {
            let dateKey = `${closestDate.getMonth() + 1}/${closestDate.getDate()}/${closestDate.getFullYear()}`;
            files[dateKey] = Object.keys(photoMetadata[dateKey]);
        } else {
            console.log(`No photos found for ${targetDate.toISOString().split('T')[0]}`);
            let dateKey = `${targetDate.getMonth() + 1}/${targetDate.getDate()}/${targetDate.getFullYear()}`;
            files[dateKey] = []; // empty array as placeholder
        }
    }

    return files;
};

app.post('/api/request-photos', (req, res) => {
    const { start, days } = req.body;
    if (!start || !days) {
        return res.sendStatus(400);
    }

    var files = {}

    const keys = Object.keys(photoMetadata);
    const startIndex = keys.indexOf(start);
    //if (startIndex === -1) return res.sendStatus(400); // invalid start

    for (let i = startIndex; i < keys.length; i++) {
        const key = keys[i];
        const value = photoMetadata[key];
        files[key] = value;
    }

    res.send(files);
});

app.get("/photo/:id", (req, res) => {
    res.sendFile(path.join(__dirname, "html", "home.html"));
})

app.get("/api/request-metadata/:date/:name", (req, res) => {
    if (!req.params.date || !req.params.name) return res.sendStatus(400);

    const date = req.params.date.replaceAll("-", "/");

    if (!photoMetadata[date][req.params.name]) return res.sendStatus(400);
    res.send(photoMetadata[date][req.params.name]);
})

app.get("/auth/login", (req, res) => {
    res.sendFile(path.join(__dirname, "html", "login.html"));
})

const credentials = JSON.parse(fs.readFileSync(path.join(__dirname, "credentials.json"), "utf8"));
const tokens = {};
const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIKLMNOPQRSTUVWXYZ12345678901234567890"

const generateToken = () => {
    let result = ""
    for (let i = 0;  i < 26; i++) {
        result += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }
    return result
}

app.post("/api/auth/login", (req, res) => {
    const hash = Crypto.SHA256(req.body.password).toString();

    if (!req.body.username || !credentials[req.body.username]) return res.send({ login: false });
    if (credentials[req.body.username] == hash) {
        const token = generateToken();
        tokens[token] = req.body.username;
        res.cookie("token", token);
        res.send({ login: true });
    } else res.send({ login: false });
})

app.listen(7700, () => {
    console.log("Phoco listening on :7000")
})
