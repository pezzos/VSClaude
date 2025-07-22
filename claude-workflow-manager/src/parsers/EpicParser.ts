import { Epic, FileParseResult } from '../types';

export class EpicParser {
    parseEpic(content: string): FileParseResult<Epic> {
        try {
            const lines = content.split('\n');
            const epic: Partial<Epic> = {
                userStories: []
            };

            for (const line of lines) {
                const trimmedLine = line.trim();

                // Parse title from main header
                if (trimmedLine.startsWith('# Epic')) {
                    const match = trimmedLine.match(/# Epic #(\d+):\s*(.+)/);
                    if (match) {
                        epic.id = match[1];
                        epic.title = match[2].trim();
                    }
                }

                // Parse description section
                if (trimmedLine.startsWith('## Description')) {
                    // Description follows in subsequent lines
                    continue;
                } else if (trimmedLine && !trimmedLine.startsWith('#') && !epic.description && epic.id) {
                    epic.description = trimmedLine;
                } else if (epic.description && trimmedLine && !trimmedLine.startsWith('#')) {
                    epic.description += '\n' + trimmedLine;
                }
            }

            if (!epic.id || !epic.title) {
                return {
                    success: false,
                    error: 'Could not parse epic ID or title from PRD.md'
                };
            }

            // Default to in_progress since this is the current epic  
            epic.status = 'in_progress';
            epic.priority = 'medium';
            epic.dependencies = [];

            return {
                success: true,
                data: epic as Epic
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error parsing epic'
            };
        }
    }
}