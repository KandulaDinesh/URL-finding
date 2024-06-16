const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 5000;

app.get('/search', async (req, res) => {
    const { query } = req.query;
    try {
        const response = await axios.get('https://www.google.com/search', {
            params: { q: query },
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.66 Safari/537.36"
            }
        });
        res.send(response.data);
    } catch (error) {
        res.status(500).send('Error fetching search results');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
