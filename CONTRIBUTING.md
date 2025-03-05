# Contributing to Valentine

We love your input! We want to make contributing to Valentine as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code lints
6. Issue that pull request!

## Development Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/valentine.git
cd valentine
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Run tests:
```bash
npm test
```

## Project Structure

```
src/
├── models/          # Type definitions and schemas
├── services/        # Core services implementation
└── utils/          # Utility functions and helpers
```

## Coding Style

- Write TypeScript code following the provided ESLint configuration
- Use Prettier for code formatting
- Follow the existing code style and patterns
- Add JSDoc comments for public APIs
- Keep functions small and focused
- Use meaningful variable names

## Testing

- Write unit tests for new functionality
- Place tests in `__tests__` directories next to the code being tested
- Use Jest for testing
- Aim for high test coverage on critical paths

## Pull Request Process

1. Update the README.md with details of changes to the interface
2. Update the version numbers in package.json following [Semantic Versioning](https://semver.org/)
3. You may merge the Pull Request once you have the sign-off of two other developers

## Any contributions you make will be under the MIT Software License

In short, when you submit code changes, your submissions are understood to be under the same [MIT License](http://choosealicense.com/licenses/mit/) that covers the project. Feel free to contact the maintainers if that's a concern.

## Report bugs using GitHub's [issue tracker](https://github.com/valentine/valentine/issues)

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/valentine/valentine/issues/new).

## Write bug reports with detail, background, and sample code

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

## License

By contributing, you agree that your contributions will be licensed under its MIT License.