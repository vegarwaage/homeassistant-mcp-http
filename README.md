# Home Assistant MCP Add-on Repository

Home Assistant add-ons for Model Context Protocol (MCP) integration with Claude.

## Add-ons

This repository contains the following add-on:

### Home Assistant MCP HTTP Server

![Supports aarch64 Architecture][aarch64-shield]
![Supports amd64 Architecture][amd64-shield]
![Supports armhf Architecture][armhf-shield]
![Supports armv7 Architecture][armv7-shield]
![Supports i386 Architecture][i386-shield]

HTTP-based MCP server with OAuth authentication for Claude iOS and web access.

**Features:**
- 17 MCP tools for controlling and monitoring Home Assistant
- OAuth 2.0 authentication using Home Assistant accounts
- Encrypted session storage with AES-256-GCM
- Automatic token refresh
- Works via Home Assistant ingress (no port forwarding needed)

[See full documentation →](homeassistant-mcp-http/README.md)

## Installation

1. Click this button to add the repository to your Home Assistant instance:

   [![Add Repository][repository-badge]][repository-url]

2. Or add manually:
   - Go to **Settings** → **Add-ons** → **Add-on Store** → **⋮** (three dots menu) → **Repositories**
   - Add this URL: `https://github.com/vegarwaage/homeassistant-mcp-http`

3. Install the "Home Assistant MCP HTTP Server" add-on

4. Configure your external URL (DuckDNS, etc.) in the add-on configuration

5. Start the add-on

## Requirements

- Home Assistant instance accessible from the internet via HTTPS
- DuckDNS or another external URL configured
- Claude.ai account (for using Claude web/iOS)

## Support

If you have questions or issues:

1. Check the [add-on documentation](homeassistant-mcp-http/README.md)
2. Review [Home Assistant add-on documentation](https://www.home-assistant.io/addons/)
3. [Open an issue](https://github.com/vegarwaage/homeassistant-mcp-http/issues) on GitHub

## Related Projects

- [homeassistant-mcp-server](https://github.com/vegarwaage/homeassistant-assistant) - stdio-based MCP server for Claude Code/Desktop

## License

MIT

[aarch64-shield]: https://img.shields.io/badge/aarch64-yes-green.svg
[amd64-shield]: https://img.shields.io/badge/amd64-yes-green.svg
[armhf-shield]: https://img.shields.io/badge/armhf-yes-green.svg
[armv7-shield]: https://img.shields.io/badge/armv7-yes-green.svg
[i386-shield]: https://img.shields.io/badge/i386-yes-green.svg
[repository-badge]: https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg
[repository-url]: https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https%3A%2F%2Fgithub.com%2Fvegarwaage%2Fhomeassistant-mcp-http
