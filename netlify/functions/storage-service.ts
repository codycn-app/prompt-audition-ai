
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Khởi tạo S3 Client kết nối tới Cloudflare R2
// Lưu ý: Các biến môi trường (process.env) sẽ được lấy từ Netlify Dashboard
const S3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

export const handler = async (event: any) => {
  // Chỉ chấp nhận method POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { action, key, bucket, contentType } = JSON.parse(event.body);

    if (action === 'upload') {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
      });
      // Tạo URL có hiệu lực trong 1 giờ
      const signedUrl = await getSignedUrl(S3, command, { expiresIn: 3600 });
      
      return {
        statusCode: 200,
        body: JSON.stringify({ signedUrl }),
        headers: { "Content-Type": "application/json" }
      };
    }
    
    if (action === 'delete') {
      await S3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Deleted" }),
        headers: { "Content-Type": "application/json" }
      };
    }

    return { statusCode: 400, body: JSON.stringify({ error: "Invalid action" }) };

  } catch (err: any) {
    console.error("R2 Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
