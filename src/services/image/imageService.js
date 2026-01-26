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
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload only images.'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

/**
 * Extract S3 key from full URL
 * Example: https://bucket.s3.region.amazonaws.com/users/profile-images/small/uuid.jpg
 * Returns: users/profile-images/small/uuid.jpg
 */
const extractS3KeyFromUrl = (url) => {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    // Remove leading slash if present
    return urlObj.pathname.startsWith('/') 
      ? urlObj.pathname.slice(1) 
      : urlObj.pathname;
  } catch (error) {
    console.error('Invalid URL:', url);
    return null;
  }
};
/*
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
    const key = `profile-pics/${size}/${fileName}`;
    
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
*/

export const processAndUploadImage = async (file) => {
  // Even though frontend compressed, still validate on backend
  const imageMetadata = await sharp(file.buffer).metadata();
  const { width, height } = imageMetadata;

  console.log(`📐 Received image: ${width}x${height}, ${(file.size / 1024).toFixed(2)}KB`);

  // Validate minimum dimensions (backend security check)
  const minDimension = Math.min(width, height);
  if (minDimension < 300) {
    throw new Error(
      `Image too small (${width}x${height}). Minimum 300x300 pixels required.`
    );
  }

  const fileExtension = file.mimetype.split('/')[1];
  const fileName = `${uuidv4()}.webp`; // Always use .jpg after processing
  const uploadPromises = [];
  const imageUrls = {};

  for (const [size, dimensions] of Object.entries(IMAGE_SIZES)) {
    // Create optimized version for each size
    const resizedBuffer = await sharp(file.buffer)
      .resize(dimensions.width, dimensions.height, {
        fit: 'cover',
        position: 'center',
        withoutEnlargement: true,
      })
      // .jpeg({ 
      //   quality: 85,
      //   progressive: true, // Progressive JPEG for better loading
      // })
      .webp({ 
        quality: 85,
        lossless: true, // Lossless WEBP
      })
      .toBuffer();

    const key = `profile-pics/${size}/${fileName}`;
    
    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: resizedBuffer,
      ContentType: 'image/webp',
      CacheControl: 'max-age=31536000', // Cache for 1 year
    };

    const uploadPromise = s3ClientService
      .send(new PutObjectCommand(uploadParams))
      .then(() => {
        imageUrls[`image${size.charAt(0).toUpperCase() + size.slice(1)}`] = 
          `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
      });

    uploadPromises.push(uploadPromise);
  }

  await Promise.all(uploadPromises);
  
  console.log('✅ All image sizes uploaded to S3');
  return imageUrls;
};

/**
 * Delete a single image from S3
 */
const deleteFromS3 = async (url) => {
  const key = extractS3KeyFromUrl(url);
  if (!key) return;

  try {
    const deleteParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
    };

    await s3ClientService.send(new DeleteObjectCommand(deleteParams));
    console.log(`✅ Deleted from S3: ${key}`);
  } catch (error) {
    console.error(`❌ Failed to delete from S3: ${key}`, error.message);
    // Don't throw - continue deleting other images even if one fails
  }
};

/**
 * Delete all three image sizes from S3
 * @param {Object} imageUrls - Object with imageSmall, imageMedium, imageLarge
 */
export const deleteImagesFromS3 = async (imageUrls) => {
  if (!imageUrls) return;

  const deletePromises = [];

  if (imageUrls.imageSmall) {
    deletePromises.push(deleteFromS3(imageUrls.imageSmall));
  }
  if (imageUrls.imageMedium) {
    deletePromises.push(deleteFromS3(imageUrls.imageMedium));
  }
  if (imageUrls.imageLarge) {
    deletePromises.push(deleteFromS3(imageUrls.imageLarge));
  }

  await Promise.all(deletePromises);
  console.log('✅ All images deleted from S3');
};

/**
 * Delete images for a specific user
 * Useful when you have userId but not the image URLs
 */
export const deleteUserImagesFromS3 = async (user) => {
  if (!user) return;

  const imageUrls = {
    imageSmall: user.imageSmall,
    imageMedium: user.imageMedium,
    imageLarge: user.imageLarge,
  };

  await deleteImagesFromS3(imageUrls);
};