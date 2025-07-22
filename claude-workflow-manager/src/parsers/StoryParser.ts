import { Story, Ticket, FileParseResult } from '../types';

export class StoryParser {
    parseStories(content: string): FileParseResult<Story[]> {
        try {
            const stories: Story[] = [];
            const lines = content.split('\n');
            let currentStory: Partial<Story> | null = null;
            let inStorySection = false;

            for (const line of lines) {
                const trimmedLine = line.trim();

                // Start of story section
                if (trimmedLine.startsWith('## Story')) {
                    if (currentStory && currentStory.id && currentStory.title) {
                        stories.push(currentStory as Story);
                    }
                    
                    // Extract story info from header
                    const match = trimmedLine.match(/## Story #(\d+):\s*(.+?)(?:\s*\[(P[0-3])\])?/);
                    if (match) {
                        currentStory = {
                            id: match[1],
                            title: match[2].trim(),
                            priority: (match[3] as 'P0' | 'P1' | 'P2' | 'P3') || 'P2',
                            status: 'planned',
                            tickets: [],
                            epicId: '' // Will be set by caller
                        };
                        inStorySection = true;
                    }
                } else if (currentStory && inStorySection) {
                    // Parse description
                    if (trimmedLine.startsWith('**Description:**')) {
                        currentStory.description = trimmedLine.replace('**Description:**', '').trim();
                    } else if (trimmedLine.startsWith('### Tasks') || trimmedLine.startsWith('### Tickets')) {
                        // Start parsing tickets/tasks
                        continue;
                    } else if (trimmedLine.startsWith('- [ ]') || trimmedLine.startsWith('- [x]')) {
                        // Parse ticket from checkbox
                        const isCompleted = trimmedLine.startsWith('- [x]');
                        const ticketTitle = trimmedLine.replace(/^- \[[x ]\]\s*/, '').trim();
                        
                        if (ticketTitle) {
                            const ticket: Ticket = {
                                id: `${currentStory.id}-${(currentStory.tickets?.length || 0) + 1}`,
                                title: ticketTitle,
                                status: isCompleted ? 'completed' : 'planned',
                                storyId: currentStory.id!
                            };
                            currentStory.tickets = currentStory.tickets || [];
                            currentStory.tickets.push(ticket);
                        }
                    } else if (trimmedLine && !trimmedLine.startsWith('##') && !trimmedLine.startsWith('**')) {
                        // Additional description lines
                        if (!currentStory.description) {
                            currentStory.description = trimmedLine;
                        } else if (!trimmedLine.startsWith('###')) {
                            currentStory.description += '\n' + trimmedLine;
                        }
                    } else if (trimmedLine.startsWith('##')) {
                        // New story section
                        inStorySection = false;
                    }
                }
            }

            // Add the last story
            if (currentStory && currentStory.id && currentStory.title) {
                stories.push(currentStory as Story);
            }

            return {
                success: true,
                data: stories
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error parsing stories'
            };
        }
    }

    parseStory(content: string): FileParseResult<Story> {
        const storiesResult = this.parseStories(content);
        if (storiesResult.success && storiesResult.data && storiesResult.data.length > 0) {
            return {
                success: true,
                data: storiesResult.data[0]
            };
        }

        return {
            success: false,
            error: storiesResult.error || 'No story found in content'
        };
    }
}