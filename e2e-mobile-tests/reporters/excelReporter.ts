import WDIOReporter, { RunnerStats, TestStats, SuiteStats } from '@wdio/reporter';
import * as ExcelJS from 'exceljs';
import * as path from 'path';
import * as fs from 'fs';

export default class ExcelReporter extends WDIOReporter {
    private workbook: ExcelJS.Workbook;
    private worksheet: ExcelJS.Worksheet;
    private outputDir: string;
    private results: any[] = [];

    constructor(options: any) {
        super(options);
        this.outputDir = options.outputDir || './reports';
        this.workbook = new ExcelJS.Workbook();
        this.worksheet = this.workbook.addWorksheet('Test Results');
        
        // Define columns
        this.worksheet.columns = [
            { header: 'Test ID', key: 'id', width: 10 },
            { header: 'Suite', key: 'suite', width: 30 },
            { header: 'Test Case Description', key: 'title', width: 50 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Duration (ms)', key: 'duration', width: 15 },
            { header: 'Error Message', key: 'error', width: 50 },
        ];
        
        // Style headers
        this.worksheet.getRow(1).font = { bold: true };
    }

    onTestPass(test: TestStats) {
        this.results.push({
            id: `TC-${this.results.length + 1}`,
            suite: test.fullTitle.replace(test.title, '').trim(),
            title: test.title,
            status: 'PASSED',
            duration: test._duration,
            error: ''
        });
    }

    onTestFail(test: TestStats) {
        this.results.push({
            id: `TC-${this.results.length + 1}`,
            suite: test.fullTitle.replace(test.title, '').trim(),
            title: test.title,
            status: 'FAILED',
            duration: test._duration,
            error: test.error?.message || 'Unknown Error'
        });
    }

    async onRunnerEnd(runner: RunnerStats) {
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }

        // Add all rows
        this.results.forEach(row => {
            const addedRow = this.worksheet.addRow(row);
            // Color code status
            const statusCell = addedRow.getCell('status');
            if (row.status === 'PASSED') {
                statusCell.font = { color: { argb: 'FF008000' } };
            } else {
                statusCell.font = { color: { argb: 'FFFF0000' } };
            }
        });

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = path.join(this.outputDir, `Appium-Test-Report-${timestamp}.xlsx`);
        
        await this.workbook.xlsx.writeFile(filename);
        console.log(`\n✅ Excel Report Generated: ${filename}\n`);
    }
}
