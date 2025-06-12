import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from 'react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ThemeProvider } from './src/contexts/ThemeContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { I18nProvider } from './src/contexts/I18nContext';
import { SyncProvider } from './src/contexts/SyncContext';
import AppNavigator from './src/navigation/AppNavigator';
import { useTheme } from './src/hooks/useTheme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

const AppContent: React.FC = () => {
  const { theme, isDarkMode } = useTheme();

  return (
    <PaperProvider theme={theme}>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.surface}
      />
      <NavigationContainer theme={theme}>
        <AppNavigator />
      </NavigationContainer>
    </PaperProvider>
  );
};

const App: React.FC = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <I18nProvider>
              <AuthProvider>
                <SyncProvider>
                  <AppContent />
                </SyncProvider>
              </AuthProvider>
            </I18nProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;