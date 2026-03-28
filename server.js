const express = require('express');
const path = require('path');
const app = express();

const publicDir = path.join(__dirname, 'school-system', 'public');
app.use(express.static(publicDir));

app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`School Management System running on port ${PORT}`);
});
