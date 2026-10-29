// RFID Card Reader Adapter Module
// Isolated adapter interface for keyboard-simulated RFID card scans and hardware terminal polling.

export interface RfidScanEvent {
  cardUid: string;
  timestamp: string;
  isSimulated: boolean;
}

export class RfidCardAdapter {
  private lastScannedCardUid: string | null = null;

  /**
   * Parse RFID Card Scan Event from keyboard trigger or hardware port
   */
  public parseCardScan(cardUid: string): RfidScanEvent {
    this.lastScannedCardUid = cardUid;
    return {
      cardUid,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      isSimulated: true,
    };
  }

  /**
   * Format Card UID to standardized hexadecimal format (e.g. A7:B2:91:4C)
   */
  public formatCardUid(rawInput: string): string {
    const cleaned = rawInput.replace(/[^A-Fa-f0-9]/g, '').toUpperCase();
    if (cleaned.length >= 8) {
      return `${cleaned.slice(0, 2)}:${cleaned.slice(2, 4)}:${cleaned.slice(4, 6)}:${cleaned.slice(6, 8)}`;
    }
    return rawInput;
  }

  public getLastScannedCardUid(): string | null {
    return this.lastScannedCardUid;
  }
}

export const rfidCardAdapter = new RfidCardAdapter();
