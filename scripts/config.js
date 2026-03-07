#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const DEFAULT_CONFIG_PATH = path.join(__dirname, "..", "assets", "config-default.json");

const SUPPORTED_PROVIDERS = ["openai", "stability", "replicate"];

const ENV_KEYS = {
  openai: "OPENAI_API_KEY",
  stability: "STABILITY_API_KEY",
  replicate: "REPLICATE_API_TOKEN",
};

const DEFAULTS = {
  provider: "openai",
  model: "dall-e-3",
  size: "1024x1024",
  quality: "standard",
  style: "natural",
  outputDir: "./generated-images",
  format: "png",
  maxConcurrency: 3,
  retryAttempts: 3,
  retryDelay: 1000,
};

function loadDefaultConfig() {
  try {
    if (fs.existsSync(DEFAULT_CONFIG_PATH)) {
      const raw = fs.readFileSync(DEFAULT_CONFIG_PATH, "utf-8");
      return JSON.parse(raw);
    }
  } catch {
    // fall through to defaults
  }
  return {};
}

function resolveConfig(overrides = {}) {
  const fileDefaults = loadDefaultConfig();
  const config = { ...DEFAULTS, ...fileDefaults, ...overrides };

  if (!SUPPORTED_PROVIDERS.includes(config.provider)) {
    throw new Error(
      `Unsupported provider "${config.provider}". Supported: ${SUPPORTED_PROVIDERS.join(", ")}`
    );
  }

  const envKey = ENV_KEYS[config.provider];
  config.apiKey = overrides.apiKey || process.env[envKey] || "";

  return config;
}

function validateConfig(config) {
  const errors = [];
  if (!config.apiKey) {
    errors.push(
      `API key not set. Set the ${ENV_KEYS[config.provider]} environment variable or pass --api-key.`
    );
  }
  if (!/^\d+x\d+$/.test(config.size)) {
    errors.push(`Invalid size format "${config.size}". Expected format: WIDTHxHEIGHT (e.g. 1024x1024)`);
  }
  return errors;
}

module.exports = {
  resolveConfig,
  validateConfig,
  SUPPORTED_PROVIDERS,
  ENV_KEYS,
  DEFAULTS,
};
