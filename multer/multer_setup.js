/* const multer= require('multer');

const storage= multer.diskStorage({
    destination: (req, file, cb) =>{
        cb(null,'public/images/products');
    },
    filename: (req,file,cb)=>{
        console.log(file);
        const uniqueFileName = Date.now()+ '-' + file.originalname; // Use a unique filename
        cb(null, uniqueFileName);
    }
});

const upload= multer({storage:storage});

module.exports = upload; */
const multer = require('multer');
/* const sharp = require('sharp');

async function cropImage(file, cropOptions) {
    const { path, destination } = file;
    const croppedFileName = `${Date.now()}_cropped_${file.originalname}`;

    await sharp(path)
        .resize(cropOptions)
        .toFile(`${destination}/${croppedFileName}`);

    return croppedFileName;
} */

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images/products');
    },
    filename: (req, file, cb) => {
        console.log(file);
        const uniqueFileName = Date.now() + '-' + file.originalname;
        cb(null, uniqueFileName);
    }
});

const upload = multer({ storage: storage });


const cropOptions = { width: 10, height: 10 }; // Adjust crop dimensions as needed

// Use custom file filter to crop the image
/* upload.single('mainImage', async (req, res, next) => {
    try {
        if (req.file) {
            const croppedFileName = await cropImage(req.file, cropOptions);
            req.croppedFileName = croppedFileName; // Store the cropped file name in the request object
        }
        next();
    } catch (error) {
        next(error);
    }
}); */

// Use custom file filter to crop the main image
/* upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'auxiliaryImages', maxCount: 6 }, // Adjust maxCount as needed
])(req, res, async (error) => {
    try {
        if (error) {
            // Handle any Multer errors here
            return res.status(400).send('Error uploading files.');
        }

        // Check if a new main image was selected
        if (req.files['mainImage']) {
            const mainImageFile = req.files['mainImage'][0];
            const croppedFileName = await cropImage(mainImageFile, cropOptions);
            req.croppedFileName = croppedFileName; // Store the cropped file name in the request object
        }

        // Handle other files, if needed, such as auxiliaryImages

        next();
    } catch (error) {
        next(error);
    }
}); */

module.exports = upload;

