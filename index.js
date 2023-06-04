const usb = require('usb');

// Function to find the product ID of the USB printer
function findPrinterProductId() {
  const devices = usb.getDeviceList();
  
  for (const device of devices) {
    const { deviceDescriptor } = device;

    // Check if the device is a printer by inspecting the device descriptor
    if (deviceDescriptor.bDeviceClass === usb.LIBUSB_CLASS_PRINTER) {
      return deviceDescriptor.idProduct;
    }
  }
  
  return null; // Printer not found
}

// Auto-detect the product ID of the USB printer
const productId = findPrinterProductId();
if (!productId) {
  console.log('USB printer not found.');
  process.exit(1);
}

// Sample HTML content to print
const HTML_CONTENT = '<h1>Sample HTML Content</h1><p>This is some <strong>bold</strong> and <em>italic</em> text.</p>';

// Function to convert HTML to plain text
function htmlToPlainText(html) {
  // Remove HTML tags using a regular expression
  const strippedText = html.replace(/<[^>]+>/g, '');

  // Replace HTML entities with their corresponding characters
  const entities = {
    '&lt;': '<',
    '&gt;': '>',
    '&amp;': '&',
    '&quot;': '"',
    '&apos;': "'",
    '&nbsp;': ' ',
    // Add more entities as needed
  };
  const plainText = strippedText.replace(/&[a-z]+;/g, match => entities[match] || match);

  return plainText;
}

// Convert HTML content to plain text
const plainText = htmlToPlainText(HTML_CONTENT);

// ESC/POS command for printing plain text
const COMMAND = Buffer.from([
  0x1B, 0x40, // Initialize printer
  0x1B, 0x21, 0x00, // Set character size to normal
]);

// Append the plain text to the command buffer
const data = Buffer.concat([COMMAND, Buffer.from(plainText)]);

// Find and open the USB printer
const printer = usb.findByIds(0, productId);
if (!printer) {
  console.log('USB printer not found.');
  process.exit(1);
}
printer.open();

// Claim the interface and endpoint
const iface = printer.interface(0);
iface.claim();
const endpoint = iface.endpoint(0x01);

// Send the ESC/POS command with plain text to the printer
endpoint.transfer(data, (error) => {
  if (error) {
    console.error('Error sending command:', error);
  } else {
    console.log('Command sent successfully.');
  }

  // Release the claimed interface and close the USB connection
  iface.release();
  printer.close();
});
