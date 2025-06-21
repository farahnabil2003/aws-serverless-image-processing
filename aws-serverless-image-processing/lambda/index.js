const AWS = require('aws-sdk');
const S3 = new AWS.S3();
const Jimp = require('jimp');

exports.handler = async (event) => {
  console.log("EVENT:", JSON.stringify(event, null, 2));

  try {
    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    const outputBucket = 'farah-processed-images';

    console.log(`Downloading image from: ${bucket}/${key}`);
    const s3Object = await S3.getObject({ Bucket: bucket, Key: key }).promise();
    console.log(`Downloaded image, size: ${s3Object.ContentLength}`);

    console.log("Reading image with Jimp...");
    const image = await Jimp.read(s3Object.Body);
    console.log("Resizing image...");
    image.resize(300, 300);

    console.log("Converting to buffer...");
    const buffer = await image.getBufferAsync(Jimp.MIME_JPEG);
    console.log("Buffer size:", buffer.length);

    console.log("Uploading resized image...");
    await S3.putObject({
      Bucket: outputBucket,
      Key: `resized-${key}`,
      Body: buffer,
      ContentType: 'image/jpeg'
    }).promise();

    console.log(`Image processed and saved to ${outputBucket}/resized-${key}`);

    return {
      statusCode: 200,
      body: `Image ${key} processed and saved to ${outputBucket}`
    };

  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: `Error processing image: ${error.message}`
    };
  }
};
