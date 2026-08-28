const ExcelJS = require('exceljs');
const path = require('path');

async function generateSecurityAuditReport() {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SignalFlare Security Auditor';
    workbook.created = new Date();

    const styleHeader = (worksheet) => {
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF800080' } }; // Purple header
    };

    // --- TAB 1: API Inventory ---
    const apiSheet = workbook.addWorksheet('API Inventory');
    apiSheet.columns = [
        { header: 'Endpoint', key: 'endpoint', width: 40 },
        { header: 'HTTP Method', key: 'method', width: 15 },
        { header: 'Auth Required', key: 'auth', width: 15 },
        { header: 'Expected Roles', key: 'roles', width: 30 },
        { header: 'Controller File', key: 'file', width: 30 }
    ];
    styleHeader(apiSheet);
    
    apiSheet.addRow({ endpoint: '/api/auth/register', method: 'POST', auth: 'Yes', roles: 'N/A', file: 'authController.ts' });
    apiSheet.addRow({ endpoint: '/api/auth/login', method: 'POST', auth: 'Yes', roles: 'N/A', file: 'authController.ts' });
    apiSheet.addRow({ endpoint: '/api/auth/logout', method: 'POST', auth: 'Yes', roles: 'ANY', file: 'authController.ts' });
    apiSheet.addRow({ endpoint: '/api/sos', method: 'POST/GET', auth: 'Yes', roles: 'ANY', file: 'sosController.ts' });
    apiSheet.addRow({ endpoint: '/api/requests/emergency', method: 'POST', auth: 'Yes', roles: 'ANY', file: 'requestController.ts' });
    apiSheet.addRow({ endpoint: '/api/resources', method: 'POST/PUT', auth: 'Yes', roles: 'RESCUE, ADMIN', file: 'resourceController.ts' });
    apiSheet.addRow({ endpoint: '/api/admin/users', method: 'GET', auth: 'Yes', roles: 'ADMIN', file: 'adminController.ts' });
    apiSheet.addRow({ endpoint: '/health', method: 'GET', auth: 'Yes', roles: 'N/A', file: 'server.ts' });

    // --- TAB 2: SAST Security Findings ---
    const findSheet = workbook.addWorksheet('Security Findings');
    findSheet.columns = [
        { header: 'Severity', key: 'sev', width: 15 },
        { header: 'Vulnerability Type', key: 'type', width: 25 },
        { header: 'File Path', key: 'path', width: 40 },
        { header: 'Description / Risk', key: 'desc', width: 60 },
        { header: 'Recommended Fix', key: 'fix', width: 50 }
    ];
    styleHeader(findSheet);

    const f1 = findSheet.addRow({ sev: 'High', type: 'Cryptography', path: 'src/middleware/auth.ts', desc: 'Hardcoded JWT secret fallback in source code.', fix: 'Remove the fallback string and throw an error if env var is missing.' });
    f1.getCell('sev').font = { color: { argb: 'FFFF0000' }, bold: true };

    const f2 = findSheet.addRow({ sev: 'Medium', type: 'Configuration (DoS)', path: 'src/server.ts', desc: 'Express body parser allows 50MB payloads, risking memory exhaustion.', fix: 'Reduce limit to 2mb and use multipart streaming for large files.' });
    f2.getCell('sev').font = { color: { argb: 'FFFFA500' }, bold: true };

    const f3 = findSheet.addRow({ sev: 'Medium', type: 'Business Logic', path: 'src/server.ts', desc: 'Missing global or route-specific rate limiting.', fix: 'Install express-rate-limit to mitigate brute-force and spam.' });
    f3.getCell('sev').font = { color: { argb: 'FFFFA500' }, bold: true };

    // --- TAB 3: Dependency Review ---
    const depSheet = workbook.addWorksheet('Dependency Review');
    depSheet.columns = [
        { header: 'Dependency', key: 'dep', width: 25 },
        { header: 'Version', key: 'ver', width: 15 },
        { header: 'Risk Status', key: 'status', width: 20 },
        { header: 'Notes', key: 'notes', width: 50 }
    ];
    styleHeader(depSheet);
    depSheet.addRow({ dep: 'express', ver: '^4.18.2', status: 'Clean', notes: 'Core framework. Up to date.' });
    depSheet.addRow({ dep: 'jsonwebtoken', ver: '^9.0.2', status: 'Clean', notes: 'Auth library. No active CVEs.' });
    depSheet.addRow({ dep: 'uuid', ver: '8.3.2', status: 'Warning', notes: 'Deprecated version. Needs update to v10+.' });

    const outputPath = path.resolve(__dirname, '../../Security_Audit_Report_FINAL.xlsx');
    await workbook.xlsx.writeFile(outputPath);
    console.log('✅ Generated Security Audit Excel Document at: ' + outputPath);
}

generateSecurityAuditReport().catch(console.error);
