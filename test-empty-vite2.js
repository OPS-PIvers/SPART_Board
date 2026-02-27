import { loadEnv } from 'vite';
process.env.VITE_TEST_VAR = '';
const env = loadEnv('production', process.cwd());
console.log('Result for VITE_TEST_VAR:', env.VITE_TEST_VAR);
