# lit-graph

**lit-graph** is a minimal TypeScript library for declaratively wiring reactive inputs and outputs between Lit components or plain objects. It uses `@inport`, `@outport`, and `@node` decorators to mark reactive fields, and provides a central `LitGraph` class for managing runtime connections.

It is built on top of `@lit-labs/signals` for reactivity.

## Why Use lit-graph?

When building applications with Lit, there's often a trade-off between creating highly reusable components and creating components which interact across the DOM. Manually managing event listeners, callbacks, and shared state can erode component encapsulation and introduce a maze of boilerplate that’s hard to maintain.

lit-graph addresses this by letting each component declare its own public-facing ports—inputs with `@inport` and outputs with `@outport`—and then connecting those ports anywhere in the DOM with a single, declarative call:

```ts
litgraph.edge('sourceId.portName', 'targetId.portName');
```

This promotes encapsulation and reuse while simplifying inter-component communication with minimal overhead.

## 📦 Installation

```bash
npm install lit-graph lit @lit-labs/signals
```

---

## 🚀 Quick Start

### 1. Define Nodes

```ts
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { outport, inport, node } from 'lit-graph';

@customElement('my-button')
@node
export class MyButton extends LitElement {
  @outport() clicked = false;

  render() {
    return html`<button 
      @mousedown=${() => this.clicked.send(true)} 
      @mouseup=${() => this.clicked.send(false)}>
        Click me
    </button>`;
  }
}

@customElement('my-indicator')
@node
export class MyIndicator extends LitElement {
  @inport() flash = false;

  nodeExecutor(flash) {
    this.log.info('indicator flashing!')
  }

  render() {
    return html`<div style="background: ${this.flash ? 'yellow' : 'gray'}">
      Indicator
    </div>`;
  }
}
```

### 2. Connect Ports

```ts
import { litgraph } from 'lit-graph';

litgraph.edge('btn.clicked', 'ind.flash');
```

### 3. HTML Structure

```html
<my-button id="btn"></my-button>
<my-indicator id="ind"></my-indicator>
```

---

## ⚙️ Core Concepts

### `@inport()`

Defines an input property that can be connected to any number of outputs. Values assigned to this property will come from connected `@outport`s.

### `@outport()`

Defines an output port with a `.send(value)` method. When called, it pushes the value to all connected `@inport`s.

### `@node`

Marks a class (element or headless) as a node with ports. Nodes also support the optional `nodeExecutor()` method for reactive transforms.

### `nodeExecutor()`
This function will execute any time an inport is updated. Defining this function inside an element decorated with @node will add custom reactive behavior to the element. This is also true for "headless" nodes, nodes which are not elements.



## 🔌 createContext

```ts
const graph = createContext();
graph.node('nodeId', NodeClass);
graph.edge('source.out', 'target._in');
```

* `.node(id, Ctor)` – Instantiates and registers a headless node. Not necessary for elements.
* `.edge(src, dst)` – Connects an `Outport` to an `Inport`
* `.setLogLevel(level)` – Adjusts log verbosity

The default, global instance is exported as `litgraph`. This instance is used to connect elements across the DOM.

---

## 🧪 Headless Nodes

Headless nodes are plain JavaScript classes (not custom elements) that are registered directly with a `LitGraph` instance using `.node(id, Ctor)`.

They support full reactive behavior: their `@inport` values are tracked, and whenever any input changes, the node is notified via nodeExecutor(...inports,...outports) method. Arguments appear in order they were declared in the node.

```ts
@node
class Adder {
  @inport() a = 0;
  @inport() b = 0;
  @outport() result;

  async exec(a, b, result) {
    result.send(a + b);
  }
}
```


---

## 🧱 Contexts

```ts
import { createContext } from 'lit-graph';

const graph = createContext(element);
graph.edge('localNode.out', 'localTarget.in');
```

Creates a scoped `LitGraph` instance that searches for nodes under a DOM subtree.

---

## 🧾 API Reference

```ts
function inport(name?: string): PropertyDecorator
function outport(name?: string): PropertyDecorator
function node<T>(Ctor: T): T
function createContext(root: Element): LitGraph

class LitGraph {
  node(id: string, Ctor: new () => any): any
  edge(from: string | Outport, to: string | Signal.State | string): void
  setLogLevel(level: string): void
}
```

---

## License

lit-graph is released under the [MIT License](https://opensource.org/licenses/MIT). This license permits free use, modification, distribution, and private use of lit-graph, but with limited liability and warranty as detailed in the license terms.