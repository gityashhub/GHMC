import prisma from './src/config/database.js';
import fs from 'fs';

async function debugAmbujaEntries() {
    try {
        const company = await prisma.company.findFirst({
            where: { name: { contains: 'Ambuja', mode: 'insensitive' } },
        });

        if (!company) {
            fs.writeFileSync('debug_output.txt', 'Company "Ambuja Cement" not found.');
            return;
        }

        const entries = await prisma.inwardEntry.findMany({
            where: { companyId: company.id },
            select: {
                id: true,
                manifestNo: true,
                invoiceId: true,
                invoice: {
                    select: {
                        invoiceNo: true
                    }
                }
            }
        });

        let output = `Found Company: ${company.name} (${company.id})\n`;
        output += `Found ${entries.length} entries:\n`;
        entries.forEach(e => {
            output += `- Manifest: ${e.manifestNo}, ID: ${e.id}, InvoiceID: ${e.invoiceId}, InvoiceNo: ${e.invoice?.invoiceNo}\n`;
        });

        fs.writeFileSync('debug_output.txt', output);
        console.log('Debug info written to debug_output.txt');

    } catch (error) {
        console.error('Error:', error);
        fs.writeFileSync('debug_output.txt', `Error: ${error.message}`);
    } finally {
        await prisma.$disconnect();
    }
}

debugAmbujaEntries();
