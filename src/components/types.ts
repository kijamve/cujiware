export interface Plugin {
  name: string;
  slug: string;
  short_description: string;
  icon: string;
  category: string;
  countries: string[];
  countrie_exclude?: string[];
  last_version: string;
  platform: string[];
  large_description?: string;
}