export function printInvoice() {
  const invoice = document.getElementById("invoice");

  if (!invoice) {
    alert("Invoice not found.");
    return;
  }

  const printWindow = window.open("", "_blank", "width=900,height=700");

  if (!printWindow) {
    alert("Unable to open print window.");
    return;
  }

  printWindow.document.write(`
    <html>
      <head>
        <title>Farm Fresh Dairy Invoice</title>

        <style>
          body{
            margin:0;
            padding:20px;
            font-family:Arial,sans-serif;
            background:#ffffff;
          }

          *{
            box-sizing:border-box;
          }

          table{
            width:100%;
            border-collapse:collapse;
          }

          table,
          th,
          td{
            border:1px solid #ddd;
          }

          th,
          td{
            padding:8px;
          }

          h1,h2,h3,h4{
            margin:0;
          }
        </style>
      </head>

      <body>
        ${invoice.innerHTML}
      </body>
    </html>
  `);

  printWindow.document.close();

  printWindow.focus();

  printWindow.print();

  printWindow.close();
}