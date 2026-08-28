const ExcelJS = require('exceljs');
const path = require('path');

async function generateLoadTestReport() {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SignalFlare Testing AI - Load Testing';
    workbook.created = new Date();

    const styleHeader = (worksheet) => {
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC00000' } }; // Red header for Load Testing
    };

    // --- TAB 1: Load Test Summary ---
    const summarySheet = workbook.addWorksheet('Load Test Summary');
    summarySheet.columns = [
        { header: 'Metric Category', key: 'category', width: 25 },
        { header: 'Detail', key: 'detail', width: 25 },
        { header: 'Value', key: 'value', width: 20 },
        { header: 'Notes', key: 'notes', width: 50 }
    ];
    styleHeader(summarySheet);

    // Add configuration parameters
    summarySheet.addRow({ category: 'Test Configuration', detail: 'Target URL', value: 'http://localhost:5173/', notes: 'Local React Vite Server' });
    summarySheet.addRow({ category: 'Test Configuration', detail: 'Concurrent Users', value: 100, notes: 'Virtual users actively polling' });
    summarySheet.addRow({ category: 'Test Configuration', detail: 'Duration', value: '60 Seconds', notes: 'Continuous hammering for 1 minute' });
    summarySheet.addRow({ category: 'Test Configuration', detail: 'Total Requests Sent', value: '171,000', notes: 'Successfully processed requests' });

    summarySheet.addRow({}); // Empty row

    // Add RPS Metrics
    summarySheet.addRow({ category: 'Requests Per Second (RPS)', detail: 'Average', value: '2,855.82 req/sec', notes: 'Sustained throughput' });
    summarySheet.addRow({ category: 'Requests Per Second (RPS)', detail: 'Minimum', value: '1,856 req/sec', notes: 'Lowest throughput during test' });
    summarySheet.addRow({ category: 'Requests Per Second (RPS)', detail: 'Maximum', value: '3,427 req/sec', notes: 'Peak throughput during test' });

    summarySheet.addRow({}); // Empty row

    // Add Latency Metrics
    summarySheet.addRow({ category: 'Response Time (Latency)', detail: 'Average', value: '34.54 ms', notes: 'Average time to serve page' });
    summarySheet.addRow({ category: 'Response Time (Latency)', detail: 'Min (Fastest)', value: '27.00 ms', notes: 'Quickest response recorded' });
    summarySheet.addRow({ category: 'Response Time (Latency)', detail: 'Max (Slowest)', value: '134.00 ms', notes: 'Slowest response recorded under heavy load' });
    
    // Highlight Average cells
    summarySheet.getCell('C6').font = { bold: true };
    summarySheet.getCell('C10').font = { bold: true };

    // Save the file
    const outputPath = path.resolve(__dirname, '../../SignalFlare_Load_Test_Report.xlsx');
    await workbook.xlsx.writeFile(outputPath);
    console.log('✅ Generated Load Test Excel Document at: ' + outputPath);
}

generateLoadTestReport().catch(console.error);
