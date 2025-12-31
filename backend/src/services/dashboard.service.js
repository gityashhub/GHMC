import prisma from '../config/database.js';

/**
 * Dashboard Service
 * Handles all dashboard-related business logic and statistics
 */

class DashboardService {
  /**
   * Get dashboard statistics
   * @returns {Promise<object>} Dashboard stats
   */
  async getStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Get current month inward stats
    const [currentMonthInward, currentMonthOutward, totalInvoices, yearRevenue] = await Promise.all([
      prisma.inwardEntry.aggregate({
        where: {
          date: {
            gte: startOfMonth,
          },
        },
        _count: true,
        _sum: {
          quantity: true,
        },
      }),
      prisma.outwardEntry.aggregate({
        where: {
          date: {
            gte: startOfMonth,
          },
        },
        _count: true,
        _sum: {
          quantity: true,
        },
      }),
      prisma.invoice.count({
        where: {
          date: {
            gte: startOfMonth,
          },
        },
      }),
      prisma.invoice.aggregate({
        where: {
          date: {
            gte: startOfYear,
          },
        },
        _sum: {
          grandTotal: true,
          paymentReceived: true,
        },
      }),
    ]);

    // Get all-time totals for comparison
    const [allTimeInward, allTimeOutward] = await Promise.all([
      prisma.inwardEntry.aggregate({
        _count: true,
        _sum: {
          quantity: true,
        },
      }),
      prisma.outwardEntry.aggregate({
        _count: true,
        _sum: {
          quantity: true,
        },
      }),
    ]);

    const totalInwardQuantity = parseFloat(currentMonthInward._sum.quantity || 0);
    const totalOutwardQuantity = parseFloat(currentMonthOutward._sum.quantity || 0);
    const totalRevenue = parseFloat(yearRevenue._sum.grandTotal || 0);
    const totalPaid = parseFloat(yearRevenue._sum.paymentReceived || 0);
    const totalPending = totalRevenue - totalPaid;

    return {
      inward: {
        entries: currentMonthInward._count,
        quantity: totalInwardQuantity,
        allTimeEntries: allTimeInward._count,
        allTimeQuantity: parseFloat(allTimeInward._sum.quantity || 0),
      },
      outward: {
        entries: currentMonthOutward._count,
        quantity: totalOutwardQuantity,
        allTimeEntries: allTimeOutward._count,
        allTimeQuantity: parseFloat(allTimeOutward._sum.quantity || 0),
      },
      invoices: {
        thisMonth: totalInvoices,
      },
      revenue: {
        ytd: totalRevenue,
        paid: totalPaid,
        pending: totalPending,
      },
    };
  }

  /**
   * Get revenue chart data (monthly)
   * @param {number} year - Year to filter (default: current year)
   * @returns {Promise<array>} Monthly revenue data
   */
  async getRevenueChartData(year = null) {
    const targetYear = year || new Date().getFullYear();
    const startOfYear = new Date(targetYear, 0, 1);
    const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59);

    // Get all invoices for the year
    const invoices = await prisma.invoice.findMany({
      where: {
        date: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
      select: {
        date: true,
        grandTotal: true,
        paymentReceived: true,
      },
    });

    // Group by month
    const monthlyData = {};
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    // Initialize all months
    for (let i = 0; i < 12; i++) {
      monthlyData[i] = {
        month: monthNames[i],
        revenue: 0,
        paid: 0,
        pending: 0,
      };
    }

    // Aggregate data
    invoices.forEach((invoice) => {
      const month = new Date(invoice.date).getMonth();
      const revenue = parseFloat(invoice.grandTotal);
      const paid = parseFloat(invoice.paymentReceived);
      
      monthlyData[month].revenue += revenue;
      monthlyData[month].paid += paid;
      monthlyData[month].pending += (revenue - paid);
    });

    return Object.values(monthlyData);
  }

  /**
   * Get payment status breakdown
   * @returns {Promise<object>} Payment status data
   */
  async getPaymentStatus() {
    const [paidInvoices, pendingInvoices, partialInvoices] = await Promise.all([
      prisma.invoice.aggregate({
        where: {
          status: 'paid',
        },
        _sum: {
          grandTotal: true,
          paymentReceived: true,
        },
        _count: true,
      }),
      prisma.invoice.aggregate({
        where: {
          status: 'pending',
        },
        _sum: {
          grandTotal: true,
          paymentReceived: true,
        },
        _count: true,
      }),
      prisma.invoice.aggregate({
        where: {
          status: 'partial',
        },
        _sum: {
          grandTotal: true,
          paymentReceived: true,
        },
        _count: true,
      }),
    ]);

    const paidAmount = parseFloat(paidInvoices._sum.grandTotal || 0);
    const pendingAmount = parseFloat(pendingInvoices._sum.grandTotal || 0);
    const partialAmount = parseFloat(partialInvoices._sum.grandTotal || 0);
    const partialPaid = parseFloat(partialInvoices._sum.paymentReceived || 0);
    
    // Calculate overdue (invoices older than 30 days with pending/partial status)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const overdueInvoices = await prisma.invoice.aggregate({
      where: {
        date: {
          lt: thirtyDaysAgo,
        },
        status: {
          in: ['pending', 'partial'],
        },
      },
      _sum: {
        grandTotal: true,
        paymentReceived: true,
      },
      _count: true,
    });

    const overdueAmount = parseFloat(overdueInvoices._sum.grandTotal || 0) - parseFloat(overdueInvoices._sum.paymentReceived || 0);

    return {
      paid: {
        amount: paidAmount,
        count: paidInvoices._count,
      },
      pending: {
        amount: pendingAmount,
        count: pendingInvoices._count,
      },
      partial: {
        amount: partialAmount,
        paid: partialPaid,
        pending: partialAmount - partialPaid,
        count: partialInvoices._count,
      },
      overdue: {
        amount: overdueAmount,
        count: overdueInvoices._count,
      },
    };
  }

  /**
   * Get recent activity
   * @param {number} limit - Number of items to return (default: 10)
   * @returns {Promise<object>} Recent activity data
   */
  async getRecentActivity(limit = 10) {
    const [recentInward, recentOutward, recentInvoices, recentPayments] = await Promise.all([
      prisma.inwardEntry.findMany({
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          company: {
            select: {
              name: true,
            },
          },
        },
        select: {
          id: true,
          date: true,
          manifestNo: true,
          wasteName: true,
          quantity: true,
          unit: true,
          company: {
            select: {
              name: true,
            },
          },
          createdAt: true,
        },
      }),
      prisma.outwardEntry.findMany({
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          transporter: {
            select: {
              name: true,
            },
          },
        },
        select: {
          id: true,
          date: true,
          manifestNo: true,
          cementCompany: true,
          quantity: true,
          unit: true,
          transporter: {
            select: {
              name: true,
            },
          },
          createdAt: true,
        },
      }),
      prisma.invoice.findMany({
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          invoiceNo: true,
          type: true,
          date: true,
          customerName: true,
          grandTotal: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.invoice.findMany({
        where: {
          paymentReceived: {
            gt: 0,
          },
          paymentReceivedOn: {
            not: null,
          },
        },
        take: limit,
        orderBy: {
          paymentReceivedOn: 'desc',
        },
        select: {
          id: true,
          invoiceNo: true,
          customerName: true,
          paymentReceived: true,
          paymentReceivedOn: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      inward: recentInward.map((entry) => ({
        id: entry.id,
        type: 'inward',
        date: entry.date,
        description: `${entry.company.name} - ${entry.manifestNo}`,
        details: `${entry.quantity} ${entry.unit} of ${entry.wasteName}`,
        createdAt: entry.createdAt,
      })),
      outward: recentOutward.map((entry) => ({
        id: entry.id,
        type: 'outward',
        date: entry.date,
        description: `${entry.cementCompany} - ${entry.manifestNo}`,
        details: `${entry.quantity} ${entry.unit}${entry.transporter ? ` via ${entry.transporter.name}` : ''}`,
        createdAt: entry.createdAt,
      })),
      invoices: recentInvoices.map((invoice) => ({
        id: invoice.id,
        type: 'invoice',
        date: invoice.date,
        description: `Invoice ${invoice.invoiceNo}`,
        details: `${invoice.customerName || 'N/A'} - ₹${Number(invoice.grandTotal).toLocaleString()}`,
        status: invoice.status,
        createdAt: invoice.createdAt,
      })),
      payments: recentPayments.map((invoice) => ({
        id: invoice.id,
        type: 'payment',
        date: invoice.paymentReceivedOn,
        description: `Payment for Invoice ${invoice.invoiceNo}`,
        details: `${invoice.customerName || 'N/A'} - ₹${Number(invoice.paymentReceived).toLocaleString()}`,
        createdAt: invoice.createdAt,
      })),
    };
  }

  /**
   * Get waste flow chart data (monthly inward vs outward)
   * @param {number} year - Year to filter (default: current year)
   * @returns {Promise<array>} Monthly waste flow data
   */
  async getWasteFlowData(year = null) {
    const targetYear = year || new Date().getFullYear();
    const startOfYear = new Date(targetYear, 0, 1);
    const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59);

    // Get inward entries for the year
    const inwardEntries = await prisma.inwardEntry.findMany({
      where: {
        date: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
      select: {
        date: true,
        quantity: true,
        unit: true,
      },
    });

    // Get outward entries for the year
    const outwardEntries = await prisma.outwardEntry.findMany({
      where: {
        date: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
      select: {
        date: true,
        quantity: true,
        unit: true,
      },
    });

    // Helper function to convert to MT
    const toMT = (quantity, unit) => {
      if (unit === 'MT') return parseFloat(quantity);
      if (unit === 'Kg') return parseFloat(quantity) / 1000;
      if (unit === 'KL') return parseFloat(quantity); // Assuming KL ≈ MT for now
      return 0;
    };

    // Group by month
    const monthlyData = {};
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    // Initialize all months
    for (let i = 0; i < 12; i++) {
      monthlyData[i] = {
        month: monthNames[i],
        inward: 0,
        outward: 0,
      };
    }

    // Aggregate inward data
    inwardEntries.forEach((entry) => {
      const month = new Date(entry.date).getMonth();
      monthlyData[month].inward += toMT(entry.quantity, entry.unit);
    });

    // Aggregate outward data
    outwardEntries.forEach((entry) => {
      const month = new Date(entry.date).getMonth();
      monthlyData[month].outward += toMT(entry.quantity, entry.unit);
    });

    return Object.values(monthlyData);
  }
}

export default new DashboardService();

