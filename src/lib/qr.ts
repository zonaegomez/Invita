import QRCode from "qrcode";

/** Genera el QR como data URL en el propio cliente (sin depender de un
 * servicio de terceros al que se le enviaría la URL de la invitación). */
export async function generateQrDataUrl(data: string): Promise<string> {
  return QRCode.toDataURL(data, { width: 320, margin: 1, color: { dark: "#111111", light: "#ffffff" } });
}
