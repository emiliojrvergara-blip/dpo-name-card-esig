const XLSX = require('xlsx');
const fs = require('fs');

const wb = XLSX.readFile('H:\\My Drive\\Claude Projects\\DPO Digital Name Card\\Employee Database_2026.xlsx');
const ws = wb.Sheets['Listing'];
const data = XLSX.utils.sheet_to_json(ws, { defval: '' });

const employees = data
  .filter(row => row['Email'] && String(row['Email']).includes('@'))
  .map(row => ({
    salutation: String(row['Salutation'] || '').trim(),
    callingName: String(row['Calling Name'] || '').trim(),
    fullName: String(row['Full Name'] || '').trim(),
    cardName: String(row['Name to Appear on Card'] || row['Full Name'] || '').trim(),
    position: String(row['Position'] || '').trim(),
    division: String(row['Division'] || '').trim(),
    mobile: String(row['Mobile Tel'] || '').trim(),
    email: String(row['Email'] || '').trim().toLowerCase(),
    office: String(row['Office'] || '').trim(),
    company: String(row['Company Name/ Legal Entity'] || '').trim(),
    address: String(row['Address'] || '').replace(/\r\n/g, ', ').replace(/\n/g, ', ').trim(),
    officePhone: String(row['Office Phone Number'] || '').trim(),
  }));

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
