# Contributing to @helix/pdf-signer

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Development Setup

1. Clone the repository:
```bash
git clone https://github.com/helix/pdf-signer.git
cd pdf-signer
```

2. Install dependencies:
```bash
pnpm install
```

3. Start development server:
```bash
pnpm dev
```

4. Run tests:
```bash
pnpm test
```

## Project Structure

```
helix-pdf-signer/
├── src/
│   ├── components/       # React components
│   ├── hooks/            # Custom React hooks
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── index.ts          # Public API exports
│   └── styles.css        # Component styles
├── tests/
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── e2e/              # End-to-end tests
├── examples/             # Example usage
└── docs/                 # Documentation
```

## Development Guidelines

### Code Style

- Use TypeScript for all code
- Follow ESLint configuration
- Use Prettier for formatting (runs on commit)
- Write meaningful commit messages

### Component Guidelines

- Use functional components with hooks
- Export types for all component props
- Include JSDoc comments for public APIs
- Use CSS modules for component-specific styles

### Testing

- Write unit tests for all utilities and hooks
- Write integration tests for component interactions
- Write E2E tests for critical user flows
- Maintain >70% code coverage

### Commits

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: Add signature preview component
fix: Fix zoom calculation on mobile
docs: Update installation instructions
test: Add E2E tests for signature flow
refactor: Extract signature utils
style: Fix linting errors
```

## Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes
4. Write/update tests
5. Run tests: `pnpm test`
6. Run linter: `pnpm lint`
7. Commit changes: `git commit -m "feat: Add my feature"`
8. Push to your fork: `git push origin feat/my-feature`
9. Open a Pull Request

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] No breaking changes (or clearly documented)
- [ ] Commit messages follow conventional commits

## Reporting Issues

When reporting issues, please include:

- Library version
- Browser and OS
- Minimal reproduction code
- Expected vs actual behavior
- Console errors/warnings

## Feature Requests

We welcome feature requests! Please:

- Check existing issues first
- Describe the use case
- Explain the expected behavior
- Provide examples if possible

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Keep discussions on topic

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Open an issue or discussion on GitHub.
