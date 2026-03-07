# API Key Setup Guide

## OpenAI

1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Set the environment variable:
   ```bash
   export OPENAI_API_KEY="sk-..."
   ```

## Stability AI

1. Go to https://platform.stability.ai/account/keys
2. Create a new API key
3. Set the environment variable:
   ```bash
   export STABILITY_API_KEY="sk-..."
   ```

## Replicate

1. Go to https://replicate.com/account/api-tokens
2. Create a new token
3. Set the environment variable:
   ```bash
   export REPLICATE_API_TOKEN="r8_..."
   ```

## Using API Keys

You can provide keys in three ways (in order of precedence):

1. **CLI flag**: `--api-key <key>`
2. **Environment variable**: As shown above
3. **Config file**: Set in `assets/config-default.json` (not recommended for security)

Always prefer environment variables over storing keys in files.
