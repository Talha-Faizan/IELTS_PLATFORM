const { S3Client } = require("@aws-sdk/client-s3");

let s3Client = null;

function getS3Client() {
  if (s3Client) return s3Client;

  const config = {
    region: process.env.AWS_REGION || "ap-south-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  };

  // Use custom endpoint for Cloudflare R2 or MinIO
  if (process.env.AWS_ENDPOINT) {
    config.endpoint = process.env.AWS_ENDPOINT;
    config.forcePathStyle = true; // Required for R2/MinIO
  }

  s3Client = new S3Client(config);
  return s3Client;
}

module.exports = { getS3Client };
