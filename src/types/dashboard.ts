export type Plugin = {
  slug: string;
  name: string;
  short_description?: string;
  platform?: string[];
};

export type PluginVersion = {
  id: string;
  version: string;
  created_at: Date;
}; 