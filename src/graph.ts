import {initHeadlessNode} from './node'
import {Outport, Inport} from './port'
import {setLogLevel} from './log'
import { Signal } from '@lit-labs/signals';


export class LitGraph {
  private nodes = new Map<string, any>();
  private logLevel: 'debug'|'info'|'warn'|'error' = 'info';
  public root: Document|Element|object;

  constructor(root?: Document | Element) {
    if (root?.shadowRoot) {
      this.root = root.shadowRoot;
    } else if (root) {
      this.root = root;
    } else if (typeof document !== 'undefined') {
      this.root = document;
    } else {
      this.root = {};
    }

    Object.defineProperty(this.root, '__litgraph', {
      value: this,
      enumerable: false,
      configurable: false,
      writable: false,
    });
  }

  setLogLevel(level: 'debug'|'info'|'warn'|'error') {
    this.logLevel = level;
    setLogLevel(level);
  }
  getLogLevel() {
    return this.logLevel;
  }

  node<T>(id: string, Ctor: new()=>T): T {
    if (this.nodes.has(id)) throw new Error(`Node id '${id}' exists`);
    const inst = new Ctor();
    initHeadlessNode(inst, Ctor, id, () => this.logLevel);
    this.nodes.set(id, inst);
    return inst;
  }

  private resolveNodes(sel: string): any[] {
    const results: any[] = [];
  
    const fromMap = this.nodes.get(sel);
    if (fromMap) results.push(fromMap);
  
    const byId = (this.root as any).getElementById?.(sel);
    if (byId) results.push(byId);
  
    if (results.length === 0 && typeof (this.root as any).querySelectorAll === 'function') {
      this.root.querySelectorAll(sel)?.forEach((el: any) => results.push(el));
    }
  
    return results;
  }
  
  edge(
    src: string | Outport<any>,
    dst: string | Signal.State<any> | string
  ) {
    const outports: Outport<any>[] = [];
  
    if (typeof src === 'string') {
      const [srcSelOrId, srcPort] = src.split('.');
      const srcNodes = this.resolveNodes(srcSelOrId);
  
      if (srcNodes.length === 0) {
        throw new Error(`Cannot find source node or selector '${srcSelOrId}'`);
      }
  
      srcNodes.forEach(node => {
        const port = node?.[srcPort];
        if (!port) {
          throw new Error(`Source port '${srcPort}' not found on node '${srcSelOrId}'`);
        }
        outports.push(port);
      });
    } else {
      outports.push(src);
    }

    const connect = (out: Outport<any>, target: Signal.State<any>) => {
      out._registerTarget(target);
    };
  
    for (const out of outports) {
      if (typeof dst === 'string') {
        const [dstSelOrId, dstPort] = dst.split('.');
        const dstNodes = this.resolveNodes(dstSelOrId);
  
        if (dstNodes.length === 0) {
          throw new Error(`Cannot find target node or selector '${dstSelOrId}'`);
        }
  
        const stateKey = dstPort.startsWith('_') ? dstPort : `_${dstPort}`;
        dstNodes.forEach(dstNode => {
          const targetState = dstNode[stateKey];
          if (!targetState) {
            throw new Error(`Target state '${stateKey}' not found on node '${dstSelOrId}'`);
          }
          connect(out, targetState);
        });
      } else {
        connect(out, dst);
      }
    }
  }
}

export const litgraph = new LitGraph();
export function createContext(root?: Element) {
  return new LitGraph(root);