const fs=require('fs'),path=require('path'),assert=require('assert');
global.PDFLib=require('../public/vendor/pdf-lib.min.js');
require('../public/report-pdf.js');
(async()=>{
 const report={reportNo:'007',preparedBy:'operator1',dateOfReport:'2026-09-10',timeOfReport:'14:30',employeeName:'Ahmad bin Abdullah',passportNo:'A1234567',department:'Operations',companyAgency:'SALS',supervisor:'Nur Aisyah',typeOfIncident:'Property Damage',locationOfIncident:'Warehouse - Loading Bay 4',incidentDateTime:'2026-09-10T14:15',asset:'Loading bay barrier',estimatedValue:'1200.00',status:'Under Investigation',incidentDescription:'The vehicle stopped at the loading bay. The driver reported damage to the barrier and informed the security officer. The area was secured for inspection.',refName:'Mohd Faizal',refPassportNo:'B2345678',refDepartment:'Transport',refCompanyAgency:'Transport contractor',employeeStatement:'Saya memberhentikan kenderaan dan memaklumkan kejadian kepada pegawai keselamatan. Tiada kecederaan dilaporkan.',ioAction:'CCTV footage reviewed. Photographs recorded. Vehicle and barrier inspected. Follow-up investigation remains open.',policeReportNo:'',policeStationName:'',ioComments:'Follow up with Operations and Transport.',recordingOfficerName:'SALS Security Officer'};
 const html=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');const logo=html.match(/data:image\/png;base64,[^"]+/)[0];
 const pdfSource=fs.readFileSync(path.join(__dirname,'../public/report-pdf.js'),'utf8');assert(pdfSource.includes("[report.dateOfReport,report.timeOfReport].filter(Boolean).join(', ')"));
 const bytes=await createReportPdf(report,logo);const pdf=await PDFLib.PDFDocument.load(bytes);assert.equal(pdf.getPageCount(),1);
 const long=await createReportPdf({...report,employeeStatement:'This is a long statement that must continue safely onto later pages. '.repeat(500)},logo);const lp=await PDFLib.PDFDocument.load(long);assert.equal(lp.getPageCount(),1);
 if(process.env.PDF_QA_DIR){fs.mkdirSync(process.env.PDF_QA_DIR,{recursive:true});fs.writeFileSync(path.join(process.env.PDF_QA_DIR,'report.pdf'),bytes);fs.writeFileSync(path.join(process.env.PDF_QA_DIR,'long-report.pdf'),long);}
 assert(html.includes('onclick="exportCurrentPdf()"'));assert(html.includes('onclick="downloadCurrentPdf()"'));assert(html.includes('onclick="downloadSpecificPdf('));
 console.log('PASS downloadable PDF creation, single-page long-statement fitting, current/register export and retained print controls.');
})().catch(e=>{console.error(e);process.exit(1)});

