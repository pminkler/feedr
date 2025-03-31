declare module '@/amplify_outputs.json' {
  const value: {
    version: string;
    storage: Record<string, unknown>;
    api: Record<string, unknown>;
    auth: Record<string, unknown>;
    custom: {
      API: Record<string, unknown>;
    };
  };
  export default value;
}
