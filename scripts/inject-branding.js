const fs = require('fs');
const path = require('path');

const setupFilePath = path.join(__dirname, '../lib/actions/setup.ts');
const brandingFilePath = path.join(__dirname, '../branding.txt');

let setupContent = fs.readFileSync(setupFilePath, 'utf8');
const brandingContent = fs.readFileSync(brandingFilePath, 'utf8');

const appNameMatch = brandingContent.match(/APPLICATION_NAME:\s*(.*)/);
const compNameMatch = brandingContent.match(/COMPANY_NAME:\s*(.*)/);
const logoUrlMatch = brandingContent.match(/LOGO_URL:\s*(.*)/);

const appName = appNameMatch ? appNameMatch[1].trim() : 'CRED Secure';
const compName = compNameMatch ? compNameMatch[1].trim() : 'Innodhee Services Pvt Ltd';
const logoUrl = logoUrlMatch ? logoUrlMatch[1].trim() : '/logo.png';

setupContent = setupContent.replace(
    /update:\s*\{\s*logoUrl:\s*'.*?'\s*\}/,
    `update: { logoUrl: \`${logoUrl}\` }`
);

// We need to match the create object specifically 
setupContent = setupContent.replace(
    /create:\s*\{\s*id:\s*1,\s*applicationName:\s*'.*?',\s*companyName:\s*'.*?',\s*logoUrl:\s*'.*?'\s*\}/,
    `create: {
                id: 1,
                applicationName: \`${appName}\`,
                companyName: \`${compName}\`,
                logoUrl: \`${logoUrl}\`
            }`
);

fs.writeFileSync(setupFilePath, setupContent, 'utf8');
console.log('Successfully injected custom branding into setup.ts!');
