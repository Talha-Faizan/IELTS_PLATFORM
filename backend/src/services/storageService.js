"use strict";

const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { getS3Client } = require("../config/s3");
const { v4: uuidv4 } = require("uuid");
const logger = require("../config/logger");

const BUCKET = process.env.AWS_BUCKET_NAME || "ielts-audio-files";
const SIGNED_URL_EXPIRY = 3600; // 1 hour

/**
 * Upload a buffer to S3/R2
 * @param {Buffer} buffer - File data
 * @param {string} folder - e.g. "speaking/userId"
 * @param {string} mimeType - e.g. "audio/webm"
 * @returns {Promise<{key: string, url: string}>}
 */
async function uploadAudio(buffer, folder, mimeType = "audio/webm") {
  const s3 = getS3Client();
  const ext = mimeType.split("/")[1] || "webm";
  const key = `${folder}/${uuidv4()}.${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      // Server-side encryption
      ServerSideEncryption: "AES256",
      // No public access — always use pre-signed URLs
    })
  );

  logger.info("Audio uploaded to S3", { key });
  return { key };
}

/**
 * Generate a pre-signed download URL (expires in 1 hour)
 * @param {string} key - S3 object key
 * @returns {Promise<string>} Pre-signed URL
 */
async function getPresignedUrl(key) {
  const s3 = getS3Client();
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3, command, { expiresIn: SIGNED_URL_EXPIRY });
}

/**
 * Delete an object from S3
 * @param {string} key
 */
async function deleteObject(key) {
  const s3 = getS3Client();
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    logger.info("S3 object deleted", { key });
  } catch (err) {
    logger.error("S3 delete error:", { key, error: err.message });
  }
}

module.exports = { uploadAudio, getPresignedUrl, deleteObject };
