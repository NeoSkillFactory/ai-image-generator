# Supported Image Generation Providers

## OpenAI DALL-E

- **Endpoint**: `https://api.openai.com/v1/images/generations`
- **Models**: `dall-e-3`, `dall-e-2`
- **Auth**: Bearer token via `OPENAI_API_KEY`
- **Sizes**: 1024x1024, 1792x1024, 1024x1792 (DALL-E 3); 256x256, 512x512, 1024x1024 (DALL-E 2)
- **Quality**: `standard`, `hd` (DALL-E 3 only)
- **Rate Limits**: 5 images/min (DALL-E 3), 5 images/min (DALL-E 2)
- **Response**: Returns URL to generated image (valid for 1 hour)

## Stability AI (Stable Diffusion)

- **Endpoint**: `https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image`
- **Auth**: Bearer token via `STABILITY_API_KEY`
- **Sizes**: Multiples of 64, minimum 128, maximum 1536 (width * height <= 1048576)
- **Parameters**: `cfg_scale`, `steps`, `samples`
- **Rate Limits**: Varies by plan
- **Response**: Returns base64-encoded image data

## Replicate

- **Endpoint**: `https://api.replicate.com/v1/predictions`
- **Auth**: Token via `REPLICATE_API_TOKEN`
- **Models**: Various (SDXL, Flux, etc. via version hash)
- **Rate Limits**: Varies by plan
- **Response**: Returns prediction ID (async), poll for result URL
