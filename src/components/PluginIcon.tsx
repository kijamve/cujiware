import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface PluginIconProps {
  iconName: string;
}

export function PluginIcon({ iconName }: PluginIconProps) {
  const IconComponent = Icons[iconName as keyof typeof Icons] as LucideIcon;
  return IconComponent ? <IconComponent className="w-6 h-6 text-cuji-blue" /> : null;
}