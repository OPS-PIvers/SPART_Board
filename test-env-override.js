import { loadEnv } from 'vite';
process.env.VITE_TEST_VAR = 'shell_var';
console.log('process.env before loadEnv:', process.env.VITE_TEST_VAR);
const env = loadEnv('production', process.cwd());
console.log('env after loadEnv:', env.VITE_TEST_VAR);
