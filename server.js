const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// API to get japanese letters
app.get("/api/letters", (req, res) => {
  const dataPath = path.join(__dirname, "data", "japanese.json");
  const data = fs.readFileSync(dataPath, "utf8");
  res.json(JSON.parse(data));
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
