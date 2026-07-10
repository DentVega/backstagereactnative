import type {MiniappId} from '@org/miniapp-contract';

export type RootStackParamList = {
  Home: undefined;
  Miniapp: {id: MiniappId; title: string};
};
