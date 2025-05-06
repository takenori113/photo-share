import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { Photo } from '@/app/types';
import { uploadImage } from '@/app/lib/cloudinary';

// CORSヘッダーを設定する関数
function setCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}

// OPTIONSリクエストに対応するハンドラ
export async function OPTIONS() {
  const response = NextResponse.json({}, { status: 200 });
  return setCorsHeaders(response);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('photo') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'ファイルがアップロードされていません' },
        { status: 400 }
      );
    }
    
    // ファイルタイプの検証
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: '画像ファイルのみアップロードできます' },
        { status: 400 }
      );
    }
    
    // ファイルサイズの検証 (10MB以下)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'ファイルサイズは10MB以下にしてください' },
        { status: 400 }
      );
    }
    
    // 一意のIDを生成
    const id = uuidv4();
    
    // 元のファイル名を保持
    const originalFilename = file.name;
    
    // Cloudinaryにアップロード
    const buffer = Buffer.from(await file.arrayBuffer());
    const { url } = await uploadImage(buffer, {
      folder: 'photo-share',
      public_id: id,
    });
    
    // 公開URL
    const publicPath = url;
    
    // 写真情報を作成
    const photo: Photo = {
      id,
      filename: originalFilename,
      path: publicPath,
      qrCodeUrl: `/photos/${id}`,
      createdAt: new Date().toISOString(),
    };
    
    const response = NextResponse.json(photo, { status: 201 });
    return setCorsHeaders(response);
  } catch (error) {
    console.error('アップロードエラー:', error);
    const response = NextResponse.json(
      { error: 'ファイルのアップロードに失敗しました' },
      { status: 500 }
    );
    return setCorsHeaders(response);
  }
}