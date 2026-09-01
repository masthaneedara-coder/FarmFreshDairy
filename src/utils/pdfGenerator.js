import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export async function downloadInvoicePDF(bill) {
  const invoice = document.getElementById("invoice");

  if (!invoice) {
    alert("Invoice element not found.");
    return;
  }

  try {
    const canvas = await html2canvas(invoice, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    const image = canvas.toDataURL("image/png");

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Small margins
    const margin = 8;

    const usableWidth = pageWidth - margin * 2;

    // Calculate image height based on width
    const imageHeight =
      (canvas.height * usableWidth) / canvas.width;

    let heightLeft = imageHeight;
    let position = margin;

    // First page
    pdf.addImage(
      image,
      "PNG",
      margin,
      position,
      usableWidth,
      imageHeight
    );

    heightLeft -= pageHeight - margin * 2;

    // Additional pages
    while (heightLeft > 0) {
      position =
        heightLeft - imageHeight + margin;

      pdf.addPage();

      pdf.addImage(
        image,
        "PNG",
        margin,
        position,
        usableWidth,
        imageHeight
      );

      heightLeft -= pageHeight - margin * 2;
    }

    const invoiceNo =
      bill.invoiceNumber ||
      `INV-${String(bill.id).slice(0, 8)}`;

    pdf.save(`FarmFresh_${invoiceNo}.pdf`);

  } catch (error) {
    console.error(
      "Invoice PDF Error:",
      error
    );

    alert("Failed to generate invoice PDF.");
  }
}