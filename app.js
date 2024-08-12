require("dotenv").config();
const express = require("express");
const videoRoutes = require("./routes/videoRoutes");
const { connectDB } = require("./config/db");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());

app.use(express.json());
app.use("/videos", express.static("public/videos"));
app.use("/api/videos", videoRoutes);

connectDB();

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
