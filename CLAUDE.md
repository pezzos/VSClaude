# Claude Code Project Instructions

## Project: VSClaude

This file contains project-specific instructions for Claude Code to ensure consistent development practices and workflow adherence.

## Project Context

**Type**: General Development Project
**Initialized**: 2025-07-19
**Workflow**: Claude Code Agile Methodology

## Development Standards

### Code Quality
- Follow existing code conventions when found
- Maintain consistent formatting and style
- Use descriptive variable and function names
- Add inline comments for complex logic only

### File Organization
- Keep related files grouped logically
- Use meaningful directory structures
- Follow established naming conventions
- Maintain clean project root

### Testing Requirements
- Write tests for new functionality
- Ensure existing tests continue to pass
- Target 80% code coverage minimum
- Document test scenarios clearly

## Workflow Commands Available

### Epic Management
- `/project:agile:start [description]` - Initialize new epic
- `/project:agile:design` - Create architecture design
- `/project:agile:plan` - Generate implementation plan
- `/project:agile:iterate` - Execute development iterations
- `/project:agile:ship` - Finalize and release

### Project Setup
- `/project:init [description]` - Initialize project structure
- `/start --next-epic` - Begin next epic

## Documentation Structure

```
docs/
├── 1-project/          # Project vision, roadmap, requirements
├── 2-current-epic/     # Active epic documentation
├── 3-current-task/     # Current task details and progress
└── archive/           # Completed epic backups
```

## Quality Gates

### Before Implementation
- [ ] Requirements clearly defined
- [ ] Architecture designed
- [ ] Tasks planned and prioritized
- [ ] Dependencies identified

### During Development
- [ ] Code follows project standards
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] Progress tracked in TODO.md

### Before Release
- [ ] All planned features implemented
- [ ] Quality metrics met
- [ ] Documentation complete
- [ ] Deployment verified

## Project-Specific Notes

*Add any project-specific conventions, requirements, or special considerations here as the project evolves.*

---

*This file should be updated as project requirements and conventions evolve.*