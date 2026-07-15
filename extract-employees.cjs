const XLSX = require('xlsx');
const fs = require('fs');

const wb = XLSX.readFile('H:\\My Drive\\Claude Projects\\DPO Digital Name Card\\Employee Database_2026.xlsx');
const ws = wb.Sheets['Listing'];
const data = XLSX.utils.sheet_to_json(ws, { defval: '' });

// Build China employee map from Sheet 2 (keyed by lowercase email)
const chnMap = {};
const ws2 = wb.Sheets['CHN Employee Cards'];
if (ws2) {
  XLSX.utils.sheet_to_json(ws2, { defval: '' }).forEach(row => {
    const email = String(row['Email'] || '').trim().toLowerCase();
    if (email) chnMap[email] = row;
  });
}

const employees = data
  .filter(row => row['Email'] && String(row['Email']).includes('@'))
  .map(row => {
    const email = String(row['Email'] || '').trim().toLowerCase();
    const chn = chnMap[email];
    return {
      salutation:  String(row['Salutation'] || '').trim(),
      callingName: String(row['Calling Name'] || '').trim(),
      fullName:    String(row['Full Name'] || '').trim(),
      cardName:    String((chn && chn['Name to Appear on Card']) || row['Name to Appear on Card'] || row['Full Name'] || '').trim(),
      position:    String((chn && chn['Position'])             || row['Position'] || '').trim(),
      division:    String((chn && chn['Division'])             || row['Division'] || '').trim(),
      mobile:      String((chn && chn['Mobile Tel'])           || row['Mobile Tel'] || '').trim(),
      email,
      office:      String(row['Office'] || '').trim(),
      company:     String((chn && chn['Company Name'])         || row['Company Name/ Legal Entity'] || '').trim(),
      // China sheet addresses use real newlines → convert to ,, for e-sig line-break splitting
      address: chn
        ? String(chn['Address'] || '').replace(/\r\n/g, ',,').replace(/\n/g, ',,').trim()
        : String(row['Address'] || '').replace(/\r\n/g, ', ').replace(/\n/g, ', ').trim(),
      officePhone: String((chn && chn['Office Phone Number'])  || row['Office Phone Number'] || '').trim(),
    };
  });

fs.writeFileSync(
  'src/data/employees.json',
  JSON.stringify(employees, null, 2),
  'utf8'
);

console.log(`Extracted ${employees.length} employees to src/data/employees.json`);

const divisions = [...new Set(employees.map(e => e.division))].filter(Boolean).sort();
const offices = [...new Set(employees.map(e => e.office))].filter(Boolean).sort();
console.log(`\nDivisions (${divisions.length}):`, divisions);
console.log(`\nOffices (${offices.length}):`, offices);
