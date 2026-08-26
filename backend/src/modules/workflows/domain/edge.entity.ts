export class WorkflowEdge {
  id: string;
  source: string;
  sourceHandle?: string;
  target: string;
  targetHandle?: string;

  constructor(partial: Partial<WorkflowEdge>) {
    Object.assign(this, partial);
  }
}
