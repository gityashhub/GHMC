import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    try {
        const material = await prisma.invoiceMaterial.findFirst();
        console.log('InvoiceMaterial fields:', Object.keys(material || {}));
        console.log('SUCCESS');
    } catch (e) {
        console.error('ERROR:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
