import {chunkBaseAndQuery, remoteChunkUrl, isDevServerUrl} from './chunkUrls';

describe('chunkBaseAndQuery', () => {
  it('published container (no query) → base dir, empty query', () => {
    expect(
      chunkBaseAndQuery('https://cdn.example/acc/1.2.0/acc.container.js.bundle'),
    ).toEqual({base: 'https://cdn.example/acc/1.2.0/', query: ''});
  });

  it('dev-server container → base dir + preserved query', () => {
    expect(
      chunkBaseAndQuery(
        'http://localhost:9000/hellow_widget.container.js.bundle?platform=android',
      ),
    ).toEqual({base: 'http://localhost:9000/', query: '?platform=android'});
  });
});

describe('remoteChunkUrl', () => {
  it('dev-server chunks carry ?platform (the Mode 2 fix)', () => {
    const {base, query} = chunkBaseAndQuery(
      'http://localhost:9000/hellow_widget.container.js.bundle?platform=android',
    );
    expect(remoteChunkUrl(base, '__federation_expose_Entry', query)).toBe(
      'http://localhost:9000/__federation_expose_Entry.chunk.bundle?platform=android',
    );
    expect(remoteChunkUrl(base, 'vendors-swc_helpers', query)).toBe(
      'http://localhost:9000/vendors-swc_helpers.chunk.bundle?platform=android',
    );
  });

  it('published chunks have no query (no regression)', () => {
    const {base, query} = chunkBaseAndQuery(
      'https://cdn.example/acc/1.2.0/acc.container.js.bundle',
    );
    expect(remoteChunkUrl(base, '__federation_expose_Entry', query)).toBe(
      'https://cdn.example/acc/1.2.0/__federation_expose_Entry.chunk.bundle',
    );
  });
});

describe('isDevServerUrl', () => {
  it('dev-server url (has query) → true → will bypass cache', () => {
    expect(
      isDevServerUrl('http://localhost:9000/hellow_widget.container.js.bundle?platform=android'),
    ).toBe(true);
  });

  it('published url (no query) → false → keeps default cache', () => {
    expect(
      isDevServerUrl('https://cdn.example/acc/1.2.0/acc.container.js.bundle'),
    ).toBe(false);
  });
});
