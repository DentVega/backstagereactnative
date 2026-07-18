/**
 * @format
 */

import React from 'react';
import {render, screen, userEvent} from '@testing-library/react-native';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {ThemeProvider} from '@org/ui-kit';
import {HomeScreen} from '../src/screens/HomeScreen';
import {deriveCapabilities, useSession} from '../src/session/store';

// FlashList needs a measured layout to render items, which jsdom/jest doesn't
// provide — mock it with a plain list that renders header + every item + empty.
jest.mock('@shopify/flash-list', () => {
  const R = require('react');
  const {View} = require('react-native');
  const slot = (c: unknown): unknown =>
    c == null ? null : typeof c === 'function' ? R.createElement(c) : c;
  type MockProps = {
    data?: readonly unknown[];
    renderItem: (info: {item: unknown; index: number}) => unknown;
    keyExtractor?: (item: unknown, index: number) => string;
    ListHeaderComponent?: unknown;
    ListEmptyComponent?: unknown;
  };
  return {
    FlashList: (props: MockProps) =>
      R.createElement(
        View,
        null,
        slot(props.ListHeaderComponent),
        props.data && props.data.length
          ? props.data.map((item, index) =>
              R.createElement(
                View,
                {key: props.keyExtractor ? props.keyExtractor(item, index) : String(index)},
                props.renderItem({item, index}),
              ),
            )
          : slot(props.ListEmptyComponent),
      ),
  };
});

const CATALOG = [
  {
    id: 'account_dashboard',
    name: 'Account Dashboard',
    owner: 'payments-team',
    latestVersion: '0.5.0',
    versionCount: 2,
  },
  {id: 'cards_wallet', name: 'Cards Wallet', owner: 'cards-team', latestVersion: null, versionCount: 0},
];

function mockCatalog(miniapps: unknown[] = CATALOG): void {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({miniapps}),
  }) as unknown as typeof fetch;
}

function makeNav(): {navigate: jest.Mock} {
  return {navigate: jest.fn()};
}

function renderHome(nav = makeNav()) {
  const qc = new QueryClient({defaultOptions: {queries: {retry: false}}});
  render(
    <QueryClientProvider client={qc}>
      <ThemeProvider scheme="light">
        <HomeScreen
          navigation={nav as never}
          route={{key: 'Home', name: 'Home'} as never}
        />
      </ThemeProvider>
    </QueryClientProvider>,
  );
  return nav;
}

beforeEach(() => {
  useSession.getState().logout();
  mockCatalog();
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

  it('lists the catalog from Backstage', async () => {
    renderHome();
    expect(await screen.findByText('Account Dashboard')).toBeOnTheScreen();
    expect(screen.getByText('Cards Wallet')).toBeOnTheScreen();
    // A miniapp with no published version is flagged and cannot be opened.
    expect(screen.getByText('Sin versión publicada')).toBeOnTheScreen();
  });

  it('opens a published miniapp by id', async () => {
    const user = userEvent.setup();
    const nav = renderHome();
    await screen.findByText('Account Dashboard');
    // The first "Abrir miniapp" belongs to the published account_dashboard.
    await user.press(screen.getAllByRole('button', {name: 'Abrir miniapp'})[0]);
    expect(nav.navigate).toHaveBeenCalledWith('Miniapp', {
      id: 'account_dashboard',
      title: 'Account Dashboard',
    });
  });
});
