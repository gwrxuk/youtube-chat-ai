# YouTube Chat AI

A Character.AI-style chat interface that lets you paste YouTube URLs and discuss videos with GPT-4o.

**Two modes for video understanding:**
- **Transcript mode** — extracts subtitles/auto-captions and sends text to GPT-4o
- **Vision mode** — for videos without subtitles (music videos, etc.), downloads the video and sends it directly to GPT-4o's vision API

## Deploy to Vercel

1. Push this repo to GitHub
2. Import the repo on [vercel.com/new](https://vercel.com/new)
3. Add your environment variable:
   - `OPENAI_API_KEY` = your OpenAI API key
4. Deploy — that's it!

> **Note:** Make sure your Vercel project uses **Node.js 20** (Settings → General → Node.js Version). The default is 20, so this should work out of the box.

## Local Development

```bash
# Install dependencies
npm install

# Create .env with your key
echo 'OPENAI_API_KEY=sk-proj-...' > .env

# Run dev server
npm run dev
```

## How It Works

1. Click the link icon and paste a YouTube URL
2. The app tries to extract subtitles first (faster, works for most videos)
3. If no subtitles exist (MVs, instrumental, etc.), it downloads a low-res clip and sends the video to GPT-4o vision
4. Chat naturally about the video content

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** (dark theme)
- **OpenAI GPT-4o** (text + vision)
- **@distube/ytdl-core** (YouTube video download, pure JS)
- **youtube-transcript** (subtitle extraction, pure JS)
- **Vercel** (serverless deployment)
