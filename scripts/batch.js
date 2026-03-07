#!/usr/bin/env node
"use strict";

const { generateImage } = require("./generator");
const { storeImageFromUrl, storeImageFromBase64 } = require("./manager");
const { resolveConfig } = require("./config");

async function processBatch(requests, options = {}) {
  const config = resolveConfig(options);
  const concurrency = config.maxConcurrency || 3;
  const results = [];
  const errors = [];

  const queue = requests.map((req, index) => ({
    index,
    prompt: typeof req === "string" ? req : req.prompt,
    options: typeof req === "string" ? options : { ...options, ...req },
  }));

  async function worker() {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;
      try {
        const result = await generateImage(item.prompt, item.options);
        let stored;
        if (result.url) {
          stored = await storeImageFromUrl(
            result.url,
            item.prompt,
            item.options.outputDir || config.outputDir
          );
        } else if (result.base64) {
          stored = storeImageFromBase64(
            result.base64,
            item.prompt,
            item.options.outputDir || config.outputDir
          );
        }
        results.push({
          index: item.index,
          prompt: item.prompt,
          success: true,
          result,
          stored,
        });
      } catch (err) {
        errors.push({
          index: item.index,
          prompt: item.prompt,
          success: false,
          error: err.message,
        });
      }
    }
  }

  const workers = [];
  for (let i = 0; i < Math.min(concurrency, queue.length); i++) {
    workers.push(worker());
  }
  await Promise.all(workers);

  results.sort((a, b) => a.index - b.index);
  errors.sort((a, b) => a.index - b.index);

  return {
    total: requests.length,
    succeeded: results.length,
    failed: errors.length,
    results,
    errors,
  };
}

module.exports = { processBatch };
