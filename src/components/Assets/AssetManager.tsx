import React, { useState } from 'react';
import { Plus, Folder, Image as ImageIcon, Volume2 } from 'lucide-react';
import { Asset, AssetUploadOptions } from '../../types';
import { Button } from '../UI';
import { AssetUploader } from './AssetUploader';
import { AssetLibrary } from './AssetLibrary';

interface AssetManagerProps {
  assets: Asset[];
  onAssetUpload: (asset: Asset, file: File) => void; // Fileオブジェクトも受け取るように変更
  onAssetDelete: (assetId: string) => void;
  onAssetSelect?: (asset: Asset) => void;
  className?: string;
  mode?: 'select' | 'manage';
}

export const AssetManager: React.FC<AssetManagerProps> = ({
  assets,
  onAssetUpload,
  onAssetDelete,
  onAssetSelect,
  className = '',
  mode = 'manage'
}) => {
  const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library');
  const [uploadCategory, setUploadCategory] = useState<Asset['category']>('background');

  const handleUpload = (asset: Asset, file: File) => {
    onAssetUpload(asset, file); // Fileオブジェクトも渡す
    setActiveTab('library'); // アップロード後はライブラリ表示に戻る
  };

  const handleValidationError = (errors: string[]) => {
    console.error('Asset validation errors:', errors);
    // 将来的にトースト通知などを実装
  };

  const getAssetCounts = () => {
    const counts = {
      total: assets.length,
      images: assets.filter(a => ['background', 'character', 'other'].includes(a.category)).length,
      audio: assets.filter(a => ['bgm', 'se'].includes(a.category)).length,
      categories: {
        background: assets.filter(a => a.category === 'background').length,
        character: assets.filter(a => a.category === 'character').length,
        bgm: assets.filter(a => a.category === 'bgm').length,
        se: assets.filter(a => a.category === 'se').length,
        other: assets.filter(a => a.category === 'other').length,
      }
    };
    return counts;
  };

  const counts = getAssetCounts();

  const uploadOptions: AssetUploadOptions = {
    category: uploadCategory,
    maxSize: uploadCategory === 'bgm' ? 50 * 1024 * 1024 : 10 * 1024 * 1024, // BGMは50MB、その他は10MB
    allowedFormats: uploadCategory === 'background' || uploadCategory === 'character'
      ? ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      : ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
    autoOptimize: true
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* ヘッダー */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {mode === 'select' ? 'アセットを選択' : 'アセット管理'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              プロジェクトで使用する画像・音声ファイルの管理
            </p>
          </div>
          
          {mode === 'manage' && (
            <Button
              onClick={() => setActiveTab('upload')}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              アセット追加
            </Button>
          )}
        </div>

        {/* 統計情報 - 横一列表示 */}
        <div style={{margin: '3px 32px', marginTop: '3px', marginBottom: '3px'}} className="flex items-center justify-between bg-blue-50 rounded-xl border border-blue-200">
          <div style={{padding: '8px', margin: '2px'}} className="flex items-center gap-4 text-base text-gray-700 bg-white rounded-lg shadow-sm">
            <Folder className="w-5 h-5" />
            <span style={{marginRight: '8px'}}>総数</span>
            <span className="font-bold text-gray-900">{counts.total}</span>
          </div>
          <div style={{padding: '8px', margin: '2px'}} className="flex items-center gap-4 text-base text-gray-700 bg-white rounded-lg shadow-sm">
            <ImageIcon className="w-5 h-5" />
            <span style={{marginRight: '8px'}}>画像</span>
            <span className="font-bold text-gray-900">{counts.images}</span>
          </div>
          <div style={{padding: '8px', margin: '2px'}} className="flex items-center gap-4 text-base text-gray-700 bg-white rounded-lg shadow-sm">
            <Volume2 className="w-5 h-5" />
            <span style={{marginRight: '8px'}}>音声</span>
            <span className="font-bold text-gray-900">{counts.audio}</span>
          </div>
          <div style={{padding: '8px', margin: '2px'}} className="flex items-center gap-4 text-base text-gray-700 bg-white rounded-lg shadow-sm">
            <ImageIcon className="w-5 h-5" />
            <span style={{marginRight: '8px'}}>背景</span>
            <span className="font-bold text-gray-900">{counts.categories.background}</span>
          </div>
        </div>

        {/* タブナビゲーション */}
        {mode === 'manage' && (
          <div className="flex gap-4 mt-1">
            <button
              onClick={() => setActiveTab('library')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'library'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              ライブラリ
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'upload'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              アップロード
            </button>
          </div>
        )}
      </div>

      {/* コンテンツエリア */}
      <div className="p-4">
        {activeTab === 'library' || mode === 'select' ? (
          <AssetLibrary
            assets={assets}
            onAssetSelect={onAssetSelect}
            onAssetDelete={mode === 'manage' ? onAssetDelete : undefined}
            mode={mode}
          />
        ) : (
          <div className="space-y-6">
            {/* カテゴリ選択 */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-900">アップロードするアセットの種類</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { key: 'background', label: '背景画像', icon: ImageIcon, description: 'シーンの背景' },
                  { key: 'character', label: 'キャラクター', icon: ImageIcon, description: 'キャラクター画像' },
                  { key: 'bgm', label: 'BGM', icon: Volume2, description: 'バックグラウンド音楽' },
                  { key: 'se', label: '効果音', icon: Volume2, description: '効果音・SE' },
                  { key: 'other', label: 'その他', icon: Folder, description: 'その他のファイル' }
                ].map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.key}
                      onClick={() => setUploadCategory(category.key as Asset['category'])}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        uploadCategory === category.key
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className={`w-6 h-6 mx-auto mb-2 ${
                        uploadCategory === category.key ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                      <p className={`font-medium text-sm ${
                        uploadCategory === category.key ? 'text-blue-900' : 'text-gray-700'
                      }`}>
                        {category.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{category.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* アップローダー */}
            <AssetUploader
              options={uploadOptions}
              onUpload={handleUpload}
              onValidationError={handleValidationError}
            />
          </div>
        )}
      </div>
    </div>
  );
};