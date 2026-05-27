import type { ComponentType } from 'react';
import { SplashScreen } from './SplashScreen';
import { OnboardingCarouselScreen } from './OnboardingCarouselScreen';
import { ResearchConsentScreen } from './ResearchConsentScreen';
import { RegisterScreen } from './RegisterScreen';
import { LoginScreen } from './LoginScreen';
import { OtpVerificationScreen } from './OtpVerificationScreen';
import { KycUploadScreen } from './KycUploadScreen';
import { BiometricSetupScreen } from './BiometricSetupScreen';
import { HomeScreen } from './HomeScreen';
import { MarketsScreen } from './MarketsScreen';
import { PortfolioScreen } from './PortfolioScreen';
import { OrdersScreen } from './OrdersScreen';
import { ProfileScreen } from './ProfileScreen';
import { StockSearchScreen } from './StockSearchScreen';
import { StockDetailScreen } from './StockDetailScreen';
import { BuyOrderScreen } from './BuyOrderScreen';
import { SellOrderScreen } from './SellOrderScreen';
import { OrderPreviewScreen } from './OrderPreviewScreen';
import { OrderResultScreen } from './OrderResultScreen';
import { HoldingsScreen } from './HoldingsScreen';
import { PnlAnalysisScreen } from './PnlAnalysisScreen';
import { BenchmarkScreen } from './BenchmarkScreen';
import { DiversificationScreen } from './DiversificationScreen';
import { BehaviourStatsScreen } from './BehaviourStatsScreen';
import { ComparisonReportScreen } from './ComparisonReportScreen';
import { StudyProgressScreen } from './StudyProgressScreen';
import { PriceAlertsScreen } from './PriceAlertsScreen';
import { NotificationCentreScreen } from './NotificationCentreScreen';
import { AccountSettingsScreen } from './AccountSettingsScreen';
import { SecuritySettingsScreen } from './SecuritySettingsScreen';
import { ResearchSettingsScreen } from './ResearchSettingsScreen';

type ScreenProps = {
  onBack: () => void;
  onNavigate: (screenId: number) => void;
  onLogout: () => void;
};

export const screenRegistry: Record<number, ComponentType<ScreenProps>> = {
  1: SplashScreen,
  2: OnboardingCarouselScreen,
  3: ResearchConsentScreen,
  4: RegisterScreen,
  5: LoginScreen,
  6: OtpVerificationScreen,
  7: KycUploadScreen,
  8: BiometricSetupScreen,
  9: HomeScreen,
  10: MarketsScreen,
  11: PortfolioScreen,
  12: OrdersScreen,
  13: ProfileScreen,
  14: StockSearchScreen,
  15: StockDetailScreen,
  16: BuyOrderScreen,
  17: SellOrderScreen,
  18: OrderPreviewScreen,
  19: OrderResultScreen,
  20: HoldingsScreen,
  21: PnlAnalysisScreen,
  22: BenchmarkScreen,
  23: DiversificationScreen,
  24: BehaviourStatsScreen,
  25: ComparisonReportScreen,
  26: StudyProgressScreen,
  27: PriceAlertsScreen,
  28: NotificationCentreScreen,
  29: AccountSettingsScreen,
  30: SecuritySettingsScreen,
  31: ResearchSettingsScreen,
};
