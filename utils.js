const request = require("request");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const sharp = require("sharp");

async function downloadImage(url, dest) {
  const options = {
    url,
    encoding: null, // Set encoding to null to ensure that the data is returned as a buffer
  };

  return new Promise((resolve, reject) => {
    request(options, (error, response, body) => {
      if (error) {
        reject(error);
      } else if (response.statusCode !== 200) {
        reject(
          new Error(
            `Failed to download image. Status code: ${response.statusCode}`
          )
        );
      } else {
        fs.writeFile(dest, body, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      }
    });
  });
}

// Function to add overlays to an image using canvas
async function addOverlayToImage(
  imagePath,
  parcelColor,
  buildingColor,
  geocodeColor
) {
  const canvas = createCanvas(800, 600);
  const context = canvas.getContext("2d");

  const rawBuffer = await sharp(imagePath).jpeg({ quality: 80 }).toBuffer();

  // Load property image
  const image = await loadImage(rawBuffer);

  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  // Draw parcel overlay
  if (parcelColor) {
    context.strokeStyle = parcelColor;
    context.lineWidth = 4;
    context.strokeRect(100, 100, 300, 200);
  }

  // Draw building overlay
  if (buildingColor) {
    context.fillStyle = buildingColor;
    context.fillRect(400, 300, 150, 150);
  }

  // Draw geocode overlay
  if (geocodeColor) {
    context.beginPath();
    context.fillStyle = geocodeColor;
    context.arc(550, 200, 50, 0, Math.PI * 2, true);
    context.fill();
    context.closePath();
  }

  // Convert canvas to JPEG and return as buffer
  const buffer = canvas.toBuffer("image/jpeg");
  console.log(buffer);
  return buffer;
}

module.exports = {
  downloadImage,
  addOverlayToImage,
};
