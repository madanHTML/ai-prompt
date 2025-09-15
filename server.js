// server.js
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

// Add this in server.js top (before routes)
//const path = require("path");

// Serve index.html at root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});


/*// ✅ robots.txt serve करो
app.get("/robots.txt", (req, res) => {
  res.type("text/plain");
  res.send(`User-agent: *
Disallow:

Sitemap: https://youtube-title-generator-production.up.railway.app/sitemap.xml
`);
});

// ✅ Dynamic sitemap.xml serve करो
app.get("/sitemap.xml", (req, res) => {
  res.type("application/xml");

  const baseUrl = "https://youtube-title-generator-production.up.railway.app";

  const urls = siteRoutes
    .map(
      (route) => `
  <url>
    <loc>${baseUrl}${route.loc}</loc>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
    )
    .join("");

  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`);
});*/

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
app.listen(PORT, () => console.log("✅ Backend running on https://ai-prompt-production.up.railway.app/:" + PORT));

