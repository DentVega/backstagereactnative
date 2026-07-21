import React from 'react';
import {Text} from 'react-native';
import {render, screen} from '@testing-library/react-native';
import {ThemeProvider} from '@dentvega/ui-kit';
import type {
  CapabilityGrant,
  Manifest,
  MiniappId,
  ResolveResponse,
  SemVer,
} from '@dentvega/miniapp-contract';
import {MiniappHost} from '../MiniappHost';
import type {ResolveClient} from '../ResolveClient';
import type {ChunkLoader, EntryComponent} from '../ChunkLoader';
import type {HostProvided} from '../evaluate';

const ID = 'account_dashboard' as MiniappId;

const hostProvided: HostProvided = {
  react: '18.3.1' as SemVer,
  'react-native': '0.76.6' as SemVer,
};

const grant: CapabilityGrant = {
  granted: ['accounts:read'],
  isRevoked: () => false,
};

function manifest(shared: Manifest['shared']): Manifest {
  return {
    id: ID,
    version: '0.1.0' as SemVer,
    entry: './Entry',
    shared,
    capabilities: ['accounts:read'],
  };
}

function resolvedWith(m: unknown): ResolveResponse {
  return {
    id: ID,
    version: '0.1.0' as SemVer,
    url: 'http://h/chunk',
    manifest: m as Manifest,
  };
}

const compatibleShared = [
  {name: 'react-native', requiredRange: '^0.76.0', singleton: true},
];

function mockResolve(resp: ResolveResponse | Error): ResolveClient {
  return {
    resolve: async () => {
      if (resp instanceof Error) throw resp;
      return resp;
    },
  };
}

const FakeEntry: EntryComponent = ({capabilities}) => (
  <Text>montada: {capabilities.granted.join(',')}</Text>
);

const mockChunk: ChunkLoader = {load: async () => FakeEntry};

function renderHost(client: ResolveClient, loader: ChunkLoader = mockChunk) {
  render(
    <ThemeProvider scheme="light">
      <MiniappHost
        id={ID}
        resolveClient={client}
        chunkLoader={loader}
        hostProvided={hostProvided}
        capabilities={grant}
      />
    </ThemeProvider>,
  );
}

describe('MiniappHost', () => {
  it('mounts the remote Entry on the happy path with scoped capabilities', async () => {
    renderHost(mockResolve(resolvedWith(manifest(compatibleShared))));
    expect(
      await screen.findByText(/montada: accounts:read/),
    ).toBeOnTheScreen();
  });

  it('falls back when resolve fails (no crash)', async () => {
    renderHost(mockResolve(new Error('resolve failed: HTTP 404')));
    expect(await screen.findByText(/No pudimos localizar/)).toBeOnTheScreen();
    expect(screen.getByRole('header', {name: 'Miniapp no disponible'})).toBeOnTheScreen();
  });

  it('falls back on an invalid manifest', async () => {
    renderHost(mockResolve(resolvedWith({nope: true})));
    expect(await screen.findByText(/manifiesto inválido/)).toBeOnTheScreen();
  });

  it('falls back on singleton skew', async () => {
    const skewed = manifest([
      {name: 'react-native', requiredRange: '^0.80.0', singleton: true},
    ]);
    renderHost(mockResolve(resolvedWith(skewed)));
    expect(await screen.findByText(/no es compatible/)).toBeOnTheScreen();
  });

  it('falls back when the chunk download throws', async () => {
    const failingLoader: ChunkLoader = {
      load: async () => {
        throw new Error('boom');
      },
    };
    renderHost(mockResolve(resolvedWith(manifest(compatibleShared))), failingLoader);
    expect(await screen.findByText(/No pudimos descargar/)).toBeOnTheScreen();
  });
});
