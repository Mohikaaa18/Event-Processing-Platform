const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();

app.use(express.json());

const SECRET = "mysecretkey";

app.post('/login', (req, res) => {
    const { username } = req.body;

    const token = jwt.sign({ username }, SECRET, { expiresIn: '1h' });

    res.json({ token });
});

app.get('/protected', (req, res) => {
    const token = req.headers.authorization;

    try {
        const decoded = jwt.verify(token, SECRET);
        res.json({ message: "Protected data", user: decoded });
    } catch {
        res.status(401).json({ error: "Unauthorized" });
    }
});

app.listen(3001, () => console.log("Auth service running"));