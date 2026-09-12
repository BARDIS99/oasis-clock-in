export function collectRoutePathsFromTree(tree: any): string[] {
  return [];
}

export function installPreviewHostBridge(_opts: {
  navigate: (path: string) => void;
  getRoutePaths: () => string[];
}): () => void {
  return () => {};
}
