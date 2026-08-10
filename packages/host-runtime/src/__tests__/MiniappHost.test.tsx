import React from 'react';
import {Text} from 'react-native';
import {fireEvent, render, screen} from '@testing-library/react-native';
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
import type {MetricsClient, MetricEvent} from '../MetricsClient';
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

function recordingMetrics(): {client: MetricsClient; events: MetricEvent[]} {
  const events: MetricEvent[] = [];
  return {client: {track: e => events.push(e)}, events};
}

function renderHost(
  client: ResolveClient,
  loader: ChunkLoader = mockChunk,
  metrics?: MetricsClient,
) {
  render(
    <ThemeProvider scheme="light">
      <MiniappHost
        id={ID}
        resolveClient={client}
        chunkLoader={loader}
        hostProvided={hostProvided}
        capabilities={grant}
        metrics={metrics}
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

  it('reporta un mount a métricas en el happy path', async () => {
    const m = recordingMetrics();
    renderHost(mockResolve(resolvedWith(manifest(compatibleShared))), mockChunk, m.client);
    await screen.findByText(/montada:/);
    expect(m.events).toContainEqual({type: 'mount', id: ID, version: '0.1.0'});
  });

  it('reporta un fallback a métricas con la razón', async () => {
    const m = recordingMetrics();
    const skewed = manifest([
      {name: 'react-native', requiredRange: '^0.80.0', singleton: true},
    ]);
    renderHost(mockResolve(resolvedWith(skewed)), mockChunk, m.client);
    await screen.findByText(/no es compatible/);
    expect(m.events).toContainEqual({type: 'fallback', id: ID, reason: 'skew'});
  });
});

/** Falla las primeras `failures` llamadas a resolve, después devuelve `resp`. */
function flakyResolve(failures: number, resp: ResolveResponse): ResolveClient {
  let n = 0;
  return {
    resolve: async () => {
      if (n++ < failures) throw new Error('resolve failed: transient');
      return resp;
    },
  };
}

function renderRetry(client: ResolveClient, loader: ChunkLoader = mockChunk) {
  render(
    <ThemeProvider scheme="light">
      <MiniappHost
        id={ID}
        resolveClient={client}
        chunkLoader={loader}
        hostProvided={hostProvided}
        capabilities={grant}
        retry={{backoffMs: 0}}
      />
    </ThemeProvider>,
  );
}

describe('MiniappHost — retry UX', () => {
  it('auto-retry: resuelve tras 1 falla transitoria, sin fallback', async () => {
    renderRetry(flakyResolve(1, resolvedWith(manifest(compatibleShared))));
    expect(await screen.findByText(/montada: accounts:read/)).toBeOnTheScreen();
    expect(screen.queryByText('Miniapp no disponible')).toBeNull();
  });

  it('falla retryable persistente → fallback + botón Reintentar', async () => {
    renderRetry(mockResolve(new Error('resolve failed: down')));
    expect(await screen.findByText(/No pudimos localizar/)).toBeOnTheScreen();
    expect(screen.getByText('Reintentar')).toBeOnTheScreen();
  });

  it('falla permanente (skew) → fallback SIN botón Reintentar', async () => {
    const skewed = manifest([
      {name: 'react-native', requiredRange: '^0.99.0', singleton: true},
    ]);
    renderRetry(mockResolve(resolvedWith(skewed)));
    expect(await screen.findByText(/no es compatible/)).toBeOnTheScreen();
    expect(screen.queryByText('Reintentar')).toBeNull();
  });

  it('Reintentar (manual) re-carga y monta', async () => {
    // 2 fallas (inicial + 1 auto-retry) → fallback; el manual arranca budget fresco y monta.
    renderRetry(flakyResolve(2, resolvedWith(manifest(compatibleShared))));
    fireEvent.press(await screen.findByText('Reintentar'));
    expect(await screen.findByText(/montada: accounts:read/)).toBeOnTheScreen();
  });

  it('host-too-old → fallback SIN botón Reintentar', async () => {
    const m = {
      ...manifest(compatibleShared),
      minHostContract: {reactNative: '0.76.0', contractVersion: '0.2.0'},
    };
    render(
      <ThemeProvider scheme="light">
        <MiniappHost
          id={ID}
          resolveClient={mockResolve(resolvedWith(m))}
          chunkLoader={mockChunk}
          hostProvided={hostProvided}
          capabilities={grant}
          hostContractVersion="0.1.0"
          retry={{backoffMs: 0}}
        />
      </ThemeProvider>,
    );
    expect(await screen.findByText(/Actualizá la app/)).toBeOnTheScreen();
    expect(screen.queryByText('Reintentar')).toBeNull();
  });
});
