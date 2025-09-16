const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// Static serve uploads with no-store cache
app.use('/uploads', express.static(uploadDir, {
  setHeaders: (res, filePath, stat) => {
    res.setHeader('Cache-Control', 'no-store');
  }
}));

// Serve index.html safely
app.get("/", (req, res) => {
  const indexPath = path.join(__dirname, "index.html");
  fs.access(indexPath, fs.constants.F_OK, err => {
    if (err) {
      res.status(404).send("index.html not found");
    } else {
      res.sendFile(indexPath);
    }
  });
});

// Upload images endpoint
app.post("/upload", upload.array("images"), (req, res) => {
  const files = req.files.map(f => ({
    url: "/uploads/" + f.filename,
    name: f.originalname
  }));
  res.json({ success: true, files });
});

// Get images list
app.get("/images", (req, res) => {
  const files = fs.readdirSync(uploadDir).map(f => ({
    url: "/uploads/" + f,
    name: f
  }));
  res.json(files);
});

// Delete all images
app.delete("/delete-all", (req, res) => {
  let deleted = 0;
  fs.readdirSync(uploadDir).forEach(f => {
    fs.unlinkSync(path.join(uploadDir, f));
    deleted++;
  });
  res.json({ success: true, message: `Deleted ${deleted} files` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// Correct port binding for Railway
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

