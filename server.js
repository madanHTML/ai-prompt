// server.js
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

// -------------------------
// 📂 Uploads Folder
// -------------------------
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// -------------------------
// ⚡ Multer Config
// -------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

// -------------------------
// 🚀 Serve Uploaded Images
// -------------------------
app.use("/uploads", express.static(uploadDir));

// -------------------------
// 📤 Upload API
// -------------------------
app.post("/upload", upload.array("images"), (req, res) => {
  const files = req.files.map(f => ({
    url: "/uploads/" + f.filename,
    name: f.originalname
  }));
  res.json({ success: true, files });
});

// -------------------------
// 📥 Get All Images
// -------------------------
app.get("/images", (req, res) => {
  const files = fs.readdirSync(uploadDir).map(f => ({
    url: "/uploads/" + f,
    name: f
  }));
  res.json(files);
});

// -------------------------
// 🗑 Delete All Images (optional)
// -------------------------
app.delete("/delete-all", (req, res) => {
  fs.readdirSync(uploadDir).forEach(f => {
    fs.unlinkSync(path.join(uploadDir, f));
  });
  res.json({ success: true, message: "All files deleted" });
});

// -------------------------
// 🔥 Start Server
// -------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("✅ Backend running on http://localhost:" + PORT));


