import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../hooks/useI18n';
import { useTheme } from '../hooks/useTheme';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import LoadingScreen from '../screens/auth/LoadingScreen';

// Main Screens
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import CustomersListScreen from '../screens/customers/CustomersListScreen';
import CustomerDetailsScreen from '../screens/customers/CustomerDetailsScreen';
import CustomerEditScreen from '../screens/customers/CustomerEditScreen';
import QuotesListScreen from '../screens/quotes/QuotesListScreen';
import QuoteDetailsScreen from '../screens/quotes/QuoteDetailsScreen';
import QuoteCreateScreen from '../screens/quotes/QuoteCreateScreen';
import CalendarScreen from '../screens/calendar/CalendarScreen';
import ScheduleDetailsScreen from '../screens/calendar/ScheduleDetailsScreen';
import PhotoCaptureScreen from '../screens/photos/PhotoCaptureScreen';
import PhotoGalleryScreen from '../screens/photos/PhotoGalleryScreen';
import SignatureScreen from '../screens/signature/SignatureScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator for main app flow
const MainTabNavigator: React.FC = () => {
  const { t } = useI18n();
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'home';

          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard';
              break;
            case 'Customers':
              iconName = 'people';
              break;
            case 'Quotes':
              iconName = 'description';
              break;
            case 'Calendar':
              iconName = 'event';
              break;
            case 'Settings':
              iconName = 'settings';
              break;
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
          paddingBottom: 8,
          paddingTop: 8,
          height: 68,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ tabBarLabel: t('nav.dashboard') }}
      />
      <Tab.Screen 
        name="Customers" 
        component={CustomersListScreen}
        options={{ tabBarLabel: t('nav.customers') }}
      />
      <Tab.Screen 
        name="Quotes" 
        component={QuotesListScreen}
        options={{ tabBarLabel: t('nav.quotes') }}
      />
      <Tab.Screen 
        name="Calendar" 
        component={CalendarScreen}
        options={{ tabBarLabel: 'Kalender' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ tabBarLabel: t('nav.settings') }}
      />
    </Tab.Navigator>
  );
};

// Main App Navigator
const AppNavigator: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { theme } = useTheme();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
        headerShadowVisible: true,
        animation: 'slide_from_right',
      }}
    >
      {!user ? (
        // Auth Stack
        <>
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        </>
      ) : (
        // Authenticated Stack
        <>
          <Stack.Screen 
            name="MainTabs" 
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
          
          {/* Customer Screens */}
          <Stack.Screen 
            name="CustomerDetails" 
            component={CustomerDetailsScreen}
            options={{ title: 'Kundendetails' }}
          />
          <Stack.Screen 
            name="CustomerEdit" 
            component={CustomerEditScreen}
            options={{ title: 'Kunde bearbeiten' }}
          />
          
          {/* Quote Screens */}
          <Stack.Screen 
            name="QuoteDetails" 
            component={QuoteDetailsScreen}
            options={{ title: 'Angebotsdetails' }}
          />
          <Stack.Screen 
            name="QuoteCreate" 
            component={QuoteCreateScreen}
            options={{ title: 'Angebot erstellen' }}
          />
          
          {/* Calendar Screens */}
          <Stack.Screen 
            name="ScheduleDetails" 
            component={ScheduleDetailsScreen}
            options={{ title: 'Termindetails' }}
          />
          
          {/* Photo Screens */}
          <Stack.Screen 
            name="PhotoCapture" 
            component={PhotoCaptureScreen}
            options={{ title: 'Foto aufnehmen' }}
          />
          <Stack.Screen 
            name="PhotoGallery" 
            component={PhotoGalleryScreen}
            options={{ title: 'Fotogalerie' }}
          />
          
          {/* Signature Screen */}
          <Stack.Screen 
            name="Signature" 
            component={SignatureScreen}
            options={{ title: 'Digitale Unterschrift' }}
          />
          
          {/* Profile Screen */}
          <Stack.Screen 
            name="Profile" 
            component={ProfileScreen}
            options={{ title: 'Profil' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;