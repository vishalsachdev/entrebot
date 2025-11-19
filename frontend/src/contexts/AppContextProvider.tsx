import { type ReactNode } from 'react';
import { ProjectProvider } from './ProjectContext';
import { AgentProvider } from './AgentContext';
import { ProgressProvider } from './ProgressContext';

interface AppContextProviderProps {
    children: ReactNode;
}

export const AppContextProvider = ({ children }: AppContextProviderProps) => {
    return (
        <ProjectProvider>
            <AgentProvider>
                <ProgressProvider>
                    {children}
                </ProgressProvider>
            </AgentProvider>
        </ProjectProvider>
    );
};
