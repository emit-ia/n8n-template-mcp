# Claude Desktop Integration Guide

## Quick Setup

Add this to your Claude Desktop configuration file:

### Windows
Edit: `%APPDATA%\Claude\claude_desktop_config.json`

### macOS
Edit: `~/Library/Application Support/Claude/claude_desktop_config.json`

### Configuration

**For Local Development (before publishing to npm):**

```json
{
  "mcpServers": {
    "n8n-templates": {
      "command": "node",
      "args": ["C:/Users/igora/Documents/CODE/AGENTS/COD001_CodeAssistant/n8n-template-mcp/build/index.js"],
      "cwd": "C:/Users/igora/Documents/CODE/AGENTS/COD001_CodeAssistant/n8n-template-mcp"
    }
  }
}
```

**After Publishing to NPM:**

```json
{
  "mcpServers": {
    "n8n-templates": {
      "command": "npx",
      "args": ["--package=@emit-ia/n8n-template-mcp", "n8n-template-mcp"]
    }
  }
}
```

## Usage Examples

Once integrated, you can ask Claude:

### Template Discovery
```
"Find n8n templates for Google Sheets automation"
"Show me all database integration templates"
"What categories of n8n templates are available?"
```

### Workflow Development
```
"Get the workflow JSON for template 123"
"Export templates for MySQL and Google Sheets workflows"
"Find templates that use the Slack node"
```

### Template Analysis
```
"Analyze this n8n template and explain how it works"
"What nodes are used in template 456?"
"How do I modify this template for my use case?"
```

## Server Commands

The MCP server provides these tools to Claude:

- `n8n_search_templates` - Search community templates
- `n8n_get_template` - Get detailed template info
- `n8n_list_categories` - Browse template categories  
- `n8n_find_by_node` - Find templates by node type
- `n8n_export_templates` - Export for n8n import
- `n8n_health_check` - Check API status
- `n8n_clear_cache` - Refresh template cache

## Troubleshooting

### Server Not Starting
1. Ensure Node.js 18+ is installed
2. Run `npx @emit-ia/n8n-template-mcp` manually to test
3. Check Claude Desktop logs for error messages

### API Connection Issues
- Server automatically handles rate limiting
- Check n8n community API status at https://community.n8n.io
- Use `n8n_health_check` tool to diagnose

### Cache Issues
- Use `n8n_clear_cache` to refresh stale data
- Templates cached for optimal performance
- Cache automatically manages memory usage

## Advanced Configuration

For custom settings, create `.env` file:

```bash
# Custom API endpoint
N8N_API_BASE=https://api.n8n.io

# Cache tuning (seconds)
CACHE_SEARCH_TTL=900
CACHE_TEMPLATE_TTL=3600

# Rate limiting
RATE_LIMIT_MAX=10
RATE_LIMIT_WINDOW=60000
```

Then use local installation:

```json
{
  "mcpServers": {
    "n8n-templates": {
      "command": "node",
      "args": ["/path/to/n8n-template-mcp/build/index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

---

**Ready for €2,500+/month automation!** 🚀