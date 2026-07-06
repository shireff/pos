/**
 * DateTime value object wraps standard Dates to guarantee timezone-safe (UTC-first) behavior.
 * By default, formats to the Africa/Cairo timezone.
 */
export class DateTime {
  private readonly date: Date;

  private constructor(date: Date) {
    if (isNaN(date.getTime())) {
      throw new Error('Invalid Date');
    }
    // Store as UTC date representation
    this.date = date;
  }

  public static now(): DateTime {
    return new DateTime(new Date());
  }

  public static fromIso(isoString: string): DateTime {
    return new DateTime(new Date(isoString));
  }

  public static fromDate(date: Date): DateTime {
    return new DateTime(new Date(date.getTime()));
  }

  public toIso(): string {
    return this.date.toISOString();
  }

  public toDate(): Date {
    return new Date(this.date.getTime());
  }

  /**
   * Renders the UTC timestamp to Africa/Cairo local time string.
   */
  public toCairoString(): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Cairo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
      .format(this.date)
      .replace(', ', ' ');
  }

  public equals(other: DateTime): boolean {
    return this.date.getTime() === other.date.getTime();
  }

  public isBefore(other: DateTime): boolean {
    return this.date.getTime() < other.date.getTime();
  }

  public isAfter(other: DateTime): boolean {
    return this.date.getTime() > other.date.getTime();
  }
}
