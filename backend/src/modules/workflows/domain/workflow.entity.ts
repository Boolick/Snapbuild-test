import { WorkflowNode } from './node.entity';
import { WorkflowEdge } from './edge.entity';

export class Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
  updatedAt: string;

  constructor(partial: Partial<Workflow>) {
    Object.assign(this, partial);
    this.nodes = (partial.nodes || []).map((n) => new WorkflowNode(n));
    this.edges = (partial.edges || []).map((e) => new WorkflowEdge(e));
    this.createdAt = this.createdAt || new Date().toISOString();
    this.updatedAt = this.updatedAt || new Date().toISOString();
  }
}
