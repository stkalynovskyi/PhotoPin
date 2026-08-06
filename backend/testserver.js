const express = require('express');
const app = express();
app.use(express.json({ limit: '50mb' }));
app.post('/test', (req, res) => {
    const { imageBase64 } = req.body;
    console.log('claves:', Object.keys(req.body));
    console.log('type:', typeof imageBase64);
    console.log('length:', imageBase64 ? imageBase64.length : 'NULL');
    res.json({ ok: true });
});
app.listen(4000, () => console.log('test server running'));
