const express = require("express");
const path = require("path");
const fs = require("fs-extra");
const bodyParser = require("body-parser");
const multiparty = require('multiparty');
const multer = require('multer');
const exifr = require('exifr');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();

app.use(express.static(path.join(__dirname, "public")));
app.use("/photos", express.static(path.join(__dirname, "uploads")));
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
            const finalFilePath = path.join(__dirname, 'uploads', fileName);
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

            exifr.parse(finalFilePath)
                .then((ex) => {
                    const photoDate = new Date(ex.DateTimeOriginal == undefined ? new Date() : ex.DateTimeOriginal);
                    const pds = `${photoDate.getMonth() + 1}/${photoDate.getDate()}/${photoDate.getFullYear()}`
                    if (!photoMetadata[pds]) photoMetadata[pds] = {};

                    photoMetadata[pds][fileName] = {
                        date: ex.DateTimeOriginal,
                        uploaded: new Date(),
                        dateOff: ex.OffsetTimeOriginal,
                        fstop: ex.FNumber,
                        iso: ex.ISO,
                        shutter: ex.ExposureTime ? `1/${Math.round(1 / ex.ExposureTime)}` : undefined,
                        megapixels: calculateMegapixels(ex.ExifImageWidth || ex.ImageWidth, ex.ExifImageHeight || ex.ImageHeight) || undefined,
                        resolution: `${ex.ExifImageWidth || ex.ImageWidth} x ${ex.ExifImageHeight || ex.ImageHeight}`,
                        make: ex.Make,
                        model: ex.Model,
                        gps: {
                            latitudeRef: ex.GPSLatitudeRef,
                            latitude: ex.GPSLatitude,
                            longitudeRef: ex.GPSLongitudeRef,
                            longitude: ex.GPSLongitude,
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

                    writeMetadata();
                })
                .catch((err) => {
                    console.error(err)
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
        } else {
            res.sendStatus(200);
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error uploading file');
    }
});

app.use(express.json());

app.get("/api/request-photos", (req, res) => {
    const { start, days } = req.body;

})

app.listen(7000, () => {
    console.log("Phoco listening on :7000")
})
