const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const Tesseract = require('tesseract.js');
const OpenAI = require('openai');
const fs = require('fs');

require('dotenv').config();

const app = express();
const port = process.env.PORT;

app.use(cors());


const mission = "You are a pre-processed food analyzer. I'm going to pass you a list of ingredients extracted from an image. Your task is to provide information regarding the health effects, pros and cons, and recommended consumption frequency of the identified ingredients. The output must be organized appropriately for direct conversion to a JavaScript object, with values represented as text. If listing, you can use line breaks to make the content more readable, but avoid object nesting; use JSON keys with single values. Below is the template structure for the output: {\n  \"identified_ingredients\": [],\n  \"health_impact\": \"\",\n  \"pros_and_cons_short_term\": \"\",\n  \"pros_and_cons_long_term\": \"\",\n  \"recommended_consumption\": \"\"\n};\n";

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

        const result = await Tesseract.recognize(imagePath, 'por', {
            logger: m => console.log(m)
        });

        const text = result.data.text;

        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: mission + text }],
            model: process.env.GPT_MODEL,
        });

        res.send(completion.choices[0].message.content);
        console.log("GPT response bellow: ");
        console.log(completion.choices[0].message.content);

        fs.unlink(imagePath, (err) =>
        {
            if (err)
            {
                console.error('Error deleting file:', err);
            } else
            {
                console.log('File deleted successfully');
            }
        });
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
        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: "Test message for OpenAI." }],
            model: process.env.GPT_MODEL,
        });

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
