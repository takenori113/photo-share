import { v2 as cloudinary } from 'cloudinary';

// Cloudinaryの設定
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
  secure: true,
});

export default cloudinary;

// 画像をアップロードする関数
export async function uploadImage(file: Buffer, options: { folder: string, public_id?: string }) {
  return new Promise<{ url: string, public_id: string }>((resolve, reject) => {
    // Bufferをbase64エンコードしてCloudinaryにアップロード
    const base64Data = `data:image/jpeg;base64,${file.toString('base64')}`;
    
    cloudinary.uploader.upload(
      base64Data,
      {
        folder: options.folder,
        public_id: options.public_id,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        
        if (!result) {
          reject(new Error('アップロード結果が空です'));
          return;
        }
        
        resolve({
          url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );
  });
}

// 画像を検索する関数
export async function findImagesByPrefix(prefix: string) {
  return new Promise<{ resources: Array<{ url: string, public_id: string }> }>((resolve, reject) => {
    // フォルダを含めた完全なパスで検索
    // Cloudinaryでは、フォルダを含めた完全なパスがpublic_idになる
    cloudinary.search
      .expression(`public_id:photo-share/${prefix}*`)
      .sort_by('created_at', 'desc')
      .max_results(1)
      .execute()
      .then(result => {
        console.log('Cloudinary search result:', JSON.stringify(result));
        resolve(result);
      })
      .catch(error => {
        console.error('Cloudinary search error:', error);
        reject(error);
      });
  });
}