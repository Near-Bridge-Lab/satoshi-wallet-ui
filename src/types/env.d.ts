declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_RUNTIME_ENV: 'development' | 'test' | 'production';
    NEXT_PUBLIC_NETWORK: NetworkId;

    NEXT_PUBLIC_AWS_S3_ORIGIN_URL: string;
    NEXT_PUBLIC_AWS_S3_URL: string;
    NEXT_PUBLIC_URL: string;
    NEXT_PUBLIC_API_URL: string;
  }
}
