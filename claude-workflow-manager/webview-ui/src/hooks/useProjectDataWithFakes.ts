import { useState, useEffect } from 'react';
import { isBrowserDev, getEnvironmentInfo } from '../utils/environment';
import { useProjectData as useRealProjectData } from './useProjectState';
import { 
    createFakeProjectState, 
    createFakeLogs, 
    createFakeStats 
} from '../mocks/fakeData';

/**
 * Hook that provides either real VSCode data or fake data for browser development
 */
export function useProjectData() {
    const realProjectData = useRealProjectData();
    const [isUsingFakeData] = useState(isBrowserDev());

    // Environment info available via getEnvironmentInfo() if needed
    // Removed console logging to reduce VSCode console clutter

    // Return fake data for browser development
    if (isUsingFakeData) {
        return {
            projectState: createFakeProjectState(),
            stats: createFakeStats(),
            progress: {
                epics: 0, // 0/2 completed
                stories: 0, // 0/3 completed  
                tickets: 20 // 1/5 completed
            },
            isLoading: false,
            error: null,
            initInProgress: false,
            initLogs: createFakeLogs(),
            streamingCommandId: null,
            clearInitLogs: () => {}, // No-op for fake data
            canImportFeedback: true,
            canPlanEpics: true
        };
    }

    // Return real data for VSCode webview
    return realProjectData;
}