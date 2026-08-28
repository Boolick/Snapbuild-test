export const WORKFLOW_LIMITS = {
  MAX_TOTAL_NODES: 30,
  MAX_TOTAL_EDGES: 60,
  MAX_HEAVY_NODES: 10, // AI generation and editor nodes combined
  MAX_NODES_PER_TYPE: {
    prompt: 10,
    image_input: 10,
    generate_image: 6,
    edit_image: 6,
    result: 10,
  } as Record<string, number>,
};
