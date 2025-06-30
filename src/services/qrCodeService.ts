export const generateQRCode = async (text: string): Promise<string> => {
  try {
    const encodedText = encodeURIComponent(text);
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedText}`;
    return qrCodeUrl;
  } catch (error) {
    console.error('Fehler beim Generieren des QR-Codes:', error);
    return '';
  }
};

export const generateQRCodeHTML = async (url: string): Promise<string> => {
  const qrCodeUrl = await generateQRCode(url);
  return `
    <div style="text-align: center; margin: 20px 0; padding: 20px; background-color: #f5f5f5; border-radius: 8px;">
      <p style="margin-bottom: 10px; font-weight: bold;">QR-Code scannen für schnellen Zugriff:</p>
      <img src="${qrCodeUrl}" alt="QR Code" style="width: 200px; height: 200px; border: 2px solid #8BC34A; padding: 10px; background: white;" />
    </div>
  `;
};