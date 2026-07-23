import type {MiniappId} from '@dentvega/miniapp-contract';

export type RootStackParamList = {
  Home: undefined;
  Miniapp: {id: MiniappId; title: string};
  DevMount: undefined;
};
