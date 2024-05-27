const express = require("express");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");
const multer = require('multer');

const app = express();

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json({ limit: '2mb' }));
app.use(express.json({ limit: '2mb', extended: true }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(bodyParser.urlencoded({ limit: '2mb', extended: true }));
app.use(bodyParser.text({ type: 'multipart/form-data', limit: '2mb' }));
app.use(bodyParser.text({ type: 'text/plain', limit: '2mb' }));
app.use(require("serve-favicon")(path.join(__dirname, "public", "logo.png")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "html", "home.html"));
})

app.listen(7000, () => {
    console.log("Phoco listening on :7000")
})