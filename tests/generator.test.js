const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { PROVIDER_ENDPOINTS } = require("../scripts/generator");

describe("generator", () => {
  describe("PROVIDER_ENDPOINTS", () => {
    it("has openai, stability, replicate providers", () => {
      assert.ok(PROVIDER_ENDPOINTS.openai);
      assert.ok(PROVIDER_ENDPOINTS.stability);
      assert.ok(PROVIDER_ENDPOINTS.replicate);
    });

    it("openai builds correct payload", () => {
      const config = { model: "dall-e-3", size: "1024x1024", quality: "standard" };
      const payload = PROVIDER_ENDPOINTS.openai.buildPayload("test prompt", config);
      assert.equal(payload.prompt, "test prompt");
      assert.equal(payload.model, "dall-e-3");
      assert.equal(payload.size, "1024x1024");
      assert.equal(payload.n, 1);
    });

    it("stability builds correct payload", () => {
      const config = { size: "1024x1024" };
      const payload = PROVIDER_ENDPOINTS.stability.buildPayload("test", config);
      assert.equal(payload.text_prompts[0].text, "test");
      assert.equal(payload.width, 1024);
      assert.equal(payload.height, 1024);
    });

    it("replicate builds correct payload", () => {
      const config = { size: "512x512" };
      const payload = PROVIDER_ENDPOINTS.replicate.buildPayload("test", config);
      assert.equal(payload.input.prompt, "test");
      assert.equal(payload.input.width, 512);
    });

    it("openai parses valid response", () => {
      const body = JSON.stringify({ data: [{ url: "https://example.com/img.png", revised_prompt: "revised" }] });
      const result = PROVIDER_ENDPOINTS.openai.parseResponse(body);
      assert.equal(result.url, "https://example.com/img.png");
      assert.equal(result.revisedPrompt, "revised");
    });

    it("openai throws on error response", () => {
      const body = JSON.stringify({ error: { message: "Rate limited" } });
      assert.throws(() => PROVIDER_ENDPOINTS.openai.parseResponse(body), /Rate limited/);
    });

    it("auth headers are correctly formatted", () => {
      assert.deepEqual(PROVIDER_ENDPOINTS.openai.authHeader("key1"), { Authorization: "Bearer key1" });
      assert.deepEqual(PROVIDER_ENDPOINTS.stability.authHeader("key2"), { Authorization: "Bearer key2" });
      assert.deepEqual(PROVIDER_ENDPOINTS.replicate.authHeader("key3"), { Authorization: "Token key3" });
    });
  });
});
