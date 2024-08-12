const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema({
  title: String,
  videoPath: String,
  video_length: String,
  uploadDate: {
    type: Date,
    default: Date.now,
  },
});

const Video = mongoose.model("Video", videoSchema);

module.exports = Video;
