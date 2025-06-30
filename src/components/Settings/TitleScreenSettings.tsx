import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useEditorStore } from '../../stores/editorStore';
import { Button, Input } from '../UI';
import { TitleScreenSettings as TitleScreenSettingsType, Asset, isImageAsset, isAudioAsset } from '../../types';
import { Image, Music, X, Upload } from 'lucide-react';

interface TitleScreenSettingsProps {
  onClose: () => void;
}

export const TitleScreenSettings: React.FC<TitleScreenSettingsProps> = ({ onClose }) => {
  const { currentProject, updateProject, getAssetsByCategory, getAssetsByType } = useEditorStore();
  const [settings, setSettings] = useState<TitleScreenSettingsType>(
    currentProject?.settings.titleScreen || {
      backgroundImage: undefined,
      titleImage: undefined,
      bgm: undefined,
      showProjectTitle: true,
      titlePosition: 'center',
      titleColor: '#ffffff',
      titleFontSize: 48,
    }
  );
  const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // ポータル用のDOM要素を作成または取得
    let modalElement = document.getElementById('modal-root');
    if (!modalElement) {
      modalElement = document.createElement('div');
      modalElement.id = 'modal-root';
      document.body.appendChild(modalElement);
    }
    setModalRoot(modalElement);

    return () => {
      // コンポーネントアンマウント時のクリーンアップは不要
      // modal-rootは他のモーダルでも使用される可能性がある
    };
  }, []);

  const backgroundImages = getAssetsByCategory('background').concat(
    getAssetsByCategory('other').filter(asset => isImageAsset(asset.category))
  );
  const titleImages = currentProject?.assets.filter(asset => isImageAsset(asset.category)) || [];
  const bgmAssets = getAssetsByCategory('bgm').concat(
    getAssetsByCategory('other').filter(asset => isAudioAsset(asset.category))
  );

  const handleSave = () => {
    if (!currentProject) return;
    
    updateProject({
      settings: {
        ...currentProject.settings,
        titleScreen: settings,
      },
    });
    
    onClose();
  };

  const handleSettingChange = (key: keyof TitleScreenSettingsType, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const renderAssetSelector = (
    label: string,
    icon: React.ReactNode,
    assets: Asset[],
    selectedAsset: Asset | undefined,
    onSelect: (asset: Asset | undefined) => void,
    type: 'image' | 'audio'
  ) => (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        {icon}
        {label}
      </label>
      
      {selectedAsset ? (
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          {type === 'image' ? (
            <img
              src={selectedAsset.url}
              alt={selectedAsset.name}
              className="w-16 h-16 object-cover rounded border"
            />
          ) : (
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded border flex items-center justify-center">
              <Music className="w-6 h-6 text-gray-500" />
            </div>
          )}
          <div className="flex-1">
            <p className="font-medium text-gray-900 dark:text-gray-100">{selectedAsset.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedAsset.metadata.format} • {Math.round(selectedAsset.metadata.size / 1024)}KB
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelect(undefined)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center">
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            {type === 'image' ? '画像を選択してください' : '音声ファイルを選択してください'}
          </p>
        </div>
      )}

      {assets.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">利用可能なアセット ({assets.length}個):</p>
          <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="grid grid-cols-1 gap-1 p-2">
              {assets.map(asset => (
                <button
                  key={asset.id}
                  onClick={() => onSelect(asset)}
                  className="flex items-center gap-3 p-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md text-sm transition-colors border-l-2 border-transparent hover:border-blue-500"
                >
                  {type === 'image' ? (
                    <img
                      src={asset.url}
                      alt={asset.name}
                      className="w-10 h-10 object-cover rounded border"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded border flex items-center justify-center">
                      <Music className="w-5 h-5 text-gray-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{asset.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {asset.metadata.format} • {Math.round(asset.metadata.size / 1024)}KB
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" 
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-5xl w-full max-h-[95vh] overflow-y-auto m-4 relative z-[10000]" 
        style={{ zIndex: 10000 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            タイトル画面設定
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-8">
          {/* アセット設定セクション - 2列レイアウト */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
              アセット設定
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                {/* 背景画像設定 */}
                {renderAssetSelector(
                  '背景画像',
                  <Image className="w-4 h-4" />,
                  backgroundImages,
                  settings.backgroundImage,
                  (asset) => handleSettingChange('backgroundImage', asset),
                  'image'
                )}
              </div>
              <div>
                {/* タイトル画像設定 */}
                {renderAssetSelector(
                  'タイトル画像',
                  <Image className="w-4 h-4" />,
                  titleImages,
                  settings.titleImage,
                  (asset) => handleSettingChange('titleImage', asset),
                  'image'
                )}
              </div>
            </div>
            <div className="max-w-md">
              {/* タイトルBGM設定 */}
              {renderAssetSelector(
                'タイトルBGM',
                <Music className="w-4 h-4" />,
                bgmAssets,
                settings.bgm,
                (asset) => handleSettingChange('bgm', asset),
                'audio'
              )}
            </div>
          </div>

          {/* プロジェクトタイトル表示設定 */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
              プロジェクトタイトル設定
            </h3>
            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.showProjectTitle}
                  onChange={(e) => handleSettingChange('showProjectTitle', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  プロジェクトタイトルを表示する
                </span>
              </label>

              {settings.showProjectTitle && (
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        タイトル位置
                      </label>
                      <select
                        value={settings.titlePosition}
                        onChange={(e) => handleSettingChange('titlePosition', e.target.value as 'top' | 'center' | 'bottom')}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      >
                        <option value="top">上部</option>
                        <option value="center">中央</option>
                        <option value="bottom">下部</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        タイトル色
                      </label>
                      <input
                        type="color"
                        value={settings.titleColor}
                        onChange={(e) => handleSettingChange('titleColor', e.target.value)}
                        className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        フォントサイズ (px)
                      </label>
                      <Input
                        type="number"
                        value={settings.titleFontSize}
                        onChange={(e) => handleSettingChange('titleFontSize', parseInt(e.target.value) || 48)}
                        min="12"
                        max="120"
                        className="w-full"
                        placeholder="48"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-900">
          <Button variant="ghost" onClick={onClose}>
            キャンセル
          </Button>
          <Button variant="primary" onClick={handleSave}>
            保存
          </Button>
        </div>
      </div>
    </div>
  );

  // ポータルを使用してモーダルを最上位に表示
  return modalRoot ? createPortal(modalContent, modalRoot) : null;
};