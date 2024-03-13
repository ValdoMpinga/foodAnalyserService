const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const Tesseract = require('tesseract.js');
const OpenAI = require('openai');

require('dotenv').config();

const app = express();
const port = process.env.PORT;

app.use(cors());

const mission = "You are a pre processed food analyser, im going to pass you a list of ingredients extracted from an image, so, from whatever you can identify from the text, i need you to tell me in bullets: 1. What the identified ingredients can do to one's health, 2. What are pros and cons of consuming the product in the short and long run,3. how often is recommend to consume the pre processed food that contains those ingredients. The output is going to be displayed on a mobile screen so please give the output on a optimal state to do so\n"
// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

        // Extract text from image using Tesseract.js
        const result = await Tesseract.recognize(imagePath, 'por', {
            logger: m => console.log(m)
        });

        const text = result.data.text;

        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: mission + text }],
            model: process.env.GPT_MODEL,
        });

        res.send(completion.choices[0].message.content);
        console.log("response: ");
        console.log(completion.choices[0].message.content);
        // res.send(mission + text);

        // console.log("Prompt text: ");
        // console.log(mission + text);
    } catch (error)
    {
        console.error('Error processing image and completing text:', error);
        res.status(500).send('Error processing image and completing text.');
    }
});

app.get('/test-openai', async (req, res) =>
{
    try
    {
        // Send a test message to OpenAI for completion
        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: "Test message for OpenAI." }],
            model: process.env.GPT_MODEL,
        });

        // Send the completion result back as the response
        res.json(completion.choices[0]);
    } catch (error)
    {
        console.error('Error calling OpenAI:', error);
        res.status(500).json({ error: 'Error calling OpenAI.' });
    }
});

app.listen(port, () =>
{
    console.log(`Server is running on port ${port}`);
});
