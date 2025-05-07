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
    // 複数の検索条件を組み合わせて検索
    // 1. folderが'photo-share'であること
    // 2. filenameがprefixで始まること（IDで検索）
    const searchExpression = `folder:photo-share AND filename:${prefix}*`;
    console.log('Search expression:', searchExpression);
    
    cloudinary.search
      .expression(searchExpression)
      .sort_by('created_at', 'desc')
      .max_results(5) // 複数の結果を取得して確認
      .with_field('tags') // タグ情報も取得
      .with_field('filename') // ファイル名も取得
      .execute()
      .then(result => {
        console.log('Cloudinary search result count:', result.resources?.length || 0);
        console.log('Cloudinary search result:', JSON.stringify(result, null, 2));
        
        // 検索結果がない場合は、より広い条件で再検索
        if (!result.resources || result.resources.length === 0) {
          console.log('No results found with filename search, trying with public_id');
          
          // public_idで検索（フォルダパスを含む完全なパス）
          cloudinary.search
            .expression(`public_id:photo-share*/${prefix}*`)
            .sort_by('created_at', 'desc')
            .max_results(5)
            .execute()
            .then(fallbackResult => {
              console.log('Fallback search result count:', fallbackResult.resources?.length || 0);
              resolve(fallbackResult);
            })
            .catch(fallbackError => {
              console.error('Fallback search error:', fallbackError);
              reject(fallbackError);
            });
        } else {
          resolve(result);
        }
      })
      .catch(error => {
        console.error('Cloudinary search error:', error);
        reject(error);
      });
  });
}