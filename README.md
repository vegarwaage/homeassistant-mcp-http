# Home Assistant MCP HTTP Server

HTTP-based MCP server addon for Home Assistant with OAuth authentication.

Enables Claude iOS and web apps to access your Home Assistant instance via the Model Context Protocol.

## Features

- 17 MCP tools for controlling and monitoring Home Assistant
- OAuth 2.0 authentication using Home Assistant accounts
- Respects Home Assistant user permissions
- Encrypted session storage
- Automatic token refresh
- Works via Home Assistant ingress (no port forwarding needed)

## Installation

1. Add this repository to Home Assistant:
   - Settings → Add-ons → Add-on Store → ⋮ → Repositories
   - Add: `https://github.com/vegarwaage/homeassistant-mcp-server`

2. Install "Home Assistant MCP HTTP Server"

3. Configure your DuckDNS URL:
   - Go to addon Configuration tab
   - Set `oauth_client_url` to your DuckDNS URL (e.g., `https://yourname.duckdns.org`)

4. Start the addon

## Configuration

```yaml
oauth_client_url: "https://yourname.duckdns.org"
```

**Important:** You must have DuckDNS or another external URL configured for this to work.

## Usage with Claude

### Claude iOS/Web

1. Go to https://claude.ai → Settings → Connectors → Add Custom Connector

2. Enter:
   - Name: `Home Assistant`
   - URL: `https://yourname.duckdns.org/homeassistant_mcp_http` (ingress URL)

3. Use a tool in Claude (e.g., "List my automations")

4. Click "Authorize" when prompted

5. Log in with your Home Assistant credentials

### Available Tools

**States & Control:**
- `ha_get_states` - Query entity states
- `ha_get_history` - Historical data
- `ha_call_service` - Control devices
- `ha_get_entity_details` - Entity details

**Configuration:**
- `ha_read_config` - Read config files
- `ha_write_config` - Write config files (with backup)
- `ha_list_files` - Browse files
- `ha_validate_config` - Validate changes
- `ha_reload_config` - Reload configs
- `ha_list_backups` - View backups

**Automations:**
- `ha_create_automation` - Create automation
- `ha_update_automation` - Update automation
- `ha_delete_automation` - Delete automation
- `ha_list_automations` - List automations

**System:**
- `ha_system_info` - System info
- `ha_get_logs` - Fetch logs
- `ha_restart` - Restart HA

## Security

- OAuth tokens encrypted at rest (AES-256-GCM)
- Sessions expire automatically
- Respects Home Assistant user permissions
- All communication via HTTPS (HA ingress)

## Troubleshooting

**"oauth_client_url not configured" error:**
- Go to addon Configuration tab
- Set your DuckDNS URL
- Restart addon

**"Authentication failed" error:**
- Verify DuckDNS URL is correct and accessible
- Check Home Assistant is accessible from internet
- Try logging out and back in

**Tool execution fails:**
- Check Home Assistant logs
- Verify user has permission for the action
- Check token hasn't expired

## Development

Built with:
- TypeScript
- Express.js
- @modelcontextprotocol/sdk
- Home Assistant OAuth API

## License

MIT
