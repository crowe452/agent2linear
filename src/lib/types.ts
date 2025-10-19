export interface Config {
  apiKey?: string;
  defaultInitiative?: string;
  defaultTeam?: string;
}

export interface ConfigLocation {
  type: 'global' | 'project' | 'env' | 'none';
  path?: string;
}

export interface ResolvedConfig extends Config {
  locations: {
    apiKey: ConfigLocation;
    defaultInitiative: ConfigLocation;
    defaultTeam: ConfigLocation;
  };
}
