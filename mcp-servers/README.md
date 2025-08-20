# GPT-5 MCP Server

This is a Model Context Protocol (MCP) server that integrates OpenAI's GPT-5 API with Claude Code.

## Setup

1. **Configure OpenAI API Key**:
   - Edit the `.env` file in the `mcp-servers` directory
   - Replace `your_openai_api_key_here` with your actual OpenAI API key

2. **Build the server**:
   ```bash
   cd mcp-servers/gpt5-server
   npm install
   npm run build
   ```

3. **Configure Claude Code**:
   - The `claude_code_config.json` file in the project root is already configured
   - Make sure to set the `OPENAI_API_KEY` environment variable in your shell:
     ```bash
     export OPENAI_API_KEY=your_openai_api_key_here
     ```

4. **Restart Claude Code** to load the new MCP server

## Available Tools

Once configured, you'll have access to two new tools in Claude Code:

### 1. `gpt5_generate`
Simple text generation with GPT-5:
- `input`: The prompt text
- `model`: GPT-5 model variant (default: "gpt-5")
- `instructions`: System instructions
- `reasoning_effort`: "low", "medium", or "high"
- `max_tokens`: Maximum tokens to generate
- `temperature`: 0-2 for randomness
- `top_p`: 0-1 for sampling

### 2. `gpt5_messages`
Structured conversation with GPT-5:
- `messages`: Array of conversation messages with roles (user/developer/assistant)
- Same optional parameters as above

## Usage Example

Once the server is running, you can use it in Claude Code by asking:
- "Use GPT-5 to generate a poem about coding"
- "Ask GPT-5 to explain quantum computing"

## Troubleshooting

- If the server doesn't start, check that your OpenAI API key is correctly set
- Make sure you have Node.js v18+ installed
- Check the console output for any error messages