declare module '@/amplify_outputs.json' {
  const value: {
    version: string;
    storage: Record<string, any>;
    api: Record<string, any>;
    auth: Record<string, any>;
    custom: {
      API: Record<string, any>;
    };
  };
  export default value;
}
