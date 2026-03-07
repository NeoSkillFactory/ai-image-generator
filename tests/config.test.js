const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { resolveConfig, validateConfig, SUPPORTED_PROVIDERS, DEFAULTS } = require("../scripts/config");

describe("config", () => {
  describe("resolveConfig", () => {
    it("returns defaults when no overrides given", () => {
      const config = resolveConfig();
      assert.equal(config.provider, "openai");
      assert.equal(config.size, "1024x1024");
      assert.equal(config.quality, "standard");
      assert.equal(config.format, "png");
      assert.equal(config.maxConcurrency, 3);
    });

    it("applies overrides", () => {
      const config = resolveConfig({ provider: "stability", size: "512x512" });
      assert.equal(config.provider, "stability");
      assert.equal(config.size, "512x512");
    });

    it("throws on unsupported provider", () => {
      assert.throws(() => resolveConfig({ provider: "invalid" }), /Unsupported provider/);
    });

    it("reads api key from overrides", () => {
      const config = resolveConfig({ apiKey: "test-key-123" });
      assert.equal(config.apiKey, "test-key-123");
    });
  });

  describe("validateConfig", () => {
    it("reports missing api key", () => {
      const config = resolveConfig();
      const errors = validateConfig(config);
      assert.ok(errors.length > 0);
      assert.ok(errors[0].includes("API key"));
    });

    it("reports invalid size format", () => {
      const config = resolveConfig({ apiKey: "test", size: "invalid" });
      const errors = validateConfig(config);
      assert.ok(errors.some((e) => e.includes("Invalid size")));
    });

    it("passes with valid config", () => {
      const config = resolveConfig({ apiKey: "test-key" });
      const errors = validateConfig(config);
      assert.equal(errors.length, 0);
    });
  });

  describe("SUPPORTED_PROVIDERS", () => {
    it("includes openai, stability, replicate", () => {
      assert.ok(SUPPORTED_PROVIDERS.includes("openai"));
      assert.ok(SUPPORTED_PROVIDERS.includes("stability"));
      assert.ok(SUPPORTED_PROVIDERS.includes("replicate"));
    });
  });
});
