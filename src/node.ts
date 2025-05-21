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
        installHeadlessLogger(this, this.id);
      }

      initNodeExecutor(this, Ctor);
    }
  };
  return SignalWatcher(Wrapped as any) as T;
}


export function initNodeExecutor(instance: any, ctor: Function) {
  const ports = instance.ports;
  if (!ports) return;
  const inStates = Object.values(ports.inports);
  const outports = Object.values(ports.outports);

  // skip if no executor defined
  const execFn = instance.nodeExecutor;
  if (typeof execFn !== 'function') {
    return;
  }

  const watcher = new Signal.subtle.Watcher(() => {
    Promise.resolve().then(async () => {
      const args = inStates.map(s => s.get());
      instance.log.debug('Inputs changed:', args);
      // safe apply
      await execFn.apply(instance, [...args, ...outports]);
      inStates.forEach(s => watcher.watch(s));
    });
  });

  inStates.forEach(s => watcher.watch(s));
}