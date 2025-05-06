import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { writeFile } from 'fs/promises';
import path from 'path';
import { Photo } from '@/app/types';

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
    
    // ファイル名を生成（元のファイル名を保持しつつ、一意性を確保）
    const originalFilename = file.name;
    const fileExtension = path.extname(originalFilename);
    const filename = `${id}${fileExtension}`;
    
    // 保存パスを生成
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const filePath = path.join(uploadDir, filename);
    
    // ファイルを保存
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);
    
    // 公開URL
    const publicPath = `/uploads/${filename}`;
    
    // 写真情報を作成
    const photo: Photo = {
      id,
      filename: originalFilename,
      path: publicPath,
      qrCodeUrl: `/photos/${id}`,
      createdAt: new Date().toISOString(),
    };
    
    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    console.error('アップロードエラー:', error);
    return NextResponse.json(
      { error: 'ファイルのアップロードに失敗しました' },
      { status: 500 }
    );
  }
}