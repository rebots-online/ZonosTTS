# ZonosTTS Development Conventions

## Code Organization
- Use modular, component-based architecture
- Separate concerns: UI, model inference, storage
- Follow functional programming principles

## Naming Conventions
- Use camelCase for variables and functions
- Use PascalCase for classes and components
- Prefix interfaces with `I`
- Use descriptive, self-documenting names

## Branch Naming
- `feature/`: New features
- `bugfix/`: Bug corrections
- `refactor/`: Code restructuring
- `docs/`: Documentation updates

## Commit Message Format
```
<type>: <subject>

<optional body>

<optional footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance tasks

## Code Quality
- Use ESLint for JavaScript/TypeScript
- Use Prettier for code formatting
- Maintain 80% test coverage
- Use TypeScript for type safety

## Performance Guidelines
- Minimize bundle size
- Use code splitting
- Lazy load components
- Optimize render cycles

## Security Practices
- Never store sensitive data client-side
- Use HTTPS
- Implement Content Security Policy
- Sanitize all user inputs

## Dependency Management
- Use exact versions in package.json
- Regular dependency updates
- Prefer lightweight libraries
- Evaluate performance impact of dependencies

## Error Handling
- Provide user-friendly error messages
- Log errors without exposing sensitive information
- Implement graceful degradation

## Accessibility Standards
- WCAG 2.1 AA compliance
- Support screen readers
- Keyboard navigation
- High color contrast

## Browser Compatibility
- Support last 2 versions of major browsers
- Provide fallback for older browsers
- Use feature detection over browser detection

## Continuous Integration
- Automated testing on every PR
- Lint and type-check
- Performance benchmarking
- Security vulnerability scanning

## Documentation
- JSDoc for function and class documentation
- README with setup instructions
- Inline comments for complex logic
- Keep documentation updated with code changes
