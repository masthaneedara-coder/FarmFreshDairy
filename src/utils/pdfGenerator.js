import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * Get invoice DOM element
 */
function getInvoiceElement(elementOrId = "invoice") {
  if (typeof elementOrId === "string") {
    return document.getElementById(elementOrId);
  }

  return elementOrId;
}

/**
 * Create PDF from invoice element
 */
async function createInvoicePDF(bill, elementOrId = "invoice") {
  const invoice = getInvoiceElement(elementOrId);

  if (!invoice) {
    throw new Error("Invoice element not found.");
  }

  const canvas = await html2canvas(invoice, {
    scale: Math.min(window.devicePixelRatio || 2, 2),
    useCORS: true,
    allowTaint: false,
    backgroundColor: "#ffffff",
    logging: false,
    scrollX: 0,
    scrollY: -window.scrollY,
    windowWidth: invoice.scrollWidth,
    windowHeight: invoice.scrollHeight,
  });

  const image = canvas.toDataURL("image/jpeg", 0.95);

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const margin = 8;

  const usableWidth = pageWidth - margin * 2;
  const usableHeight = pageHeight - margin * 2;

  const imageHeight =
    (canvas.height * usableWidth) / canvas.width;

  let heightLeft = imageHeight;
  let position = margin;

  // First page
  pdf.addImage(
    image,
    "JPEG",
    margin,
    position,
    usableWidth,
    imageHeight,
    undefined,
    "FAST"
  );

  heightLeft -= usableHeight;

  // Additional pages
  while (heightLeft > 0) {
    position =
      margin -
      (imageHeight - heightLeft);

    pdf.addPage();

    pdf.addImage(
      image,
      "JPEG",
      margin,
      position,
      usableWidth,
      imageHeight,
      undefined,
      "FAST"
    );

    heightLeft -= usableHeight;
  }

  const invoiceNo =
    bill?.invoiceNumber ||
    bill?.invoice_number ||
    `INV-${String(bill?.id || "000000").slice(
      0,
      8
    )}`;

  return {
    pdf,
    invoiceNo,
    filename: `FarmFresh_${invoiceNo}.pdf`,
  };
}

/**
 * Download Invoice PDF
 */
export async function downloadInvoicePDF(
  bill,
  elementOrId = "invoice"
) {
  try {
    const { pdf, filename } =
      await createInvoicePDF(
        bill,
        elementOrId
      );

    pdf.save(filename);

    return {
      success: true,
      filename,
    };
  } catch (error) {
    console.error(
      "Invoice PDF Error:",
      error
    );

    alert(
      error?.message ||
        "Failed to generate invoice PDF."
    );

    return {
      success: false,
      error,
    };
  }
}

/**
 * Share Invoice PDF
 *
 * Uses the mobile native Share Sheet when supported.
 */
export async function shareInvoicePDF(
  bill,
  elementOrId = "invoice"
) {
  try {
    const { pdf, filename } =
      await createInvoicePDF(
        bill,
        elementOrId
      );

    const blob = pdf.output("blob");

    const file = new File(
      [blob],
      filename,
      {
        type: "application/pdf",
      }
    );

    // Mobile browser supports file sharing
    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({
        files: [file],
      })
    ) {
      await navigator.share({
        title: "Farm Fresh Dairy Invoice",
        text: `Farm Fresh Dairy Invoice ${bill?.invoiceNumber || ""}`,
        files: [file],
      });

      return {
        success: true,
        shared: true,
      };
    }

    // Browser supports share but not files
    if (navigator.share) {
      await navigator.share({
        title: "Farm Fresh Dairy Invoice",
        text: `Farm Fresh Dairy Invoice ${
          bill?.invoiceNumber || ""
        }`,
      });

      return {
        success: true,
        shared: true,
      };
    }

    // Desktop fallback
    pdf.save(filename);

    alert(
      "File sharing is not supported on this browser. The PDF has been downloaded instead."
    );

    return {
      success: true,
      shared: false,
      downloaded: true,
    };
  } catch (error) {
    // User cancelled share sheet
    if (error?.name === "AbortError") {
      return {
        success: false,
        cancelled: true,
      };
    }

    console.error(
      "Invoice Share Error:",
      error
    );

    alert(
      "Unable to share the invoice PDF."
    );

    return {
      success: false,
      error,
    };
  }
}

/**
 * Print Invoice
 */
export async function printInvoice(
  bill,
  elementOrId = "invoice"
) {
  try {
    const invoice =
      getInvoiceElement(elementOrId);

    if (!invoice) {
      throw new Error(
        "Invoice element not found."
      );
    }

    const printWindow =
      window.open(
        "",
        "_blank",
        "width=900,height=700"
      );

    if (!printWindow) {
      alert(
        "Please allow pop-ups to print the invoice."
      );
      return {
        success: false,
      };
    }

    const styles = `
      <style>
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          padding: 20px;
          background: #ffffff;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
          color: #111827;
        }

        img {
          max-width: 100%;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th,
        td {
          padding: 8px;
        }

        @page {
          size: A4;
          margin: 10mm;
        }

        @media print {
          body {
            padding: 0;
          }

          .no-print {
            display: none !important;
          }
        }
      </style>
    `;

    printWindow.document.open();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>
            Farm Fresh Dairy Invoice
          </title>

          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />

          ${styles}
        </head>

        <body>
          ${invoice.outerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();

    // Wait for images/content
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();

      setTimeout(() => {
        printWindow.close();
      }, 500);
    }, 700);

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "Invoice Print Error:",
      error
    );

    alert(
      "Unable to print invoice."
    );

    return {
      success: false,
      error,
    };
  }
}