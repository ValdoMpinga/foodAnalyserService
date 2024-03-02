const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const Tesseract = require('tesseract.js');

require('dotenv').config();

const app = express();
const port = process.env.PORT

app.use(cors());

const storage = multer.diskStorage({
    destination: (req, file, cb) =>
    {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) =>
    {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.post('/upload', upload.single('image'), async (req, res) =>
{
    try
    {
        const imagePath = req.file.path;

        const result = await Tesseract.recognize(imagePath, 'por', {
            logger: m => console.log(m)
        });

        const text = result.data.text;

        res.send(text);
        console.log("Extracted text: ");
        console.log(text);
    } catch (error)
    {
        console.error('Error extracting text from image:', error);
        res.status(500).send('Error processing image.');
    }
});

app.listen(port, () =>
{
    console.log(`Server is running on port ${port}`);
});
