import { node, inport, outport, LitGraph, Outport } from '../src/index.ts';

// --- Define two standalone nodes using decorators ---
@node
class Incrementer {
  @inport() input!: number;  // raw value in
  @outport() output!: number; // outport for wiring
  @outport() output2!: number; // outport for wiring

  async exec(input, output, output2) {
    await output.send(input + 1);
    await output2.send(input + 5);
    this.log.error('heyyy ')
  }
}

@node
class Collector {
  @inport() value!: number; // input port
  public lastReceived: number | null = null;

  async exec(value: number) {
    this.lastReceived = value;
    this.log.info(value)
  }
}

// --- Self-running async test without describe/it --------------------------------
(async function runTest() {
  const graph = new LitGraph();
  graph.setLogLevel('debug');
  const inc = graph.node('inc', Incrementer);
  const col = graph.node('col', Collector);
  const col2 = graph.node('col2', Collector);

  graph.edge('inc.output', 'col.value');
  graph.edge('inc.output2', 'col2.value');
  const inputs = [2, 4, 3, 2, 1, 2, 3, 4, 5, 5];
  for (const val of inputs) {
    inc._input.set(val);
    // wait 10ms between sends
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  if (col.lastReceived === 6) {
    console.log('Test passed: Collector received', col.lastReceived);
  } else {
    console.error('Test failed: expected 6, got', col.lastReceived);
    process.exit(1);
  }
})();
