const path = require("path");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const ffprobe = require("ffprobe-static");
const Video = require("../models/videoModel"); // Assuming you have a Video model

ffmpeg.setFfprobePath(ffprobe.path);

const uploadVideo = async (req, res) => {
  console.log("VIDEO UPLOADING ...");
  const { title, description } = req.body;

  try {
    // Save the video details in MongoDB first to get the _id
    const newVideo = new Video({ title, description });
    await newVideo.save();

    // Set the videoPath using the generated _id
    const videoPath = `/videos/${newVideo._id}.mp4`;

    // Rename the uploaded file to match the _id
    const oldPath = path.join(__dirname, "../public/videos", req.file.filename);
    const newPath = path.join(__dirname, "../public", videoPath);
    fs.renameSync(oldPath, newPath);

    // Get the video duration using ffmpeg
    ffmpeg.ffprobe(newPath, async (err, metadata) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Error processing video", error: err });
      }

      const duration = metadata.format.duration;
      const minutes = Math.floor(duration / 60)
        .toString()
        .padStart(2, "0");
      const seconds = Math.floor(duration % 60)
        .toString()
        .padStart(2, "0");
      newVideo.video_length = `${minutes}:${seconds}`;

      // HLS conversion paths
      const hlsPath = path.join(
        __dirname,
        "../public/videos/hls",
        newVideo._id.toString()
      );
      const hlsUri = `/videos/hls/${newVideo._id.toString()}`;

      fs.mkdirSync(hlsPath, { recursive: true });

      // Convert the video to HLS with different resolutions
      ffmpeg(newPath)
        .outputOptions([
          "-preset veryfast",
          "-g 48",
          "-sc_threshold 0",
          "-map 0:v:0",
          "-map 0:a:0",
          "-s:v:0 426x240",
          "-c:v:0 libx264",
          "-b:v:0 400k",
          "-map 0:v:0",
          "-map 0:a:0",
          "-s:v:1 854x480",
          "-c:v:1 libx264",
          "-b:v:1 800k",
          "-map 0:v:0",
          "-map 0:a:0",
          "-s:v:2 1280x720",
          "-c:v:2 libx264",
          "-b:v:2 1200k",
          "-map 0:v:0",
          "-map 0:a:0",
          "-s:v:3 1920x1080",
          "-c:v:3 libx264",
          "-b:v:3 4000k",
          "-var_stream_map",
          "v:0,a:0 v:1,a:1 v:2,a:2 v:3,a:3",
          "-master_pl_name master.m3u8",
          "-f hls",
          "-hls_time 10",
          "-hls_playlist_type vod",
          "-hls_segment_filename",
          path.join(hlsPath, "v%v/fileSequence%d.ts"),
        ])
        .output(path.join(hlsPath, "v%v/prog_index.m3u8"))
        .on("end", async () => {
          console.log("HLS conversion completed");

          // Update the video document with the HLS master playlist path
          newVideo.videoPath = path.join(hlsUri, "master.m3u8");
          await newVideo.save();

          res
            .status(201)
            .json({ message: "Video uploaded successfully", video: newVideo });
        })
        .on("error", (error) => {
          console.error("Error during HLS conversion", error);
          res.status(500).json({ message: "Error processing video", error });
        })
        .run();
    });
  } catch (error) {
    res.status(500).json({ message: "Error uploading video", error });
  }
};

const deleteVideo = async (req, res) => {
  console.log(req.body);
  const { filePath } = req.body;
  const id = filePath.split("/")[2].split(".")[0];
  console.log(id);

  try {
    const video = await Video.findById(id);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    const fullFilePath = path.join(__dirname, "../public", filePath);
    fs.unlinkSync(fullFilePath);

    await video.deleteOne({ _id: id });
    res.status(200).json({ message: "Video deleted successfully" });
  } catch (error) {
    console.log(error);

    // If error has no such file or directory, delete video from db and return success
    if (error.code === "ENOENT") {
      await Video.findByIdAndDelete(id);
      return res.status(200).json({ message: "Video deleted successfully" });
    }

    res.status(500).json({ message: "Error deleting video", error });
  }
};

const editVideo = async (req, res) => {
  const { video_id, title } = req.body;

  try {
    const video = await Video.findById(video_id);

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    video.title = title;
    await video.save();
    console.log(video);

    res.status(200).json({ message: "Video updated successfully", video });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error updating video", error });
  }
};

module.exports = { uploadVideo, deleteVideo, editVideo };
