const sharp = require('sharp');

async function bannerCropImage(file, cropOptions) {
    const { path, destination } = file;
    const croppedFileName = `${Date.now()}_cropped_${file.originalname}`;

    await sharp(path)
        .resize(cropOptions)
        .toFile(`${destination}/${croppedFileName}`);

    console.log('hello inside crop function .  croppedFileName : ',croppedFileName);
    return croppedFileName;
}

const bannerCropOptions = { width: 1500, height: 750 }; // Adjust crop dimensions as needed

module.exports = { bannerCropImage,bannerCropOptions };