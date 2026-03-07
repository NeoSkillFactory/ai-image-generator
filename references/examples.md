# Usage Examples

## Single Image Generation

```bash
# Generate with OpenAI DALL-E (default)
node scripts/cli.js generate --prompt "A serene mountain lake at dawn"

# Generate with Stability AI
node scripts/cli.js generate --prompt "A futuristic cityscape" --provider stability

# Custom size and quality
node scripts/cli.js generate --prompt "A product photo" --size 1792x1024 --quality hd

# Specify output directory
node scripts/cli.js generate --prompt "An abstract painting" --output-dir ./art
```

## Batch Processing

```bash
# Create a prompts file
echo "A red sports car\nA blue ocean wave\nA green forest" > prompts.txt

# Run batch generation
node scripts/cli.js batch --file prompts.txt --provider openai
```

## Image Management

```bash
# List all generated images
node scripts/cli.js list

# Delete a specific image
node scripts/cli.js delete --filename sunset-1709123456789.png
```

## Agent Workflow

Send these messages to the OpenClaw agent:

```
/generate A professional headshot for a tech company website
/batch-generate
Mountain landscape
Ocean sunset
City skyline at night
/list-images
```
