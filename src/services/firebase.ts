import auth from '@react-native-firebase/auth';
import messaging from '@react-native-firebase/messaging';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import { logResearchEvent } from './api';

const webClientId =
  '274440438205-2c5k5qt08od2a4burr9ua71h75ln59rf.apps.googleusercontent.com';

let configured = false;

function configureGoogleSignIn() {
  if (configured) {
    return;
  }

  GoogleSignin.configure({
    webClientId,
    offlineAccess: false,
  });
  configured = true;
}

export async function signInWithGoogle() {
  if (!webClientId) {
    throw new Error(
      'Google Sign-In needs Firebase Web Client ID. Add SHA-1/SHA-256 in Firebase and set webClientId in src/services/firebase.ts.',
    );
  }

  configureGoogleSignIn();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const signInResult = await GoogleSignin.signIn();
  const idToken = signInResult.data?.idToken;

  if (!idToken) {
    throw new Error('Google Sign-In did not return an idToken.');
  }

  const credential = auth.GoogleAuthProvider.credential(idToken);
  return auth().signInWithCredential(credential);
}

export async function registerFcmToken() {
  if (Platform.OS === 'ios') {
    await messaging().registerDeviceForRemoteMessages();
  }

  const permission = await messaging().requestPermission();
  const enabled =
    permission === messaging.AuthorizationStatus.AUTHORIZED ||
    permission === messaging.AuthorizationStatus.PROVISIONAL;

  if (!enabled) {
    throw new Error('Push notification permission was not granted.');
  }

  const token = await messaging().getToken();
  await logResearchEvent('FCM_TOKEN_REGISTERED', {
    token,
    platform: Platform.OS,
  });

  return token;
}
