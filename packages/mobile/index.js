import { AppRegistry } from 'react-native';
import notifee, { EventType } from '@notifee/react-native';
import App from './src/App';
import { name as appName } from './app.json';

// Register background event handler for notifications (must be before AppRegistry)
notifee.onBackgroundEvent(async ({ type, detail }) => {
  // Handle notification press in background/killed state
  if (type === EventType.PRESS) {
    // Navigation will be handled when App mounts and reads initial notification
    // No-op here — just acknowledge the event to prevent warnings
  }
});

AppRegistry.registerComponent(appName, () => App);
