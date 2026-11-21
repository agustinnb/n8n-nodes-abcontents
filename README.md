# n8n-nodes-abcontents

n8n community nodes for [ABContents](https://abcontents.com). They turn a PDF, Word, Excel, PowerPoint, text, photos, a website or a short brief into a narrated video with captions and music. Videos are paid one at a time from a prepaid API key. There is no subscription.

## Installation

In n8n, go to **Settings → Community Nodes → Install** and enter `n8n-nodes-abcontents`. The [n8n community nodes guide](https://docs.n8n.io/integrations/community-nodes/installation/) has the details.

## Credentials

1. Buy tokens and get an API key at [abcontents.com/api-access](https://abcontents.com/api-access). The key starts with `abc_` and is your wallet; no account is needed.
2. In n8n, create an **ABContents API** credential and paste the key. The credential test reads your token balance.

## Nodes

### ABContents

| Operation | What it does |
|---|---|
| Create Video | Orders a video. Its sources can be files (the input binary fields you name, up to 9), a website URL or a brief, and you choose the style, length (30–300 s), video type, language (English or Spanish), size (9:16, 4:5, 1:1, 16:9), voice, music, brand name and an email to notify. It returns the video ID, status, price and estimated wait. |
| Get Video | Returns the status, stage, progress and wait of a video. When it is done, it also returns `downloadUrl`. |
| Get Quote | Returns the price in tokens and the wait for a style and length, before you order. |
| List Styles | Returns all styles with their 2D/3D dimension. |
| Get Balance | Returns the tokens left on the key. |

The node can also be used as a tool by AI Agent nodes.

### ABContents Trigger

**Video Ready** starts the workflow when a video ordered with your key finishes. Every video is reported once. On its first run, the trigger looks back one week.

## Example: a video from every new PDF in a folder

Google Drive Trigger (new file) → Google Drive (download) → **ABContents: Create Video** (Input Binary Fields: `data`). In a second workflow: **ABContents Trigger: Video Ready** → HTTP Request (download `downloadUrl`) → upload it wherever you publish.

## Pricing

1 token = USD 1. A video costs 1 token, plus 2 tokens per minute (2D styles) or 3 tokens per minute (3D styles), with a minimum of 3 tokens. Failed videos are refunded automatically. See [abcontents.com](https://abcontents.com).

## Resources

- [API reference](https://abcontents.com/llms.txt)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- Support: hola@abcontents.com

## License

[MIT](LICENSE.md)
