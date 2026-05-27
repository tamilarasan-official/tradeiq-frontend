export type ScreenCategory =
  | 'Onboarding'
  | 'Auth'
  | 'Main'
  | 'Trading'
  | 'Portfolio'
  | 'Analytics'
  | 'Alerts'
  | 'Settings';

export type ScreenSpec = {
  id: number;
  name: string;
  route: string;
  category: ScreenCategory;
  summary: string;
  primaryMetric?: string;
  sections: string[];
  actions: string[];
  fields?: string[];
};
