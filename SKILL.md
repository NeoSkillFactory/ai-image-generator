---
name: ai-image-generator
description: Automatically generate, store, and manage images in OpenClaw workflows through direct API integration with OpenAI DALL-E, Stability AI, and Replicate.
---

# ai-image-generator

Automatically generate, store, and manage images in OpenClaw workflows through direct API integration.

## Core Capabilities

- **Multi-Provider Support**: Generate images using OpenAI DALL-E, Stability AI (Stable Diffusion), or Replicate through a unified API.
- **Storage & Metadata**: Stores generated images locally with a JSON manifest for tracking prompts, timestamps, and file metadata.
- **CLI Interface**: Command-line tool for direct image generation, batch processing, listing, and deletion.
- **Batch Processing**: Queue multiple prompts for concurrent generation with configurable concurrency limits.
- **Agent Integration**: OpenClaw workflow hooks for `/generate`, `/batch-generate`, and `/list-images` commands.
- **Error Recovery**: Automatic retry with exponential backoff for transient API failures.

## Triggers & Usage Patterns

Use this skill when you need to:

- "Generate an image of [description] for my documentation"
- "Create a logo for [project name] using AI"
- "Batch generate images for [topic/theme] with [count] variations"
- "Create [number] concept images for [product/feature]"
- "Generate a [size] thumbnail for [description]"

### CLI Usage

```bash
# Generate a single image
node scripts/cli.js generate --prompt "A sunset over mountains" --provider openai

# Batch generate from a file
node scripts/cli.js batch --file prompts.txt --provider openai

# List generated images
node scripts/cli.js list

# Delete an image
node scripts/cli.js delete --filename my-image-123456.png
```

### Agent Workflow

Send messages to the agent:
- `/generate A futuristic city skyline` - generates a single image
- `/batch-generate\nPrompt one\nPrompt two\nPrompt three` - generates multiple images
- `/list-images` - lists all stored images

## Configuration Guide

Set API keys via environment variables:

| Provider    | Environment Variable     |
|-------------|--------------------------|
| OpenAI      | `OPENAI_API_KEY`         |
| Stability   | `STABILITY_API_KEY`      |
| Replicate   | `REPLICATE_API_TOKEN`    |

Or pass `--api-key <key>` on the command line.

Default configuration is in `assets/config-default.json`. Override any setting via CLI flags.

## Limitations & Out of Scope

- No manual image editing or post-processing
- No custom AI model training or fine-tuning
- No image hosting (stores locally only)
- No real-time collaboration features
- Connects to existing third-party APIs only

## Acceptance Criteria

- Skill triggers correctly on natural language image generation requests
- CLI runs end-to-end with proper exit codes
- Generated images are stored with metadata in a manifest file
- API failures are retried with exponential backoff
- Batch processing handles concurrent requests within configured limits
- Help output displays all available commands and options
