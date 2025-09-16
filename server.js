const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  const indexPath = path.join(__dirname, "index.html");
  fs.access(indexPath, fs.constants.F_OK, (err) => {
    if (err) {
      res.status(404).send("index.html not found");
    } else {
      res.sendFile(indexPath);
    }
  });
});

const uploadDir = path.join(__dirname, "uploads");
const metadataFile = path.join(__dirname, "image_meta.json");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(metadataFile)) fs.writeFileSync(metadataFile, "[]");

// Multer config for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// Static serve uploads
app.use("/uploads", express.static(uploadDir, {
  setHeaders: (res) => res.setHeader("Cache-Control", "no-store")
}));

// Utils for metadata storage
function readMeta() {
  return JSON.parse(fs.readFileSync(metadataFile, "utf-8"));
}
function writeMeta(data) {
  fs.writeFileSync(metadataFile, JSON.stringify(data, null, 2));
}

// Upload with prompt
app.post("/upload", upload.array("images"), (req, res) => {
  const prompt = req.body.prompt || "";
  let current = readMeta();
  const newFiles = req.files.map(f => {
    const info = {
      url: "/uploads/" + f.filename,
      name: f.originalname,
      filename: f.filename,
      prompt
    };
    current.push(info);
    return info;
  });
  writeMeta(current);
  res.json({ success: true, files: newFiles });
});

// Get gallery: all images + prompt
app.get("/images", (req, res) => {
  res.json(readMeta());
});

// Delete one image + prompt by filename
app.delete("/delete/:filename", (req, res) => {
  const fname = req.params.filename;
  let current = readMeta();
  const idx = current.findIndex(x => x.filename === fname);
  if (idx === -1)
    return res.status(404).json({ success: false, message: "Image not found" });
  // Delete file from uploads
  try { fs.unlinkSync(path.join(uploadDir, fname)); } catch {}
  // Remove from metadata
  current.splice(idx, 1);
  writeMeta(current);
  res.json({ success: true, message: "Image and prompt deleted" });
});

// Delete all images + prompts
app.delete("/delete-all", (req, res) => {
  let current = readMeta();
  current.forEach(obj => {
    try { fs.unlinkSync(path.join(uploadDir, obj.filename)); } catch {}
  });
  writeMeta([]);
  res.json({ success: true, message: "Gallery cleared" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => console.log(`✅ Backend running on port ${PORT}`));










