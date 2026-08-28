const Mocha = require('mocha');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

const {
    EVENT_RUN_END,
    EVENT_TEST_PASS,
    EVENT_TEST_FAIL,
} = Mocha.Runner.constants;

class ExcelReporter {
    constructor(runner) {
        this.results = [];
        this.workbook = new ExcelJS.Workbook();
        this.worksheet = this.workbook.addWorksheet('Web Test Results');
        this.outputDir = path.resolve(__dirname, '../reports');

        this.worksheet.columns = [
            { header: 'Test ID', key: 'id', width: 10 },
            { header: 'Suite', key: 'suite', width: 30 },
            { header: 'Web Test Scenario', key: 'title', width: 50 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Duration (ms)', key: 'duration', width: 15 },
            { header: 'Error Log', key: 'error', width: 50 },
        ];
        this.worksheet.getRow(1).font = { bold: true };

        runner.on(EVENT_TEST_PASS, (test) => {
            this.results.push({
                id: `TC-${this.results.length + 1}`,
                suite: test.parent.title,
                title: test.title,
                status: 'PASSED',
                duration: test.duration,
                error: ''
            });
        });

        runner.on(EVENT_TEST_FAIL, (test, err) => {
            this.results.push({
                id: `TC-${this.results.length + 1}`,
                suite: test.parent.title,
                title: test.title,
                status: 'FAILED',
                duration: test.duration,
                error: err.message
            });
        });

        runner.once(EVENT_RUN_END, async () => {
            if (!fs.existsSync(this.outputDir)) {
                fs.mkdirSync(this.outputDir, { recursive: true });
            }

            this.results.forEach(row => {
                const addedRow = this.worksheet.addRow(row);
                const statusCell = addedRow.getCell('status');
                if (row.status === 'PASSED') {
                    statusCell.font = { color: { argb: 'FF008000' } };
                } else {
                    statusCell.font = { color: { argb: 'FFFF0000' } };
                }
            });

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = path.join(this.outputDir, `Selenium-Web-Report-${timestamp}.xlsx`);
            await this.workbook.xlsx.writeFile(filename);
            console.log(`\n✅ Selenium Excel Report Generated: ${filename}\n`);
        });
    }
}

module.exports = ExcelReporter;
