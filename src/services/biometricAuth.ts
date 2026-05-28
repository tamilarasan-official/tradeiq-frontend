import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactNativeBiometrics from 'react-native-biometrics';

const biometricStorageKey = 'tradeiq.biometric.enabled';

export async function isBiometricLoginEnabled() {
  return (await AsyncStorage.getItem(biometricStorageKey)) === 'true';
}

export async function setBiometricLoginEnabled(enabled: boolean) {
  await AsyncStorage.setItem(biometricStorageKey, enabled ? 'true' : 'false');
}

export async function promptBiometricLogin(message = 'Verify to open TradeIQ') {
  const biometrics = new ReactNativeBiometrics();
  const availability = await biometrics.isSensorAvailable();

  if (!availability.available) {
    throw new Error('Biometric authentication is not available on this device');
  }

  const result = await biometrics.simplePrompt({
    promptMessage: message,
    cancelButtonText: 'Cancel',
  });

  return result.success;
}
