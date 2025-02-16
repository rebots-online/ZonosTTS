import React, { Suspense } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { lazyRoute } from '../utils/lazyImport';
import LoadingScreen from '../components/LoadingScreen';

const Stack = createStackNavigator();

// Lazy load route components
const Home = lazyRoute('Home');
const TextToSpeech = lazyRoute('TextToSpeech');
const Settings = lazyRoute('Settings');
const BillingPlans = lazyRoute('BillingPlans');
const Profile = lazyRoute('Profile');

// Preload critical routes
const preloadCriticalRoutes = () => {
  const routes = ['Home', 'TextToSpeech'];
  routes.forEach(route => {
    const Component = lazyRoute(route);
    Component.preload?.();
  });
};

// Start preloading after initial render
if (typeof window !== 'undefined') {
  window.requestIdleCallback?.(preloadCriticalRoutes) || 
  setTimeout(preloadCriticalRoutes, 1000);
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Suspense fallback={<LoadingScreen />}>
        <Stack.Navigator>
          <Stack.Screen
            name="Home"
            component={Home}
            options={{ title: 'ZonosTTS' }}
          />
          <Stack.Screen
            name="TextToSpeech"
            component={TextToSpeech}
            options={{ title: 'Text to Speech' }}
          />
          <Stack.Screen
            name="Settings"
            component={Settings}
            options={{ title: 'Settings' }}
          />
          <Stack.Screen
            name="BillingPlans"
            component={BillingPlans}
            options={{ title: 'Subscription Plans' }}
          />
          <Stack.Screen
            name="Profile"
            component={Profile}
            options={{ title: 'Profile' }}
          />
        </Stack.Navigator>
      </Suspense>
    </NavigationContainer>
  );
}
