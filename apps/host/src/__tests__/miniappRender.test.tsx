import React from 'react';
import {Text} from 'react-native';
import {fireEvent, render, screen} from '@testing-library/react-native';
import {ThemeProvider} from '@dentvega/ui-kit';
import {
  MiniappHost,
  type ChunkLoader,
  type EntryComponent,
  type HostProvided,
  type ResolveClient,
} from '@dentvega/miniapp-runtime';
import type {
  CapabilityGrant,
  Manifest,
  MiniappId,
  ResolveResponse,
  SemVer,
} from '@dentvega/miniapp-contract';
import {miniappRender} from '../miniappRender';

const ID = 'account_dashboard' as MiniappId;
const hostProvided: HostProvided = {
  react: '18.3.1' as SemVer,
  'react-native': '0.76.6' as SemVer,
};
const grant: CapabilityGrant = {granted: ['accounts:read'], isRevoked: () => false};

function manifest(range: string): Manifest {
  return {
    id: ID,
    version: '0.1.0' as SemVer,
    entry: './Entry',
    shared: [{name: 'react-native', requiredRange: range, singleton: true}],
    capabilities: ['accounts:read'],
  };
}
function resolvedWith(m: Manifest): ResolveResponse {
  return {id: ID, version: '0.1.0' as SemVer, url: 'http://h/chunk', manifest: m};
}
function flakyResolve(failures: number, resp: ResolveResponse): ResolveClient {
  let n = 0;
  return {
    resolve: async () => {
      if (n++ < failures) throw new Error('resolve failed: transient');
      return resp;
    },
  };
}
const FakeEntry: EntryComponent = () => <Text>montada</Text>;
const mockChunk: ChunkLoader = {load: async () => FakeEntry};

function renderHost(client: ResolveClient) {
  render(
    <ThemeProvider scheme="light">
      <MiniappHost
        id={ID}
        resolveClient={client}
        chunkLoader={mockChunk}
        hostProvided={hostProvided}
        capabilities={grant}
        retry={{backoffMs: 0}}
        render={miniappRender}
      />
    </ThemeProvider>,
  );
}

describe('miniappRender (UI del host inyectada en MiniappHost)', () => {
  it('falla retryable → copy en español + Reintentar', async () => {
    renderHost(flakyResolve(99, resolvedWith(manifest('^0.76.0'))));
    expect(await screen.findByText(/No pudimos localizar/)).toBeOnTheScreen();
    expect(screen.getByRole('header', {name: 'Miniapp no disponible'})).toBeOnTheScreen();
    expect(screen.getByText('Reintentar')).toBeOnTheScreen();
  });

  it('skew → copy de incompatibilidad, sin Reintentar', async () => {
    renderHost(flakyResolve(0, resolvedWith(manifest('^0.99.0'))));
    expect(await screen.findByText(/no es compatible/)).toBeOnTheScreen();
    expect(screen.queryByText('Reintentar')).toBeNull();
  });

  it('Reintentar recarga y monta', async () => {
    renderHost(flakyResolve(2, resolvedWith(manifest('^0.76.0'))));
    fireEvent.press(await screen.findByText('Reintentar'));
    expect(await screen.findByText('montada')).toBeOnTheScreen();
  });

  it('loading con el testID del host', () => {
    renderHost({resolve: () => new Promise(() => {})});
    expect(screen.getByTestId('miniapp-loading')).toBeOnTheScreen();
  });
});
