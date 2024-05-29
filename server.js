const express = require("express");
const path = require("path");
const fs = require("fs-extra");
const bodyParser = require("body-parser");
const multiparty = require('multiparty');
const multer = require('multer');
const exifr = require('exifr');

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
    return (width * height) / 1000000;
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
                    photoMetadata[fileName] = {
                        date: ex.DateTimeOriginal,
                        uploaded: new Date(),
                        dateOff: ex.OffsetTimeOriginal,
                        fstop: ex.FNumber,
                        iso: ex.ISO,
                        shutter: `1/${Math.round(1 / ex.ExposureTime)}`,
                        megapixels: calculateMegapixels(ex.ExifImageWidth, ex.ExifImageHeight),
                        resolution: `${ex.ExifImageWidth} x ${ex.ExifImageHeight}`,
                        make: ex.Make,
                        model: ex.Model,
                        gps: {
                            latitudeRef: ex.GPSLatitudeRef,
                            latitude: ex.GPSLatitude,
                            longitudeRef: ex.GPSLongitudeRef,
                            longitude: ex.GPSLongitude,
                            altitudeRef: ex.GPSAltitudeRef[0],
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
        } else {
            res.sendStatus(200);
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error uploading file');
    }
});

app.use(express.json());

app.listen(7000, () => {
    console.log("Phoco listening on :7000")
})
