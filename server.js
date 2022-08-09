const express = require('express');

const app = express();

const path = __dirname + '/dist/stathammer40k';

app.use(express.static(path));

app.get('/*', (req, res) => {
    res.sendFile(path + '/index.html');
});

app.listen(process.env.PORT || 8080);