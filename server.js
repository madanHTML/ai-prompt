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

app.use('/uploads', express.static(uploadDir, {
  setHeaders: (res, filePath, stat) => {
    res.setHeader('Cache-Control', 'no-store');
  }
}));

app.get("/", (req, res) => {
  const indexPath = path.join(__dirname, "index.html");
  fs.access(indexPath, fs.constants.F_OK, err => {
    if (err) {
      res.status(200).send("Server is running!");
    } else {
      res.sendFile(indexPath);
    }
  });
});

app.post("/upload", upload.array("images"), (req, res) => {
  const files = req.files.map(f => ({
    url: "/uploads/" + f.filename,
    name: f.originalname
  }));
  res.json({ success: true, files });
});

app.get("/images", (req, res) => {
  const files = fs.readdirSync(uploadDir).map(f => ({
    url: "/uploads/" + f,
    name: f
  }));
  res.json(files);
});

app.delete("/delete-all", (req, res) => {
  let deleted = 0;
  fs.readdirSync(uploadDir).forEach(f => {
    fs.unlinkSync(path.join(uploadDir, f));
    deleted++;
  });
  res.json({ success: true, message: `Deleted ${deleted} files` });
});

app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 5000;

// Railway के लिए 0.0.0.0 host जरूरी है
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
