import { Epic, FileParseResult } from '../types';

export class ProjectParser {
    parseEpics(content: string): FileParseResult<Epic[]> {
        try {
            const epics: Epic[] = [];
            const lines = content.split('\n');
            let currentEpic: Partial<Epic> | null = null;
            let inEpicSection = false;

            for (const line of lines) {
                const trimmedLine = line.trim();

                // Start of epic section
                if (trimmedLine.startsWith('## Epic')) {
                    if (currentEpic && currentEpic.id && currentEpic.title) {
                        epics.push(currentEpic as Epic);
                    }
                    
                    // Extract epic info from header
                    const match = trimmedLine.match(/## Epic #(\d+):\s*(.+?)(?:\s*\[(.*?)\])?$/);
                    if (match) {
                        currentEpic = {
                            id: match[1],
                            title: match[2].trim(),
                            status: this.parseStatus(match[3]),
                            stories: []
                        };
                        inEpicSection = true;
                    }
                } else if (currentEpic && inEpicSection) {
                    // Parse description lines
                    if (trimmedLine.startsWith('**Description:**')) {
                        currentEpic.description = trimmedLine.replace('**Description:**', '').trim();
                    } else if (trimmedLine && !trimmedLine.startsWith('##') && !trimmedLine.startsWith('**')) {
                        // Additional description lines
                        currentEpic.description = (currentEpic.description || '') + '\n' + trimmedLine;
                    } else if (trimmedLine.startsWith('##')) {
                        // New section, not part of current epic
                        inEpicSection = false;
                    }
                }
            }

            // Add the last epic
            if (currentEpic && currentEpic.id && currentEpic.title) {
                epics.push(currentEpic as Epic);
            }

            return {
                success: true,
                data: epics
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error parsing epics'
            };
        }
    }

    private parseStatus(statusStr?: string): 'planned' | 'active' | 'completed' {
        if (!statusStr) return 'planned';
        
        const status = statusStr.toLowerCase().trim();
        switch (status) {
            case 'active':
            case 'in progress':
            case 'current':
                return 'active';
            case 'completed':
            case 'done':
            case 'finished':
                return 'completed';
            default:
                return 'planned';
        }
    }
}