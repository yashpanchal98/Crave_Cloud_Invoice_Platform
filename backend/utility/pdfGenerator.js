import PDFDocument from 'pdfkit';

const generateInvoicePDF = (order, stream) => {
  const doc = new PDFDocument({ margin: 50 });
  
  doc.pipe(stream);

  // Header
  doc.fontSize(24)
     .font('Helvetica-Bold')
     .text('Crave Cloud', { align: 'center' })
     .moveDown(0.3);
  
  doc.fontSize(10)
     .font('Helvetica')
     .text('Fresh Food Delivered Daily', { align: 'center' })
     .moveDown(2);

  // Invoice Details
  doc.fontSize(18)
     .font('Helvetica-Bold')
     .text('INVOICE', { align: 'center' })
     .moveDown(1);

  const invoiceY = doc.y;
  
  // Left side - Invoice info
  doc.fontSize(10)
     .font('Helvetica-Bold')
     .text('Invoice Number:', 50, invoiceY)
     .font('Helvetica')
     .text(order.invoiceNumber, 150, invoiceY);

  doc.font('Helvetica-Bold')
     .text('Date:', 50, invoiceY + 15)
     .font('Helvetica')
     .text(new Date(order.orderDate).toLocaleDateString(), 150, invoiceY + 15);

  // Right side - Client info
  doc.font('Helvetica-Bold')
     .text('Bill To:', 350, invoiceY)
     .font('Helvetica')
     .text(order.clientName, 350, invoiceY + 15);

  // Add client email and phone if available from populated client
  if (order.client && typeof order.client === 'object') {
    let yPos = invoiceY + 30;
    if (order.client.email) {
      doc.text(order.client.email, 350, yPos);
      yPos += 15;
    }
    if (order.client.phone) {
      doc.text(order.client.phone, 350, yPos);
    }
  }

  doc.moveDown(3);

  // Table Header
  const tableTop = doc.y;
  const itemX = 50;
  const quantityX = 250;
  const priceX = 350;
  const totalX = 450;

  doc.fontSize(10)
     .font('Helvetica-Bold');

  doc.text('Item Description', itemX, tableTop)
     .text('Quantity', quantityX, tableTop)
     .text('Unit Price', priceX, tableTop)
     .text('Total', totalX, tableTop);

  // Line under header
  doc.moveTo(50, tableTop + 15)
     .lineTo(550, tableTop + 15)
     .stroke();

  // Table Items
  let position = tableTop + 25;
  doc.font('Helvetica')
     .fontSize(9);

  order.items.forEach((item, index) => {
    doc.text(item.foodPacket, itemX, position)
       .text(item.quantity.toString(), quantityX, position)
       .text(`₹${item.unitPrice.toFixed(2)}`, priceX, position)
       .text(`₹${item.lineTotal.toFixed(2)}`, totalX, position);
    
    position += 25;
  });

  // Line before total
  doc.moveTo(50, position)
     .lineTo(550, position)
     .stroke();

  position += 15;

  // Grand Total
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .text('Grand Total:', priceX, position)
     .text(`₹${order.grandTotal.toFixed(2)}`, totalX, position);

  // Footer
  doc.fontSize(8)
     .font('Helvetica')
     .text('Thank you for your business!', 50, doc.page.height - 100, {
       align: 'center',
       width: 500
     })
     .text('For any queries, contact us at support@cloudkitchen.com', {
       align: 'center',
       width: 500
     });

  doc.end();
};

const generateConsolidatedInvoicePDF = (client, orders, stream) => {
  const doc = new PDFDocument({ margin: 50 });
  
  doc.pipe(stream);

  // Header
  doc.fontSize(24)
     .font('Helvetica-Bold')
     .text('Crave Cloud', { align: 'center' })
     .moveDown(0.3);
  
  doc.fontSize(10)
     .font('Helvetica')
     .text('Fresh Food Delivered Daily', { align: 'center' })
     .moveDown(2);

  // Consolidated Invoice Title
  doc.fontSize(18)
     .font('Helvetica-Bold')
     .text('CONSOLIDATED INVOICE', { align: 'center' })
     .moveDown(1);

  const invoiceY = doc.y;
  
  // Left side - Date range
  const startDate = new Date(orders[0].orderDate).toLocaleDateString();
  const endDate = new Date(orders[orders.length - 1].orderDate).toLocaleDateString();
  
  doc.fontSize(10)
     .font('Helvetica-Bold')
     .text('Period:', 50, invoiceY)
     .font('Helvetica')
     .text(`${startDate} to ${endDate}`, 150, invoiceY);

  doc.font('Helvetica-Bold')
     .text('Total Orders:', 50, invoiceY + 15)
     .font('Helvetica')
     .text(orders.length.toString(), 150, invoiceY + 15);

  // Right side - Client info
  doc.font('Helvetica-Bold')
     .text('Bill To:', 350, invoiceY)
     .font('Helvetica')
     .text(client.name, 350, invoiceY + 15);

  let yPos = invoiceY + 30;
  if (client.email) {
    doc.text(client.email, 350, yPos);
    yPos += 15;
  }
  if (client.phone) {
    doc.text(client.phone, 350, yPos);
  }

  doc.moveDown(3);

  // Summary by Date
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .text('Order Summary by Date', 50, doc.y)
     .moveDown(0.5);

  // Table Header
  const tableTop = doc.y;
  const dateX = 50;
  const invoiceNumX = 150;
  const itemsX = 300;
  const amountX = 450;

  doc.fontSize(10)
     .font('Helvetica-Bold');

  doc.text('Date', dateX, tableTop)
     .text('Invoice #', invoiceNumX, tableTop)
     .text('Items', itemsX, tableTop)
     .text('Amount', amountX, tableTop);

  // Line under header
  doc.moveTo(50, tableTop + 15)
     .lineTo(550, tableTop + 15)
     .stroke();

  // Table Items
  let position = tableTop + 25;
  doc.font('Helvetica')
     .fontSize(9);

  let grandTotal = 0;

  orders.forEach((order, index) => {
    const orderDate = new Date(order.orderDate).toLocaleDateString();
    const itemCount = order.items.length;
    
    doc.text(orderDate, dateX, position)
       .text(order.invoiceNumber, invoiceNumX, position)
       .text(`${itemCount} item(s)`, itemsX, position)
       .text(`₹${order.grandTotal.toFixed(2)}`, amountX, position);
    
    grandTotal += order.grandTotal;
    position += 20;

    // Add new page if needed
    if (position > doc.page.height - 150) {
      doc.addPage();
      position = 50;
    }
  });

  // Line before total
  doc.moveTo(50, position)
     .lineTo(550, position)
     .stroke();

  position += 15;

  // Grand Total
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .text('Grand Total:', amountX - 100, position)
     .text(`₹${grandTotal.toFixed(2)}`, amountX, position);

  // Detailed Items (New Page)
  doc.addPage();
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .text('Detailed Item List', 50, 50)
     .moveDown(1);

  let detailPosition = doc.y;

  orders.forEach((order, orderIndex) => {
    // Order header
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .text(`Order ${orderIndex + 1} - ${new Date(order.orderDate).toLocaleDateString()} (${order.invoiceNumber})`, 50, detailPosition)
       .moveDown(0.5);

    detailPosition = doc.y;

    // Item table header
    doc.fontSize(9)
       .font('Helvetica-Bold')
       .text('Item', 60, detailPosition)
       .text('Qty', 300, detailPosition)
       .text('Price', 370, detailPosition)
       .text('Total', 450, detailPosition);

    detailPosition += 15;
    doc.moveTo(60, detailPosition)
       .lineTo(550, detailPosition)
       .stroke();

    detailPosition += 10;

    // Items
    doc.font('Helvetica')
       .fontSize(8);

    order.items.forEach(item => {
      doc.text(item.foodPacket, 60, detailPosition)
         .text(item.quantity.toString(), 300, detailPosition)
         .text(`₹${item.unitPrice.toFixed(2)}`, 370, detailPosition)
         .text(`₹${item.lineTotal.toFixed(2)}`, 450, detailPosition);

      detailPosition += 15;

      // Add new page if needed
      if (detailPosition > doc.page.height - 100) {
        doc.addPage();
        detailPosition = 50;
      }
    });

    // Order subtotal
    doc.fontSize(9)
       .font('Helvetica-Bold')
       .text('Subtotal:', 370, detailPosition)
       .text(`₹${order.grandTotal.toFixed(2)}`, 450, detailPosition);

    detailPosition += 30;

    // Add new page if needed for next order
    if (detailPosition > doc.page.height - 200) {
      doc.addPage();
      detailPosition = 50;
    }
  });

  // Footer
  doc.fontSize(8)
     .font('Helvetica')
     .text('Thank you for your continued business!', 50, doc.page.height - 100, {
       align: 'center',
       width: 500
     })
     .text('For any queries, contact us at support@cloudkitchen.com', {
       align: 'center',
       width: 500
     });

  doc.end();
};

export { generateInvoicePDF, generateConsolidatedInvoicePDF };

