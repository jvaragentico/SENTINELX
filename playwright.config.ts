import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests',testMatch:'*.spec.ts',use:{baseURL:process.env.TEST_BASE_URL||'http://localhost:3000',headless:true,channel:'chromium'},reporter:'list',workers:1});
