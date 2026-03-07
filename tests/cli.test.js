const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { parseArgs, main } = require("../scripts/cli");

describe("cli", () => {
  describe("parseArgs", () => {
    it("parses command and flags", () => {
      const args = parseArgs(["generate", "--prompt", "hello world", "--size", "512x512"]);
      assert.deepEqual(args._, ["generate"]);
      assert.equal(args.prompt, "hello world");
      assert.equal(args.size, "512x512");
    });

    it("handles boolean flags", () => {
      const args = parseArgs(["--help"]);
      assert.equal(args.help, true);
    });

    it("handles multiple positional args", () => {
      const args = parseArgs(["generate", "extra"]);
      assert.deepEqual(args._, ["generate", "extra"]);
    });
  });

  describe("main", () => {
    it("returns 0 for help command", async () => {
      const code = await main(["help"]);
      assert.equal(code, 0);
    });

    it("returns 0 for --help flag", async () => {
      const code = await main(["--help"]);
      assert.equal(code, 0);
    });

    it("returns 1 for generate without prompt", async () => {
      const code = await main(["generate"]);
      assert.equal(code, 1);
    });

    it("returns 1 for batch without file", async () => {
      const code = await main(["batch"]);
      assert.equal(code, 1);
    });

    it("returns 1 for delete without filename", async () => {
      const code = await main(["delete"]);
      assert.equal(code, 1);
    });

    it("returns 1 for unknown command", async () => {
      const code = await main(["unknown-cmd"]);
      assert.equal(code, 1);
    });

    it("returns 0 for list command", async () => {
      const code = await main(["list", "--output-dir", "/tmp/nonexistent-img-test"]);
      assert.equal(code, 0);
    });
  });
});
