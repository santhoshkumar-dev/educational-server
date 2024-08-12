const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 3001;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Store mappings in-memory (for simplicity)
const urlMappings = {};

// Route to handle URL mapping via POST request
app.post("/map", (req, res) => {
  const { short, url } = req.body;

  if (!short || !url) {
    return res
      .status(400)
      .json({ error: 'Both "short" and "url" are required.' });
  }

  // Save the mapping
  urlMappings[short] = url;

  res.status(200).json({
    message: "URL mapping saved successfully.",
    url: `http://localhost:3001/${short}`,
  });
});

// Route to handle redirection
app.get("/:short", (req, res) => {
  const short = req.params.short;
  const url = urlMappings[short];

  if (url) {
    res.redirect(url);
  } else {
    res.status(404).send("Not found");
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
