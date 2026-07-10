/**
 * Host app — Bolt 4 (Host Runtime + Integration).
 *
 * Providers (React Query singleton + Theme + Navigation) wrap a native stack:
 * Home (session toggle + open miniapp) → Miniapp (resolves account_dashboard
 * from Backstage, downloads the federated chunk, verifies, mounts ./Entry with
 * scoped capabilities, or shows a graceful fallback).
 *
 * @format
 */

import React from 'react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {ThemeProvider} from '@org/ui-kit';
import type {RootStackParamList} from './src/navigation';
import {HomeScreen} from './src/screens/HomeScreen';
import {MiniappScreen} from './src/screens/MiniappScreen';

const queryClient = new QueryClient();
const Stack = createNativeStackNavigator<RootStackParamList>();

function App(): React.JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{title: 'Backstage'}}
            />
            <Stack.Screen
              name="Miniapp"
              component={MiniappScreen}
              options={({route}) => ({title: route.params.title})}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
