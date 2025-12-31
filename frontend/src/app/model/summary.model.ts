export interface SummaryRequest {
  subject: string;
  module:  string;
}

export interface SummaryResponse {
  path: string;
  data: {
    title:  string;
    slides: { [key: string]: string }[];
  };
}

export interface SummaryElementDTO {
    id?: string;
    content: string;
}
