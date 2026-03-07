const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { parseAgentMessage } = require("../scripts/workflow");

describe("workflow", () => {
  describe("parseAgentMessage", () => {
    it("parses /generate command", () => {
      const result = parseAgentMessage("/generate A beautiful sunset");
      assert.deepEqual(result, { action: "generate", prompt: "A beautiful sunset" });
    });

    it("parses /batch-generate command", () => {
      const result = parseAgentMessage("/batch-generate\nPrompt one\nPrompt two\nPrompt three");
      assert.equal(result.action, "batch");
      assert.equal(result.prompts.length, 3);
      assert.equal(result.prompts[0], "Prompt one");
    });

    it("parses /list-images command", () => {
      const result = parseAgentMessage("/list-images");
      assert.deepEqual(result, { action: "list" });
    });

    it("returns null for unknown command", () => {
      assert.equal(parseAgentMessage("just some text"), null);
    });

    it("handles extra whitespace", () => {
      const result = parseAgentMessage("  /generate   Trimmed prompt  ");
      assert.equal(result.action, "generate");
      assert.equal(result.prompt, "Trimmed prompt");
    });
  });
});
