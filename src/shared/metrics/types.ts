export type MetricType =
  | 'fe_upload'
  | 'fe_render'
  | 'fe_field_accuracy'
  | 'fe_chat_send_latency'
  | 'fe_chat_receive_latency'
  | 'fe_chat_e2e_latency'
  | 'fe_mentor_list_render'
  | 'web_vitals';

export interface MetricData {
  [key: string]: any;
}

export interface WebVitalsMetricPayload {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
  pathname: string;
}

// CloudWatch Dimension 타입
export interface MetricDimension {
  Name: string;
  Value: string;
}
