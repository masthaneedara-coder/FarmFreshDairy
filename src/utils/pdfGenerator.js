import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export async function downloadInvoicePDF(bill) {
  const invoice = document.getElementById("invoice");

  if (!invoice) {
    alert("Invoice element not found.");
    return;
  }

  const canvas = await html2canvas(invoice, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
  });

  const image = canvas.toDataURL("image/png");

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();

  const pageHeight =
    (canvas.height * pageWidth) /
    canvas.width;

  pdf.addImage(
    image,
    "PNG",
    0,
    0,
    pageWidth,
    pageHeight
  );

  const invoiceNo =
    bill.invoiceNumber ||
    `INV-${String(bill.id).slice(0, 8)}`;

  pdf.save(`FarmFresh_${invoiceNo}.pdf`);
}