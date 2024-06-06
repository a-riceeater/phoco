const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegPath);

/**
 * Generate a low file size thumbnail for a given image
 * @param {string} inputPath - Path to the input image
 * @param {string} outputPath - Path to save the thumbnail
 * @param {number} height - Height of the thumbnail
 * @param {number} quality - Quality of the thumbnail (1-31, lower is better quality)
 */
function generateThumbnail(inputPath, outputPath, height, quality) {
  ffmpeg(inputPath)
    .output(outputPath.replace(/\.[^/.]+$/, ".jpeg"))
    .outputOptions([
      `-vf scale=-1:${height}`, 
      `-qscale:v ${quality}`
    ])
    .on('end', () => {
      console.log('Thumbnail generated successfully');
    })
    .on('error', (err) => {
      console.error('Error generating thumbnail:', err);
    })
    .run();
}

function generateVideoThumbnail(inputPath, outputPath, height, quality) {
  ffmpeg(inputPath)
    .screenshots({
      timestamps: ['0'],
      filename: outputPath.replace(/\.[^/.]+$/, ".jpeg"),
      folder: '.',
      size: `?x${height}`,
      quality: quality
    })
    .on('end', () => {
      console.log('Thumbnail generated successfully');
    })
    .on('error', (err) => {
      console.error('Error generating thumbnail:', err);
    });
}


module.exports = { generateThumbnail: generateThumbnail, generateVideoThumbnail: generateVideoThumbnail }

const inputImagePath = path.resolve(__dirname, 'uploads/IMG_8216.jpeg');
const outputThumbnailPath = path.resolve(__dirname, 'thumbnail.jpg'); 
const thumbnailHeight = 480;
const thumbnailQuality = 30; // lower = heigher quality, 31 worst

//generateThumbnail(inputImagePath, outputThumbnailPath, thumbnailHeight, thumbnailQuality);