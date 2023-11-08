const sharp = require('sharp');

async function cropImage(file, cropOptions) {
    const { path, destination } = file;
    const croppedFileName = `${Date.now()}_cropped_${file.originalname}`;

    await sharp(path)
        .resize(cropOptions)
        .toFile(`${destination}/${croppedFileName}`);

    console.log('hello inside crop function .  croppedFileName : ',croppedFileName);
    return croppedFileName;
}

const cropOptions = { width: 500, height: 500 }; // Adjust crop dimensions as needed

module.exports = { cropImage,cropOptions };