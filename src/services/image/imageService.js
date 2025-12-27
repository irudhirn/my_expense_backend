import sharp from "sharp";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

import multer from "multer";

const multerStorage = multer.memoryStorage();

const s3ClientService = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const IMAGE_SIZES = {
  small: { width: 60, height: 60 },
  medium: { width: 150, height: 150 },
  large: { width: 300, height: 300 },
};

export const upload = multer({
  storage: multerStorage,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

export const processAndUploadImage = async (file) => {
  const fileExtension = file.mimetype.split('/')[1];
  const fileName = `${uuidv4()}.${fileExtension}`;
  const uploadPromises = [];
  const imageUrls = {};

  for (const [size, dimensions] of Object.entries(IMAGE_SIZES)) {
    // Resize image
    const resizedBuffer = await sharp(file.buffer)
      .resize(dimensions.width, dimensions.height, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 85 }) // or .webp({ quality: 85 })
      .toBuffer();

    // Prepare S3 upload
    const key = `users/profile-images/${size}/${fileName}`;
    
    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: resizedBuffer,
      ContentType: file.mimetype,
      // ACL: 'public-read', // Only if you want public access
    };

    // Upload to S3
    const uploadPromise = s3ClientService
      .send(new PutObjectCommand(uploadParams))
      .then(() => {
        // Generate URL
        imageUrls[`image${size.charAt(0).toUpperCase() + size.slice(1)}`] = 
          `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
      });

    uploadPromises.push(uploadPromise);
  }

  await Promise.all(uploadPromises);
  
  return imageUrls; // { imageSmall, imageMedium, imageLarge }
}

export const deleteImageFromS3 = async (imageUrls) => {
  
}
