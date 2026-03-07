#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { downloadImage } = require("./generator");

const METADATA_FILE = "image-manifest.json";

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadManifest(outputDir) {
  const manifestPath = path.join(outputDir, METADATA_FILE);
  if (fs.existsSync(manifestPath)) {
    return JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  }
  return { images: [], version: 1 };
}

function saveManifest(outputDir, manifest) {
  const manifestPath = path.join(outputDir, METADATA_FILE);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
}

function generateFilename(prompt, format) {
  const slug = prompt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  const timestamp = Date.now();
  return `${slug}-${timestamp}.${format}`;
}

async function storeImageFromUrl(url, prompt, outputDir, format = "png") {
  ensureDir(outputDir);
  const filename = generateFilename(prompt, format);
  const filePath = path.join(outputDir, filename);

  const imageBuffer = await downloadImage(url);
  fs.writeFileSync(filePath, imageBuffer);

  const entry = {
    filename,
    path: filePath,
    prompt,
    sourceUrl: url,
    format,
    size: imageBuffer.length,
    createdAt: new Date().toISOString(),
  };

  const manifest = loadManifest(outputDir);
  manifest.images.push(entry);
  saveManifest(outputDir, manifest);

  return entry;
}

function storeImageFromBase64(base64Data, prompt, outputDir, format = "png") {
  ensureDir(outputDir);
  const filename = generateFilename(prompt, format);
  const filePath = path.join(outputDir, filename);

  const imageBuffer = Buffer.from(base64Data, "base64");
  fs.writeFileSync(filePath, imageBuffer);

  const entry = {
    filename,
    path: filePath,
    prompt,
    format,
    size: imageBuffer.length,
    createdAt: new Date().toISOString(),
  };

  const manifest = loadManifest(outputDir);
  manifest.images.push(entry);
  saveManifest(outputDir, manifest);

  return entry;
}

function listImages(outputDir) {
  const manifest = loadManifest(outputDir);
  return manifest.images;
}

function getImageByFilename(outputDir, filename) {
  const manifest = loadManifest(outputDir);
  return manifest.images.find((img) => img.filename === filename) || null;
}

function deleteImage(outputDir, filename) {
  const manifest = loadManifest(outputDir);
  const index = manifest.images.findIndex((img) => img.filename === filename);
  if (index === -1) return false;

  const entry = manifest.images[index];
  if (fs.existsSync(entry.path)) {
    fs.unlinkSync(entry.path);
  }
  manifest.images.splice(index, 1);
  saveManifest(outputDir, manifest);
  return true;
}

module.exports = {
  storeImageFromUrl,
  storeImageFromBase64,
  listImages,
  getImageByFilename,
  deleteImage,
  loadManifest,
  saveManifest,
  generateFilename,
  ensureDir,
};
