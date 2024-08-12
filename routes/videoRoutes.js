const express = require("express");
const {
  uploadVideo,
  deleteVideo,
  editVideo,
} = require("../controllers/videoController");
const upload = require("../middlewares/uploadMiddleWare");
const router = express.Router();

router.post("/upload", upload.single("video"), uploadVideo);
router.delete("/delete", deleteVideo);
router.put("/update", editVideo);

module.exports = router;
