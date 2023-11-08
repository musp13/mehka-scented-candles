
const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images/banners/uploaded');
    },
    filename: (req, file, cb) => {
        console.log(file);
        const uniqueFileName = Date.now() + '-' + file.originalname;
        cb(null, uniqueFileName);
    }
});

const bannerUpload = multer({ storage: storage });

module.exports = bannerUpload;

