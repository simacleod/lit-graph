import { Signal, SignalWatcher } from '@lit-labs/signals';
import { LitElement } from 'lit';
import {installHeadlessLogger, installElementLogger} from './log';
import { Outport } from './port';

export function node<T extends new (...args: any[]) => any>(Ctor: T): T {
  const Wrapped = class extends Ctor {
    constructor(...args: any[]) {
      super(...args);
      if (this instanceof LitElement) {
        installElementLogger(this, this.id);
      } else {
        installHeadlessLogger(this, this.id ?? Ctor.name, () => 'debug');
      }
    }
  };
  return SignalWatcher(Wrapped as any) as T;
}

export function initHeadlessNode(instance: any, ctor: Function, id: string, getLevel: ()=>string) {
  installHeadlessLogger(instance, id, getLevel);
  const inStates: Signal.State<any>[] = [];
  const outports: Outport<any>[] = [];
  for (const key of Object.keys(instance)) {
    const val = (instance as any)[key];
    if (val instanceof Signal.State) {
      inStates.push((val as any));
    } else if (val instanceof Outport) {
      outports.push(val);
    }
  }
  const watcher = new Signal.subtle.Watcher(() => {
    Promise.resolve().then(async () => {
      const args = inStates.map(s => s.get());
      instance.log.debug('Inputs changed:', args);
      await instance.exec(...args, ...outports);
      inStates.forEach(s => watcher.watch(s));
    });
  });
  inStates.forEach(s => watcher.watch(s));
}