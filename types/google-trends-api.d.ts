declare module "google-trends-api" {
  // Minimal typings for what we use
  interface InterestOverTimeOptions {
    keyword: string | string[];
    geo?: string;
    category?: number;
    hl?: string;
    timezone?: number;
    granularTimeResolution?: boolean;
    startTime?: Date;
    endTime?: Date;
  }

  const googleTrends: {
    interestOverTime(options: InterestOverTimeOptions): Promise<string>;
    // You can add more methods later if needed:
    // relatedQueries?(options: any): Promise<string>;
    // relatedTopics?(options: any): Promise<string>;
    // interestByRegion?(options: any): Promise<string>;
  };

  export = googleTrends; // CommonJS export
}
