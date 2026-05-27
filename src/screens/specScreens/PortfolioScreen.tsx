import React from 'react';
import { screenCatalog } from '../../data/screenCatalog';
import { BaseSpecScreen } from './BaseSpecScreen';
export const PortfolioScreen = (props: { onBack: () => void; onNavigate: (screenId: number) => void }) => <BaseSpecScreen screen={screenCatalog[10]} {...props} />;
