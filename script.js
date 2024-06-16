// document.getElementById('fileInput').addEventListener('change', handleFileUpload);
// document.getElementById('domainFinderButton').addEventListener('click', findDomains);
// document.getElementById('linkedinFinderButton').addEventListener('click', findLinkedins);

// let csvData = [];

// function handleFileUpload(event) {
//     const file = event.target.files[0];
//     if (file) {
//         const reader = new FileReader();
//         reader.onload = function(e) {
//             const text = e.target.result;
//             csvData = parseCSV(text);
//             document.getElementById('results').innerHTML = '<p>File uploaded successfully!</p>';
//         };
//         reader.readAsText(file);
//     }
// }

// function parseCSV(text) {
//     const rows = text.split('\n').map(row => row.split(','));
//     return rows;
// }

// async function findDomains() {
//     if (csvData.length === 0) {
//         alert('Please upload a CSV file first.');
//         return;
//     }
//     const results = await processData(csvData, 'domain');
//     downloadCSV(results, 'Website_urls.csv');
// }

// async function findLinkedins() {
//     if (csvData.length === 0) {
//         alert('Please upload a CSV file first.');
//         return;
//     }
//     const results = await processData(csvData, 'linkedin');
//     downloadCSV(results, 'Linkedin_urls.csv');
// }

// async function processData(data, type) {
//     const results = [['Company', type === 'domain' ? 'Company Website' : 'Company LinkedIn URL']];
//     for (const row of data) {
//         const company = row[0];
//         const query = `${company} ${type === 'domain' ? '' : 'LinkedIn'}`;
//         const url = await fetchSearchResult(query);
//         results.push([company, url]);
//     }
//     return results;
// }

// async function fetchSearchResult(query) {
//     const response = await fetch(`http://localhost:5000/search?query=${encodeURIComponent(query)}`);
//     const text = await response.text();
//     const parser = new DOMParser();
//     const doc = parser.parseFromString(text, 'text/html');
//     const link = doc.querySelector('.g a');
//     return link ? link.href : 'No URL found';
// }

// function downloadCSV(data, filename) {
//     const csvContent = data.map(row => row.join(',')).join('\n');
//     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
//     const link = document.createElement('a');
//     link.href = URL.createObjectURL(blob);
//     link.setAttribute('download', filename);
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
// }


// ----------------------------------------------------------------------------------------------------------

document.getElementById('fileInput').addEventListener('change', handleFileUpload);
document.getElementById('domainFinderButton').addEventListener('click', findDomains);
document.getElementById('linkedinFinderButton').addEventListener('click', findLinkedins);
document.getElementById('downloadResultButton').addEventListener('click', downloadResults);

let csvData = null; // Initialize csvData as null

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const text = e.target.result;
            const extension = file.name.split('.').pop().toLowerCase();
            if (extension === 'csv') {
                csvData = parseCSV(text);
                document.getElementById('results').innerHTML = '<p>File uploaded successfully!</p>';
                document.getElementById('downloadButton').style.display = 'none'; // Hide download button if shown
            } else if (extension === 'xlsx' || extension === 'xls') {
                parseExcel(file);
            } else {
                alert('Unsupported file format. Please upload a CSV or Excel file.');
                return;
            }
        };
        if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
            reader.readAsArrayBuffer(file);
        } else {
            reader.readAsText(file);
        }
    }
}

function parseCSV(text) {
    const rows = text.split('\n').map(row => row.split(','));
    return rows;
}

async function parseExcel(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        csvData = parseCSV(csv);
        document.getElementById('results').innerHTML = '<p>File uploaded successfully!</p>';
        document.getElementById('downloadButton').style.display = 'none'; // Hide download button if shown
    };
    reader.readAsArrayBuffer(file);
}

async function findDomains() {
    if (!csvData || csvData.length === 0) { // Check if csvData is null or empty
        alert('Please upload a file first.');
        return;
    }
    const results = await processData(csvData, 'domain');
    generateExcel(results);
}

async function findLinkedins() {
    if (!csvData || csvData.length === 0) { // Check if csvData is null or empty
        alert('Please upload a file first.');
        return;
    }
    const results = await processData(csvData, 'linkedin');
    generateExcel(results);
}

function processData(data, type) {
    return new Promise((resolve, reject) => {
        const results = [['Company', type === 'domain' ? 'Company Website' : 'Company LinkedIn URL']];
        let count = 0;
        const total = data.length - 1; // Subtract header row

        for (const row of data) {
            if (row.length === 0) continue; // Skip empty rows

            const company = row[0].trim();
            if (company.toLowerCase() === 'company') continue; // Skip header row if present

            fetchSearchResult(company, type).then(url => {
                results.push([company, url]);
                count++;
                if (count === total) {
                    resolve(results);
                }
            }).catch(error => {
                console.error(`Error fetching ${type} for ${company}`, error);
                count++;
                if (count === total) {
                    resolve(results);
                }
            });
        }
    });
}

async function fetchSearchResult(company, type) {
    const query = `${company} ${type === 'domain' ? '' : 'LinkedIn'}`;
    const response = await fetch(`http://localhost:5000/search?query=${encodeURIComponent(query)}`);
    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const link = doc.querySelector('.g a');
    return link ? link.href : `No ${type === 'domain' ? 'website' : 'LinkedIn'} found`;
}

let excelBlob = null; // Store the generated Excel blob globally

function generateExcel(results) {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(results);
    XLSX.utils.book_append_sheet(wb, ws, 'LinkedIn Results');
    const wbout = XLSX.write(wb, { type: 'binary', bookType: 'xlsx' });

    // Store the Excel blob globally
    excelBlob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' });

    // Display the download button
    document.getElementById('downloadButton').style.display = 'block';
}

function downloadExcel() {
    if (!excelBlob) {
        alert('No Excel file generated yet.');
        return;
    }

    // Trigger file download using FileSaver.js
    saveAs(excelBlob, 'LinkedIn_Results.xlsx');

    // Reset UI after download
    resetUI();
}


// Utility function to convert string to array buffer
function s2ab(s) {
    const buf = new ArrayBuffer(s.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < s.length; i++) {
        view[i] = s.charCodeAt(i) & 0xFF;
    }
    return buf;
}


function resetUI() {
    csvData = null; // Reset csvData
    document.getElementById('fileInput').value = ''; // Clear file input
    document.getElementById('results').innerHTML = ''; // Clear results display
    document.getElementById('downloadButton').style.display = 'none'; // Hide download button
}

// Utility function to convert string to array buffer
function s2ab(s) {
    const buf = new ArrayBuffer(s.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < s.length; i++) {
        view[i] = s.charCodeAt(i) & 0xFF;
    }
    return buf;
}

function downloadResults() {
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'LinkedIn_results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
