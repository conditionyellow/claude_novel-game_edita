import React, { useState, useMemo } from 'react';
import { Search, Grid, List, Filter, Play, Pause, Volume2, Image as ImageIcon, Trash2 } from 'lucide-react';
import { Asset, AssetLibraryFilter } from '../../types';
import { Button, Input } from '../UI';
import { AssetPreview } from './AssetPreview';

interface AssetLibraryProps {
  assets: Asset[];
  onAssetSelect?: (asset: Asset) => void;
  onAssetDelete?: (assetId: string) => void;
  selectedAssetIds?: string[];
  className?: string;
  mode?: 'select' | 'manage';
}

export const AssetLibrary: React.FC<AssetLibraryProps> = ({
  assets,
  onAssetSelect,
  onAssetDelete,
  selectedAssetIds = [],
  className = '',
  mode = 'manage'
}) => {
  const [filter, setFilter] = useState<AssetLibraryFilter>({
    sortBy: 'uploadedAt',
    sortOrder: 'desc'
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);

  // フィルタリング・ソート処理
  const filteredAssets = useMemo(() => {
    let filtered = [...assets];

    // タイプフィルタ
    if (filter.type) {
      filtered = filtered.filter(asset => asset.type === filter.type);
    }

    // カテゴリフィルタ
    if (filter.category) {
      filtered = filtered.filter(asset => asset.category === filter.category);
    }

    // 検索フィルタ
    if (filter.searchTerm) {
      const searchTerm = filter.searchTerm.toLowerCase();
      filtered = filtered.filter(asset => 
        asset.name.toLowerCase().includes(searchTerm)
      );
    }

    // ソート
    filtered.sort((a, b) => {
      const aValue = a.metadata[filter.sortBy as keyof Asset['metadata']] || a[filter.sortBy as keyof Asset];
      const bValue = b.metadata[filter.sortBy as keyof Asset['metadata']] || b[filter.sortBy as keyof Asset];
      
      if (filter.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [assets, filter]);

  const handleFilterChange = (newFilter: Partial<AssetLibraryFilter>) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const getCategoryLabel = (category: Asset['category']) => {
    const labels = {
      background: '背景',
      character: 'キャラ',
      bgm: 'BGM',
      se: '効果音',
      other: 'その他'
    };
    return labels[category];
  };

  const getCategoryColor = (category: Asset['category']) => {
    const colors = {
      background: 'bg-blue-100 text-blue-800',
      character: 'bg-green-100 text-green-800',
      bgm: 'bg-purple-100 text-purple-800',
      se: 'bg-orange-100 text-orange-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* ヘッダー・フィルタエリア */}
      <div className="space-y-4">
        {/* 検索とビューモード */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="アセットを検索..."
              value={filter.searchTerm || ''}
              onChange={(e) => handleFilterChange({ searchTerm: e.target.value })}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* フィルタ */}
        <div className="flex gap-4 flex-wrap">
          <select
            value={filter.type || ''}
            onChange={(e) => handleFilterChange({ type: e.target.value as Asset['type'] || undefined })}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">すべてのタイプ</option>
            <option value="image">画像</option>
            <option value="audio">音声</option>
          </select>

          <select
            value={filter.category || ''}
            onChange={(e) => handleFilterChange({ category: e.target.value as Asset['category'] || undefined })}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">すべてのカテゴリ</option>
            <option value="background">背景画像</option>
            <option value="character">キャラクター</option>
            <option value="bgm">BGM</option>
            <option value="se">効果音</option>
            <option value="other">その他</option>
          </select>

          <select
            value={`${filter.sortBy}-${filter.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              handleFilterChange({ 
                sortBy: sortBy as AssetLibraryFilter['sortBy'],
                sortOrder: sortOrder as AssetLibraryFilter['sortOrder']
              });
            }}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="uploadedAt-desc">新しい順</option>
            <option value="uploadedAt-asc">古い順</option>
            <option value="name-asc">名前順（A-Z）</option>
            <option value="name-desc">名前順（Z-A）</option>
            <option value="size-desc">サイズ大きい順</option>
            <option value="size-asc">サイズ小さい順</option>
          </select>
        </div>

        {/* 統計情報 */}
        <div className="text-sm text-gray-600">
          {filteredAssets.length}件のアセット
          {filter.searchTerm && ` (「${filter.searchTerm}」で検索)`}
        </div>
      </div>

      {/* アセット一覧 */}
      {filteredAssets.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">アセットが見つかりません</p>
          <p className="text-sm">ファイルをアップロードしてください</p>
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
            : 'space-y-2'
        }>
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className={`
                group relative border rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md cursor-pointer
                ${selectedAssetIds.includes(asset.id) ? 'ring-2 ring-blue-500' : 'border-gray-200'}
                ${viewMode === 'grid' ? 'bg-white' : 'p-4'}
              `}
              onClick={() => {
                // アセット直接クリックでプレビューモーダルを開く
                setPreviewAsset(asset);
                // 選択処理も実行
                onAssetSelect?.(asset);
              }}
            >
              {viewMode === 'grid' ? (
                // グリッドビュー
                <>
                  {/* プレビュー */}
                  <div className="w-full max-w-[300px] bg-gray-100 flex items-center justify-center overflow-hidden mx-auto">
                    {asset.type === 'image' ? (
                      <img 
                        src={asset.url} 
                        alt={asset.name}
                        className="max-w-[300px] w-full h-auto object-contain hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <Volume2 className="w-8 h-8 text-gray-400" />
                    )}
                  </div>

                  {/* 情報 */}
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(asset.category)}`}>
                        {getCategoryLabel(asset.category)}
                      </span>
                    </div>
                    <h3 className="font-medium text-sm text-gray-900 truncate mb-0.5" title={asset.name}>
                      {asset.name}
                    </h3>
                    <p className="text-xs text-gray-500">{formatFileSize(asset.metadata.size)}</p>
                  </div>

                  {/* ホバー時のアクション */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewAsset(asset);
                      }}
                    >
                      プレビュー
                    </Button>
                    {mode === 'manage' && onAssetDelete && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('このアセットを削除しますか？')) {
                            onAssetDelete(asset.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                // リストビュー
                <div className="flex items-center gap-4">
                  {/* サムネイル */}
                  <div 
                    className="w-[200px] h-[150px] bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden cursor-pointer hover:bg-gray-200 transition-colors border-2 border-blue-500 hover:border-blue-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('画像クリック:', asset.name);
                      setPreviewAsset(asset);
                    }}
                    title="クリックして大きなプレビューを表示"
                  >
                    {asset.type === 'image' ? (
                      <img 
                        src={asset.url} 
                        alt={asset.name}
                        className="w-full h-full object-cover rounded-lg shadow-sm"
                        loading="lazy"
                      />
                    ) : (
                      <Volume2 className="w-16 h-16 text-gray-400" />
                    )}
                  </div>

                  {/* 情報 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-medium text-gray-900 truncate">{asset.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(asset.category)}`}>
                        {getCategoryLabel(asset.category)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 space-y-0.5">
                      <p>{formatFileSize(asset.metadata.size)} • {formatDate(asset.metadata.uploadedAt)}</p>
                      {asset.metadata.dimensions && (
                        <p>{asset.metadata.dimensions.width} × {asset.metadata.dimensions.height}</p>
                      )}
                    </div>
                  </div>

                  {/* アクション */}
                  <div className="flex gap-2">
                    {mode === 'manage' && onAssetDelete && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('このアセットを削除しますか？')) {
                            onAssetDelete(asset.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* プレビューモーダル */}
      {previewAsset && (
        <AssetPreview
          asset={previewAsset}
          onClose={() => setPreviewAsset(null)}
        />
      )}
    </div>
  );
};