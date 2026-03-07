#!/usr/bin/env node
"use strict";

const { generateImage } = require("./generator");
const { storeImageFromUrl, storeImageFromBase64 } = require("./manager");
const { processBatch } = require("./batch");
const { resolveConfig } = require("./config");

function parseAgentMessage(message) {
  const trimmed = message.trim();

  const batchMatch = trimmed.match(/^\/batch-generate\s+(.+)/s);
  if (batchMatch) {
    const lines = batchMatch[1]
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    return { action: "batch", prompts: lines };
  }

  const generateMatch = trimmed.match(/^\/generate\s+(.+)/s);
  if (generateMatch) {
    return { action: "generate", prompt: generateMatch[1].trim() };
  }

  const listMatch = trimmed.match(/^\/list-images/);
  if (listMatch) {
    return { action: "list" };
  }

  return null;
}

async function handleAgentRequest(message, options = {}) {
  const parsed = parseAgentMessage(message);
  if (!parsed) {
    return {
      success: false,
      error: "Unrecognized command. Use /generate <prompt>, /batch-generate <prompts>, or /list-images.",
    };
  }

  const config = resolveConfig(options);

  switch (parsed.action) {
    case "generate": {
      try {
        const result = await generateImage(parsed.prompt, options);
        let stored;
        if (result.url) {
          stored = await storeImageFromUrl(result.url, parsed.prompt, config.outputDir);
        } else if (result.base64) {
          stored = storeImageFromBase64(result.base64, parsed.prompt, config.outputDir);
        }
        return {
          success: true,
          action: "generate",
          result,
          stored,
        };
      } catch (err) {
        return { success: false, action: "generate", error: err.message };
      }
    }
    case "batch": {
      try {
        const batchResult = await processBatch(parsed.prompts, options);
        return { success: true, action: "batch", ...batchResult };
      } catch (err) {
        return { success: false, action: "batch", error: err.message };
      }
    }
    case "list": {
      const { listImages } = require("./manager");
      const images = listImages(config.outputDir);
      return { success: true, action: "list", images };
    }
    default:
      return { success: false, error: "Unknown action" };
  }
}

module.exports = { handleAgentRequest, parseAgentMessage };
