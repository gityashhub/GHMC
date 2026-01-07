import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    try {
        const inv = await prisma.invoice.findFirst();
        if (!inv) {
            console.log('No invoice found to link material');
            return;
        }
        const mat = await prisma.invoiceMaterial.create({
            data: {
                invoiceId: inv.id,
                materialName: 'Test',
                description: 'Test Description'
            }
        });
        console.log('Created material with description:', mat.description);
        await prisma.invoiceMaterial.delete({ where: { id: mat.id } });
        console.log('SUCCESS');
    } catch (e) {
        console.error('ERROR:', e.message || e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
