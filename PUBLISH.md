# Publishing N8N Template MCP Server

The package is ready to publish! Here are the exact commands you need to run:

## Prerequisites

1. **Create npm account** if you don't have one: https://www.npmjs.com/signup
2. **Verify your email** with npm
3. **Enable 2FA** (recommended): `npm profile enable-2fa auth-and-writes`

## Publishing Steps

### 1. Login to npm
```bash
npm login
```
- Follow the prompts to authenticate
- Or use the web browser authentication method

### 2. Verify your login
```bash
npm whoami
```
- Should show your username: `emit-ia`

### 3. Publish the package
```bash
npm publish --access public
```
- The `--access public` flag is required for scoped packages like `@emit-ia/n8n-template-mcp`

### 4. Verify publication
```bash
npm view @emit-ia/n8n-template-mcp
```

## After Publishing

Once published, users can install with:
```bash
npx @emit-ia/n8n-template-mcp
```

Update Claude Desktop configuration to:
```json
{
  "mcpServers": {
    "n8n-templates": {
      "command": "npx",
      "args": ["@emit-ia/n8n-template-mcp"]
    }
  }
}
```

## Package Details

- **Name**: `@emit-ia/n8n-template-mcp`
- **Version**: `1.0.0`
- **Size**: 10.5 kB (compressed), 42.3 kB (unpacked)
- **Files**: 12 files including compiled TypeScript and documentation

## Future Updates

To publish updates:
1. Update version in `package.json`
2. Run `npm run build`
3. Run `npm publish`

## Troubleshooting

### Permission Issues
```bash
npm publish --access public
```

### 2FA Required
If you have 2FA enabled, npm will prompt for your OTP code.

### Version Conflicts
If version exists, increment version number in `package.json`.

---

**Ready to enable n8n workflow automation for the entire community!** 🚀