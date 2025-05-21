import { LitElement } from 'lit';
import { signal, Signal } from '@lit-labs/signals';
import {installElementLogger} from './log'

export class Inport<T> {
  constructor(public name: string, public state: Signal.State<T>) {}
  get(): T { return this.state.get(); }
}

export function inport() {
  return function (prototype: any, propName: string) {
    const state = signal(undefined as unknown) as Signal.State<any>;

    const originalSet = state.set;
    state.set = (v: any) => {
      originalSet.call(state, { __dirty: true, value: v });
    };

    Object.defineProperty(prototype, `_${propName}`, {
      get: () => state,
      set: (v: any) => state.set(v),
      enumerable: true,
    });

    Object.defineProperty(prototype, propName, {
      get: () => {
        const current = state.get();
        return current?.value ?? current;
      },
      set: (v: any) => state.set(v),
      enumerable: true,
    });
  };
}


export class Outport<T> {
  private targets: Signal.State<T>[] = [];
  public value?: T;

  constructor(public name: string) {}

  async send(v: T) {
    this.value = v;
    for (const t of this.targets) {
      t.set(v);
    }
  }
  _registerTarget(sig: Signal.State<T>) {
    this.targets.push(sig);
  }
}

export function outport() {
  return function (prototype: any, propName: string) {

      const initial = prototype[propName];
      const st = signal(initial) as Signal.State<any>;
      const port = new Outport(propName);
      Object.defineProperty(prototype, propName, {
        get: () => port,
        set: (val) => port.send(val),
        enumerable: true,
      });

  };
}