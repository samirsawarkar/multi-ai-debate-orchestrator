# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-30

### Added
- Initial release of Multi-AI Debate Orchestrator
- Support for ChatGPT, Claude, and Gemini
- Pre-built templates: Brainstorm, Debate, Validation, Red Team
- Full-page Arena UI for live debate visualization
- Conversation-style chat interface with alternating left/right messages
- Automatic turn-taking and context passing between AIs
- Conclusion generation feature
- Smooth scrolling and typing animations
- Background tab management (tabs stay hidden)
- Retry logic for robust extraction
- Comprehensive error handling and logging

### Features
- **Arena UI**: Full-page debate visualization with chat-style interface
- **Role-based flows**: Each AI gets a specific role (Generator, Critic, Judge, etc.)
- **Template system**: Pre-built workflows for common use cases
- **Context passing**: Automatic passing of previous responses to next AI
- **Conclusion synthesis**: Generate final conclusions from entire conversation
- **Smooth UX**: Typing indicators, smooth scrolling, hidden AI tabs

### Technical
- Manifest V3 Chrome extension
- Content scripts for DOM manipulation
- Background service worker for orchestration
- Chrome Storage API for persistence
- Message passing between components

### Known Limitations
- Requires manual login to AI services
- DOM selectors may break when AI websites update
- Semi-manual by design (not fully automatic)
- Chrome-only (Manifest V3)

## [Unreleased]

### Planned
- Support for additional AI providers
- Custom template builder UI
- Export conversation history
- Dark/light theme toggle
- Better mobile responsiveness
- Automated testing
- CI/CD pipeline
