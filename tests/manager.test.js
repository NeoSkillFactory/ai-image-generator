const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const os = require("os");
const {
  storeImageFromBase64,
  listImages,
  getImageByFilename,
  deleteImage,
  generateFilename,
  ensureDir,
  loadManifest,
} = require("../scripts/manager");

describe("manager", () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "img-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe("generateFilename", () => {
    it("generates a slug-based filename", () => {
      const name = generateFilename("A sunset over mountains", "png");
      assert.ok(name.endsWith(".png"));
      assert.ok(name.startsWith("a-sunset-over-mountains-"));
    });

    it("truncates long prompts", () => {
      const longPrompt = "a".repeat(200);
      const name = generateFilename(longPrompt, "jpg");
      assert.ok(name.length < 100);
    });
  });

  describe("ensureDir", () => {
    it("creates nested directories", () => {
      const nested = path.join(tmpDir, "a", "b", "c");
      ensureDir(nested);
      assert.ok(fs.existsSync(nested));
    });
  });

  describe("storeImageFromBase64", () => {
    it("stores an image and updates manifest", () => {
      const base64 = Buffer.from("fake-image-data").toString("base64");
      const entry = storeImageFromBase64(base64, "test prompt", tmpDir, "png");
      assert.ok(entry.filename.endsWith(".png"));
      assert.equal(entry.prompt, "test prompt");
      assert.ok(fs.existsSync(entry.path));

      const manifest = loadManifest(tmpDir);
      assert.equal(manifest.images.length, 1);
    });
  });

  describe("listImages", () => {
    it("returns empty list for new directory", () => {
      const images = listImages(tmpDir);
      assert.equal(images.length, 0);
    });

    it("returns stored images", () => {
      const base64 = Buffer.from("data1").toString("base64");
      storeImageFromBase64(base64, "img1", tmpDir);
      storeImageFromBase64(base64, "img2", tmpDir);
      const images = listImages(tmpDir);
      assert.equal(images.length, 2);
    });
  });

  describe("getImageByFilename", () => {
    it("finds stored image", () => {
      const base64 = Buffer.from("data").toString("base64");
      const entry = storeImageFromBase64(base64, "find me", tmpDir);
      const found = getImageByFilename(tmpDir, entry.filename);
      assert.ok(found);
      assert.equal(found.prompt, "find me");
    });

    it("returns null for unknown filename", () => {
      assert.equal(getImageByFilename(tmpDir, "nonexistent.png"), null);
    });
  });

  describe("deleteImage", () => {
    it("deletes image file and manifest entry", () => {
      const base64 = Buffer.from("data").toString("base64");
      const entry = storeImageFromBase64(base64, "delete me", tmpDir);
      assert.ok(fs.existsSync(entry.path));

      const result = deleteImage(tmpDir, entry.filename);
      assert.equal(result, true);
      assert.ok(!fs.existsSync(entry.path));
      assert.equal(listImages(tmpDir).length, 0);
    });

    it("returns false for unknown filename", () => {
      assert.equal(deleteImage(tmpDir, "nope.png"), false);
    });
  });
});
