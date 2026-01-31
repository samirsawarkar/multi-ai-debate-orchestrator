# Contributing to Multi-AI Debate Orchestrator

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## Getting Started

1. **Fork the repository**
2. **Clone your fork:**
   ```bash
   git clone https://github.com/yourusername/multi-ai-debate-orchestrator.git
   cd multi-ai-debate-orchestrator
   ```

3. **Load the extension in Chrome:**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the project directory

## Development Workflow

### Making Changes

1. **Create a branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes:**
   - Follow the existing code style
   - Add comments for complex logic
   - Test thoroughly on actual AI websites

3. **Test your changes:**
   - Test on ChatGPT, Claude, and Gemini
   - Verify all templates work
   - Check for console errors
   - Test edge cases

4. **Commit your changes:**
   ```bash
   git add .
   git commit -m "Description of your changes"
   ```

5. **Push and create a Pull Request:**
   ```bash
   git push origin feature/your-feature-name
   ```

## Code Style

- Use consistent indentation (2 spaces)
- Use meaningful variable names
- Add comments for complex logic
- Keep functions focused and small
- Follow existing patterns in the codebase

## Areas That Need Help

### High Priority

1. **DOM Selector Updates:**
   - AI websites frequently change their HTML structure
   - Update selectors in `content-scripts/content-*.js`
   - Add fallback selectors for robustness
   - Document the date and version when selectors were updated

2. **Response Detection:**
   - Improve reliability of detecting when AI responses are complete
   - Handle edge cases (streaming, errors, timeouts)
   - Add better error messages

3. **Error Handling:**
   - Improve user-facing error messages
   - Add retry logic where appropriate
   - Handle network errors gracefully

### Medium Priority

1. **New AI Support:**
   - Add support for other AI chat websites
   - Create new content scripts following existing patterns
   - Update manifest.json with new host permissions

2. **New Templates:**
   - Create useful role-based templates
   - Document template structure
   - Add to `templates.js`

3. **UI Improvements:**
   - Improve Arena UI responsiveness
   - Add dark/light theme toggle
   - Better mobile support

### Low Priority

1. **Documentation:**
   - Improve README with screenshots
   - Add video tutorials
   - Create API documentation

2. **Testing:**
   - Add automated tests
   - Create test fixtures
   - Set up CI/CD

## Updating DOM Selectors

When AI websites update their HTML, you'll need to update selectors:

1. **Inspect the website:**
   - Open DevTools (F12)
   - Find the input field, send button, and response container
   - Note the selectors (ID, class, data attributes)

2. **Update content script:**
   - Edit `content-scripts/content-[ai].js`
   - Update selectors in the `selectors` object
   - Add fallback selectors
   - Test thoroughly

3. **Document the change:**
   - Add a comment with the date
   - Note which version of the website it works with
   - Update TROUBLESHOOTING.md if needed

Example:
```javascript
selectors: {
  // Updated 2026-01-30 for ChatGPT UI v2.3
  textarea: '#prompt-textarea',
  // Fallback for older versions
  textareaAlt: 'div[contenteditable="true"]',
  // ...
}
```

## Testing Checklist

Before submitting a PR, please test:

- [ ] Extension loads without errors
- [ ] All three AIs (ChatGPT, Claude, Gemini) work
- [ ] All templates work correctly
- [ ] Responses are extracted properly
- [ ] No console errors in background or content scripts
- [ ] UI is responsive and works on different screen sizes
- [ ] Error messages are clear and helpful
- [ ] Extension works after browser restart

## Pull Request Guidelines

1. **Clear description:**
   - What does this PR do?
   - Why is it needed?
   - How was it tested?

2. **Reference issues:**
   - Link to related issues
   - Use "Fixes #123" if it closes an issue

3. **Keep PRs focused:**
   - One feature or fix per PR
   - Don't mix unrelated changes

4. **Update documentation:**
   - Update README if needed
   - Update comments in code
   - Update TROUBLESHOOTING.md if fixing bugs

## Reporting Bugs

When reporting bugs, please include:

1. **Description:** What happened vs. what you expected
2. **Steps to reproduce:** Detailed steps to trigger the bug
3. **Environment:**
   - Chrome version
   - Extension version
   - OS version
4. **Console logs:** Any errors from:
   - Background service worker console
   - Content script console (on AI website)
   - Extension popup console
5. **Screenshots:** If applicable

## Feature Requests

When requesting features:

1. **Clear description:** What feature do you want?
2. **Use case:** Why is it useful?
3. **Mockups:** If applicable, describe or show the UI
4. **Alternatives:** Have you considered other approaches?

## Questions?

- Open an issue for questions
- Check existing issues first
- Be patient - maintainers are volunteers

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Help others learn

Thank you for contributing! 🎉
