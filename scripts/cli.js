#!/usr/bin/env node
"use strict";

const { generateImage } = require("./generator");
const { storeImageFromUrl, storeImageFromBase64, listImages, deleteImage } = require("./manager");
const { processBatch } = require("./batch");
const { resolveConfig, validateConfig, SUPPORTED_PROVIDERS } = require("./config");

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    } else {
      args._.push(arg);
    }
  }
  return args;
}

function printHelp() {
  console.log(`
ai-image-generator - Generate images using AI APIs

USAGE:
  node cli.js <command> [options]

COMMANDS:
  generate    Generate a single image from a prompt
  batch       Generate multiple images from prompts (one per line via --file)
  list        List all generated images
  delete      Delete a generated image by filename

OPTIONS:
  --prompt <text>       Image description / prompt
  --provider <name>     API provider: ${SUPPORTED_PROVIDERS.join(", ")} (default: openai)
  --size <WxH>          Image size (default: 1024x1024)
  --quality <level>     Quality level: standard, hd (default: standard)
  --style <style>       Style: natural, vivid (default: natural)
  --output-dir <path>   Output directory (default: ./generated-images)
  --format <fmt>        Image format: png, jpg, webp (default: png)
  --api-key <key>       API key (or use env variable)
  --file <path>         File with prompts for batch mode (one per line)
  --filename <name>     Filename for delete command
  --help                Show this help message

EXAMPLES:
  node cli.js generate --prompt "A sunset over mountains"
  node cli.js generate --prompt "A logo" --provider openai --size 1024x1024
  node cli.js batch --file prompts.txt --provider openai
  node cli.js list --output-dir ./my-images
  node cli.js delete --filename sunset-1234.png
`);
}

async function main(argv) {
  const args = parseArgs(argv || process.argv.slice(2));
  const command = args._[0] || "help";

  if (args.help || command === "help") {
    printHelp();
    return 0;
  }

  const options = {
    provider: args.provider,
    size: args.size,
    quality: args.quality,
    style: args.style,
    outputDir: args["output-dir"],
    format: args.format,
    apiKey: args["api-key"],
  };

  // Remove undefined keys
  Object.keys(options).forEach((k) => {
    if (options[k] === undefined) delete options[k];
  });

  switch (command) {
    case "generate": {
      if (!args.prompt) {
        console.error("Error: --prompt is required for generate command");
        return 1;
      }
      const config = resolveConfig(options);
      const errors = validateConfig(config);
      if (errors.length > 0) {
        console.error("Configuration errors:");
        errors.forEach((e) => console.error(`  - ${e}`));
        return 1;
      }

      console.log(`Generating image with ${config.provider}...`);
      console.log(`Prompt: "${args.prompt}"`);
      console.log(`Size: ${config.size}, Quality: ${config.quality}`);

      const result = await generateImage(args.prompt, options);
      console.log("Generation successful!");

      let stored;
      if (result.url) {
        console.log("Downloading and storing image...");
        stored = await storeImageFromUrl(result.url, args.prompt, config.outputDir, config.format);
      } else if (result.base64) {
        console.log("Storing image from base64...");
        stored = storeImageFromBase64(result.base64, args.prompt, config.outputDir, config.format);
      }

      if (stored) {
        console.log(`Image saved: ${stored.path}`);
        console.log(`Size: ${stored.size} bytes`);
      }
      if (result.revisedPrompt) {
        console.log(`Revised prompt: "${result.revisedPrompt}"`);
      }
      return 0;
    }

    case "batch": {
      if (!args.file) {
        console.error("Error: --file is required for batch command");
        return 1;
      }
      const fs = require("fs");
      if (!fs.existsSync(args.file)) {
        console.error(`Error: File not found: ${args.file}`);
        return 1;
      }
      const prompts = fs
        .readFileSync(args.file, "utf-8")
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

      if (prompts.length === 0) {
        console.error("Error: No prompts found in file");
        return 1;
      }

      console.log(`Batch processing ${prompts.length} prompts...`);
      const batchResult = await processBatch(prompts, options);
      console.log(`Completed: ${batchResult.succeeded} succeeded, ${batchResult.failed} failed`);

      if (batchResult.errors.length > 0) {
        console.error("Errors:");
        batchResult.errors.forEach((e) => console.error(`  [${e.index}] ${e.error}`));
      }
      return batchResult.failed > 0 ? 1 : 0;
    }

    case "list": {
      const config = resolveConfig(options);
      const images = listImages(config.outputDir);
      if (images.length === 0) {
        console.log("No images found.");
      } else {
        console.log(`Found ${images.length} image(s):`);
        images.forEach((img) => {
          console.log(`  ${img.filename} (${img.size} bytes) - ${img.createdAt}`);
          console.log(`    Prompt: "${img.prompt}"`);
        });
      }
      return 0;
    }

    case "delete": {
      if (!args.filename) {
        console.error("Error: --filename is required for delete command");
        return 1;
      }
      const config = resolveConfig(options);
      const deleted = deleteImage(config.outputDir, args.filename);
      if (deleted) {
        console.log(`Deleted: ${args.filename}`);
      } else {
        console.error(`Image not found: ${args.filename}`);
        return 1;
      }
      return 0;
    }

    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      return 1;
  }
}

if (require.main === module) {
  main()
    .then((code) => process.exit(code))
    .catch((err) => {
      console.error(`Fatal error: ${err.message}`);
      process.exit(1);
    });
}

module.exports = { main, parseArgs };
