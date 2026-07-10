import React from 'react';
import {SafeAreaView, StyleSheet, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AppText, Box, Button, Card, useTheme} from '@org/ui-kit';
import type {MiniappId} from '@org/miniapp-contract';
import type {RootStackParamList} from '../navigation';
import {useSession} from '../session/store';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const ACCOUNT_DASHBOARD = 'account_dashboard' as MiniappId;

export function HomeScreen({navigation}: Props): React.JSX.Element {
  const theme = useTheme();
  const {isAuthenticated, login, logout} = useSession();

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: theme.colors.background}}>
      <Box padding="xl" gap="lg" style={styles.fill}>
        <AppText variant="heading" accessibilityRole="header">
          Backstage Host
        </AppText>

        <Card>
          <AppText variant="caption" color="textMuted">
            Sesión
          </AppText>
          <View style={styles.spacer} />
          <AppText variant="body">
            {isAuthenticated ? 'Autenticado (mock)' : 'Sin sesión'}
          </AppText>
          <View style={styles.spacer} />
          <Button
            label={isAuthenticated ? 'Cerrar sesión' : 'Iniciar sesión'}
            variant={isAuthenticated ? 'danger' : 'primary'}
            onPress={isAuthenticated ? logout : login}
          />
        </Card>

        <Card>
          <AppText variant="title">Account Dashboard</AppText>
          <View style={styles.spacer} />
          <AppText variant="body" color="textMuted">
            Miniapp federada. Se descarga y monta bajo demanda.
          </AppText>
          <View style={styles.spacer} />
          <Button
            label="Abrir miniapp"
            onPress={() =>
              navigation.navigate('Miniapp', {
                id: ACCOUNT_DASHBOARD,
                title: 'Account Dashboard',
              })
            }
          />
        </Card>
      </Box>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: {flex: 1},
  spacer: {height: 8},
});
