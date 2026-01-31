# Security Policy

## Supported Versions

We actively support the latest version of the extension. Security updates will be provided for:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability, please **do not** open a public issue. Instead, please report it privately:

1. **Email**: [Your email or security contact]
2. **GitHub Security Advisory**: Use GitHub's private vulnerability reporting feature

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response Time

We aim to respond to security reports within **48 hours** and provide a fix within **7 days** for critical issues.

## Security Considerations

### This Extension:

- ✅ **Does NOT** collect or transmit user data
- ✅ **Does NOT** use external APIs or servers
- ✅ **Does NOT** store sensitive information
- ✅ **Does NOT** access browsing history
- ✅ **Only** interacts with AI chat websites you explicitly use

### Permissions Explained

- **`tabs`**: Required to manage AI chat tabs
- **`storage`**: Used to save templates and conversation history locally
- **`sidePanel`**: For the side panel UI
- **`scripting`**: To inject content scripts into AI websites
- **`host_permissions`**: Only for AI chat websites (ChatGPT, Claude, Gemini)

### Data Storage

- All data is stored **locally** in Chrome's storage
- No data is sent to external servers
- You can clear all data by uninstalling the extension

### Best Practices

- Only install from trusted sources
- Review the source code before installing
- Keep the extension updated
- Report suspicious behavior immediately

## Known Security Limitations

1. **DOM Manipulation**: The extension manipulates DOM on AI websites, which could potentially be detected as automation
2. **Content Scripts**: Content scripts run in the context of AI websites and have access to page content
3. **No Encryption**: Local storage is not encrypted (standard Chrome storage)

## Responsible Disclosure

We follow responsible disclosure practices:
- We will credit security researchers who report vulnerabilities
- We will not take legal action against security researchers acting in good faith
- We will work with researchers to fix issues before public disclosure

Thank you for helping keep this project secure!
