#!/usr/bin/env node
"use strict";

const https = require("https");
const http = require("http");
const { URL } = require("url");
const { resolveConfig, validateConfig } = require("./config");

const PROVIDER_ENDPOINTS = {
  openai: {
    url: "https://api.openai.com/v1/images/generations",
    buildPayload(prompt, config) {
      return {
        model: config.model || "dall-e-3",
        prompt,
        n: 1,
        size: config.size,
        quality: config.quality,
        response_format: "url",
      };
    },
    parseResponse(body) {
      const data = JSON.parse(body);
      if (data.error) throw new Error(data.error.message);
      return { url: data.data[0].url, revisedPrompt: data.data[0].revised_prompt || "" };
    },
    authHeader(apiKey) {
      return { Authorization: `Bearer ${apiKey}` };
    },
  },
  stability: {
    url: "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
    buildPayload(prompt, config) {
      const [width, height] = config.size.split("x").map(Number);
      return {
        text_prompts: [{ text: prompt, weight: 1 }],
        cfg_scale: 7,
        width: width || 1024,
        height: height || 1024,
        steps: 30,
        samples: 1,
      };
    },
    parseResponse(body) {
      const data = JSON.parse(body);
      if (data.message) throw new Error(data.message);
      return { base64: data.artifacts[0].base64, seed: data.artifacts[0].seed };
    },
    authHeader(apiKey) {
      return { Authorization: `Bearer ${apiKey}` };
    },
  },
  replicate: {
    url: "https://api.replicate.com/v1/predictions",
    buildPayload(prompt, config) {
      return {
        version: "ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4",
        input: {
          prompt,
          width: parseInt(config.size.split("x")[0]) || 1024,
          height: parseInt(config.size.split("x")[1]) || 1024,
        },
      };
    },
    parseResponse(body) {
      const data = JSON.parse(body);
      if (data.error) throw new Error(JSON.stringify(data.error));
      return { id: data.id, status: data.status, urls: data.urls };
    },
    authHeader(apiKey) {
      return { Authorization: `Token ${apiKey}` };
    },
  },
};

function httpRequest(urlStr, options, postData) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const transport = parsed.protocol === "https:" ? https : http;
    const req = transport.request(
      parsed,
      {
        method: options.method || "POST",
        headers: options.headers || {},
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          if (res.statusCode >= 400) {
            let msg = `HTTP ${res.statusCode}`;
            try {
              const parsed = JSON.parse(body);
              msg += `: ${parsed.error?.message || parsed.message || body.slice(0, 200)}`;
            } catch {
              msg += `: ${body.slice(0, 200)}`;
            }
            reject(new Error(msg));
          } else {
            resolve(body);
          }
        });
      }
    );
    req.on("error", reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function generateImage(prompt, options = {}) {
  const config = resolveConfig(options);
  const errors = validateConfig(config);
  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }

  const provider = PROVIDER_ENDPOINTS[config.provider];
  if (!provider) {
    throw new Error(`Unknown provider: ${config.provider}`);
  }

  const payload = provider.buildPayload(prompt, config);
  const headers = {
    "Content-Type": "application/json",
    ...provider.authHeader(config.apiKey),
  };

  let lastError;
  for (let attempt = 1; attempt <= config.retryAttempts; attempt++) {
    try {
      const body = await httpRequest(provider.url, { method: "POST", headers }, JSON.stringify(payload));
      const result = provider.parseResponse(body);
      return {
        success: true,
        provider: config.provider,
        prompt,
        ...result,
        config: {
          size: config.size,
          quality: config.quality,
          model: config.model,
        },
      };
    } catch (err) {
      lastError = err;
      if (attempt < config.retryAttempts) {
        await new Promise((r) => setTimeout(r, config.retryDelay * attempt));
      }
    }
  }

  throw new Error(`Image generation failed after ${config.retryAttempts} attempts: ${lastError.message}`);
}

function downloadImage(urlStr) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const transport = parsed.protocol === "https:" ? https : http;
    transport.get(parsed, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadImage(res.headers.location).then(resolve, reject);
      }
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    }).on("error", reject);
  });
}

module.exports = { generateImage, downloadImage, httpRequest, PROVIDER_ENDPOINTS };
