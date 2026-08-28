import type { Options } from '@wdio/types';
import ExcelReporter from './reporters/excelReporter';

export const config: Options.Testrunner = {
    runner: 'local',
    tsNodeOpts: {
        project: './tsconfig.json'
    },
    specs: [
        './test-cases/**/*.ts'
    ],
    exclude: [
    ],
    maxInstances: 1,
    capabilities: [{
        platformName: 'Android',
        'appium:deviceName': 'Android Emulator',
        'appium:automationName': 'UiAutomator2',
        browserName: 'chrome',
        'appium:newCommandTimeout': 240,
    }],
    logLevel: 'info',
    bail: 0,
    baseUrl: 'http://10.0.2.2:5173', // 10.0.2.2 points to localhost from Android Emulator
    waitforTimeout: 10000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,
    services: ['appium'],
    framework: 'mocha',
    reporters: ['spec', [ExcelReporter, { outputDir: './reports' }]],
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    },
}
