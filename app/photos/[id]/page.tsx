import Link from 'next/link';
import Image from 'next/image';

// 写真ページのメタデータを動的に生成
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  return {
    title: `写真 ${id} - 写真共有アプリ`,
    description: '写真共有アプリで共有された写真です。',
  };
}

// 写真ページのコンポーネント
export default async function PhotoPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  const photoURL = `https://res.cloudinary.com/dnd9suvnz/image/upload/v1746624790/photo-share/${id}.png`;
    
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <header className="bg-white dark:bg-gray-800 shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              写真共有アプリ
            </h1>
          </div>
        </header>
        
        <main className="flex-grow max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">共有された写真</h2>
                
                <div className="relative w-full h-auto max-h-[70vh] overflow-hidden rounded-lg">
                  {/* 画像を表示 */}
                  <div className="relative w-full h-auto flex justify-center">
                    <div className="relative w-full h-[70vh]">
                      <Image
                        src={photoURL}
                        alt="共有された写真"
                        fill
                        sizes="100vw"
                        style={{ objectFit: 'contain' }}
                        priority
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-between items-center">
                  <Link
                    href="/"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    ホームに戻る
                  </Link>
                  
                  <a
                    href={photoURL}
                    download
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    写真をダウンロード
                  </a>
                </div>
              </div>
            </div>
          </div>
        </main>
        
        <footer className="bg-white dark:bg-gray-800 shadow mt-auto">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              &copy; {new Date().getFullYear()} 写真共有アプリ
            </p>
          </div>
        </footer>
      </div>
    );
}