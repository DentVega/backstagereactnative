/**
 * @format
 */

import React from 'react';
import {render, screen, userEvent} from '@testing-library/react-native';
import {ThemeProvider} from '@org/ui-kit';
import {HomeScreen} from '../src/screens/HomeScreen';
import {deriveCapabilities, useSession} from '../src/session/store';

// Minimal navigation mock; HomeScreen only uses navigation.navigate.
function makeNav(): {navigate: jest.Mock} {
  return {navigate: jest.fn()};
}

function renderHome(nav = makeNav()) {
  render(
    <ThemeProvider scheme="light">
      <HomeScreen
        navigation={nav as never}
        route={{key: 'Home', name: 'Home'} as never}
      />
    </ThemeProvider>,
  );
  return nav;
}

beforeEach(() => {
  useSession.getState().logout();
});

describe('deriveCapabilities', () => {
  it('grants scoped capabilities only when authenticated', () => {
    expect(deriveCapabilities(false)).toEqual([]);
    expect(deriveCapabilities(true)).toEqual(['accounts:read', 'session:whoami']);
  });
});

describe('HomeScreen', () => {
  it('renders the host header and a signed-out session', () => {
    renderHome();
    expect(screen.getByRole('header', {name: 'Backstage Host'})).toBeOnTheScreen();
    expect(screen.getByText('Sin sesión')).toBeOnTheScreen();
  });

  it('toggles the mock session', async () => {
    const user = userEvent.setup();
    renderHome();
    await user.press(screen.getByRole('button', {name: 'Iniciar sesión'}));
    expect(screen.getByText('Autenticado (mock)')).toBeOnTheScreen();
  });

  it('navigates to the miniapp when opened', async () => {
    const user = userEvent.setup();
    const nav = renderHome();
    await user.press(screen.getByRole('button', {name: 'Abrir miniapp'}));
    expect(nav.navigate).toHaveBeenCalledWith('Miniapp', {
      id: 'account_dashboard',
      title: 'Account Dashboard',
    });
  });
});
