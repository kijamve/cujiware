export interface Plugin {
  name: string;
  slug: string;
  short_description: string;
  icon: string;
  category: string;
  countries: string[];
  countrie_exclude?: string[];
  platform: string[];
  featured?: boolean;
}