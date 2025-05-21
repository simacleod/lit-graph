import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true
    },
    {
      file: 'dist/index.cjs.js',
      format: 'cjs',
      sourcemap: true
    }
  ],
  external: [
    'lit',
    '@lit-labs/signals'
  ],
  plugins: [
    resolve({ extensions: ['.js', '.ts'] }),
    commonjs(),
    typescript({ tsconfig: './tsconfig.json' })
  ]
};