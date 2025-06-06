import {
  PutObjectCommand,
  DeleteObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";

const MEDIA_ROOT_URL = "https://eis-media.object.pscloud.io";
const ENDPOINT = "https://object.pscloud.io";

async function convertToWebp(fileBuffer, width) {
  try {
    if (typeof width !== "undefined") {
      return await sharp(fileBuffer).resize(width).toFormat("webp").toBuffer();
    }
    return await sharp(fileBuffer).toFormat("webp").toBuffer();
  } catch (error) {
    console.error(error);
    throw new Error("Error converting to WebP:", error.message);
  }
}

export async function uploadToS3(file, folder, width) {
  const s3Client = new S3Client({
    endpoint: ENDPOINT, // Find your endpoint in the control panel, under Settings. Prepend "https://".
    forcePathStyle: false, // Configures to use subdomain/virtual calling format.
    region: "us-east-1", // Must be "us-east-1" when creating new Spaces. Otherwise, use the region in your endpoint (for example, nyc3).
    credentials: {
      accessKeyId: process.env.SPACES_KEY, // Access key pair. You can create access key pairs using the control panel or API.
      secretAccessKey: process.env.SPACES_SECRET, // Secret access key defined through an environment variable.
    },
  });

  const objectKey = `${folder}/${uuidv4()}_${
    file.originalname.split(".")[0]
  }.webp`;

  let fileBuffer = file.buffer;

  const webpBuffer = await convertToWebp(fileBuffer, width);

  const params = {
    Bucket: "eis-media",
    Key: objectKey,
    Body: webpBuffer,
    ACL: "public-read",
    ContentType: "image/webp",
  };

  const command = new PutObjectCommand(params);

  try {
    await s3Client.send(command);
    console.log("Uploaded to s3 successfully!!!");
    return `${MEDIA_ROOT_URL}/${objectKey}`;
  } catch (error) {
    console.error("Error uploading object", error);
    return null;
  }
}

export const deleteImageFromS3 = async (imageKey) => {
  const s3Client = new S3Client({
    endpoint: ENDPOINT, // Find your endpoint in the control panel, under Settings. Prepend "https://".
    forcePathStyle: false, // Configures to use subdomain/virtual calling format.
    region: "us-east-1", // Must be "us-east-1" when creating new Spaces. Otherwise, use the region in your endpoint (for example, nyc3).
    credentials: {
      accessKeyId: process.env.SPACES_KEY, // Access key pair. You can create access key pairs using the control panel or API.
      secretAccessKey: process.env.SPACES_SECRET, // Secret access key defined through an environment variable.
    },
  });
  const deleteParams = {
    Bucket: "eis-media",
    Key: imageKey,
  };

  try {
    await s3Client.send(new DeleteObjectCommand(deleteParams));
    console.log("Image successfully deleted from S3:", imageKey);
  } catch (err) {
    console.error("Error deleting image from S3:", err);
    throw err; // Rethrow to handle the error in the calling function
  }
};

const storage = multer.memoryStorage();
export const upload = multer({ storage: storage });
