import React from 'react';
import { WorkflowEditorPage } from '../pages/workflow-editor';
import { AppProviders } from './providers';

export const App: React.FC = () => {
  return (
    <AppProviders>
      <WorkflowEditorPage />
    </AppProviders>
  );
};
