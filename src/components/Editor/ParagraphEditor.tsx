import React, { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '../../stores/editorStore';
// useAssetRepair は Phase 20 でグローバルマネージャーに統合済み
import { globalAssetUrlManager } from '../../utils/globalAssetUrlManager';
import { Input, Textarea, Button } from '../UI';
import { ChoiceEditor } from './ChoiceEditor';
import { Plus, Image, X, Music, Crown, Upload } from 'lucide-react';
import { generateId } from '../../utils';
import { Asset, isImageAsset, isAudioAsset } from '../../types';

// タイトル画像アップローダーコンポーネント
interface TitleImageUploaderProps {
  availableImages: Asset[];
  onImageSelect: (asset: Asset | null) => void;
}

const TitleImageUploader: React.FC<TitleImageUploaderProps> = ({ 
  availableImages, 
  onImageSelect 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addAssetWithFile } = useEditorStore();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      await handleFileUpload(imageFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleFileUpload(file);
    }
    // ファイル入力をリセット
    e.target.value = '';
  };

  const handleFileUpload = async (file: File) => {
    try {
      // 画像の寸法を取得
      const dimensions = await getImageDimensions(file);
      
      // 重複を避けるためのユニークなファイル名を生成
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || '';
      const baseName = file.name.replace(`.${fileExtension}`, '');
      const uniqueName = `${baseName}_${timestamp}.${fileExtension}`;
      
      const newAsset: Asset = {
        id: generateId(),
        name: uniqueName,
        category: 'other', // タイトル画像は'other'カテゴリ
        url: '', // addAssetWithFileで設定される
        metadata: {
          size: file.size,
          format: file.type,
          dimensions,
          uploadedAt: new Date(),
          lastUsed: new Date(),
        },
      };

      const savedAsset = await addAssetWithFile(newAsset, file);
      onImageSelect(savedAsset);
      // タイトル画像アップロード成功（ログはデバッグ時のみ）
    } catch (error) {
      console.error('画像アップロードエラー:', error);
      
      // より詳細なエラーメッセージを表示
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('重複') || errorMessage.includes('uniqueness')) {
        alert('同じ名前のファイルが既に存在します。別の名前で保存してください。');
      } else {
        alert(`画像のアップロードに失敗しました: ${errorMessage}`);
      }
    }
  };

  // 画像の寸法を取得するヘルパー関数
  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img: HTMLImageElement = document.createElement('img');
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  return (
    <div className="space-y-4">
      {/* ドラッグ&ドロップエリア */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging
            ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/20'
            : 'border-gray-300 bg-gray-50 dark:bg-gray-800'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          画像をドラッグ&ドロップするか、クリックしてファイルを選択
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="mb-3"
        >
          <Upload className="w-4 h-4 mr-2" />
          ファイル選択
        </Button>
      </div>

      {/* 既存画像から選択 */}
      {availableImages.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            または既存の画像から選択:
          </p>
          <select
            onChange={(e) => {
              const asset = availableImages.find(a => a.id === e.target.value);
              if (asset) onImageSelect(asset);
            }}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            defaultValue=""
          >
            <option value="">画像を選択...</option>
            {availableImages.map(asset => (
              <option key={`${asset.id}-${asset.name}`} value={asset.id}>
                {asset.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {availableImages.length === 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          まだ画像がアップロードされていません
        </p>
      )}
    </div>
  );
};

// Phase 20: 旧検証システム削除完了 - グローバルアセットURL管理システムに統合済み

export const ParagraphEditor: React.FC = () => {
  const [validatedBackgroundAsset, setValidatedBackgroundAsset] = useState<Asset | null>(null);
  const [validatedTitleImageAsset, setValidatedTitleImageAsset] = useState<Asset | null>(null);
  const [validatedBgmAsset, setValidatedBgmAsset] = useState<Asset | null>(null);
  const [validatedTitleBgmAsset, setValidatedTitleBgmAsset] = useState<Asset | null>(null);
  
  const { 
    currentProject, 
    selectedParagraphId, 
    updateParagraph,
    addParagraph,
    updateProject
  } = useEditorStore();
  
  // Phase 20: 従来の検証システムをグローバルマネージャーに統合

  const selectedParagraph = currentProject?.paragraphs.find(
    p => p.id === selectedParagraphId
  );

  // 検証済みパラグラフIDを追跡
  const validatedParagraphs = useRef(new Set<string>());
  
  // プロジェクト変更時に検証キャッシュをクリア
  useEffect(() => {
    validatedParagraphs.current.clear();
  }, [currentProject?.id]);
  
  // 選択パラグラフのアセットURL検証・再生成（改良版・重複実行防止）
  useEffect(() => {
    let isValidating = false;
    
    const validateAssets = async () => {
      if (!selectedParagraph || isValidating) {
        if (!selectedParagraph) {
          setValidatedBackgroundAsset(null);
          setValidatedTitleImageAsset(null);
          setValidatedBgmAsset(null);
          setValidatedTitleBgmAsset(null);
        }
        return;
      }
      
      // 既に検証済みのパラグラフはスキップ
      if (validatedParagraphs.current.has(selectedParagraph.id)) {
        console.log(`⏭️ ${selectedParagraph.title}: 既に検証済みのためスキップ`);
        return;
      }
      
      isValidating = true;
      console.log('🔍 パラグラフアセット検証開始:', selectedParagraph.title);
      
      // 検証済みとしてマーク
      validatedParagraphs.current.add(selectedParagraph.id);
      
      // 背景画像の検証（グローバルマネージャー使用）
      if (selectedParagraph.content.background) {
        const needsValidation = !validatedBackgroundAsset || 
                               validatedBackgroundAsset.id !== selectedParagraph.content.background.id;
        
        if (needsValidation) {
          console.log('🖼️ 背景画像安定URL取得中:', selectedParagraph.content.background.name);
          try {
            const stableUrl = await globalAssetUrlManager.getStableUrl(currentProject.id, selectedParagraph.content.background);
            const validated = { ...selectedParagraph.content.background, url: stableUrl };
            setValidatedBackgroundAsset(validated);
            console.log('✅ 背景画像安定URL取得完了:', validated.name);
          } catch (error) {
            console.warn('⚠️ 背景画像安定URL取得失敗:', error);
            setValidatedBackgroundAsset(selectedParagraph.content.background);
          }
        }
      } else {
        setValidatedBackgroundAsset(null);
      }
      
      // タイトル画像の検証（グローバルマネージャー使用）
      if (selectedParagraph.content.titleImage) {
        const needsValidation = !validatedTitleImageAsset || 
                               validatedTitleImageAsset.id !== selectedParagraph.content.titleImage.id;
        
        if (needsValidation) {
          console.log('🎨 タイトル画像安定URL取得中:', selectedParagraph.content.titleImage.name);
          try {
            const stableUrl = await globalAssetUrlManager.getStableUrl(currentProject.id, selectedParagraph.content.titleImage);
            const validated = { ...selectedParagraph.content.titleImage, url: stableUrl };
            setValidatedTitleImageAsset(validated);
            console.log('✅ タイトル画像安定URL取得完了:', validated.name);
          } catch (error) {
            console.warn('⚠️ タイトル画像安定URL取得失敗:', error);
            setValidatedTitleImageAsset(selectedParagraph.content.titleImage);
          }
        }
      } else {
        setValidatedTitleImageAsset(null);
      }
      
      // BGMの検証（グローバルマネージャー使用）
      if (selectedParagraph.content.bgm) {
        const needsValidation = !validatedBgmAsset || 
                               validatedBgmAsset.id !== selectedParagraph.content.bgm.id;
        
        if (needsValidation) {
          console.log('🎵 BGM安定URL取得中:', selectedParagraph.content.bgm.name);
          try {
            const stableUrl = await globalAssetUrlManager.getStableUrl(currentProject.id, selectedParagraph.content.bgm);
            const validated = { ...selectedParagraph.content.bgm, url: stableUrl };
            setValidatedBgmAsset(validated);
            console.log('✅ BGM安定URL取得完了:', validated.name);
          } catch (error) {
            console.warn('⚠️ BGM安定URL取得失敗:', error);
            setValidatedBgmAsset(selectedParagraph.content.bgm);
          }
        }
      } else {
        setValidatedBgmAsset(null);
      }
      
      // タイトル画面BGMの検証（タイトルパラグラフのみ・グローバルマネージャー使用）
      if (selectedParagraph.type === 'title' && currentProject?.settings?.titleScreen?.bgm) {
        const needsValidation = !validatedTitleBgmAsset || 
                               validatedTitleBgmAsset.id !== currentProject.settings.titleScreen.bgm.id;
        
        if (needsValidation) {
          console.log('🎵 タイトルBGM安定URL取得中:', currentProject.settings.titleScreen.bgm.name);
          try {
            const stableUrl = await globalAssetUrlManager.getStableUrl(currentProject.id, currentProject.settings.titleScreen.bgm);
            const validated = { ...currentProject.settings.titleScreen.bgm, url: stableUrl };
            setValidatedTitleBgmAsset(validated);
            console.log('✅ タイトルBGM安定URL取得完了:', validated.name);
            
            // プロジェクト設定を更新（URL同期）
            if (validated.url !== currentProject.settings.titleScreen.bgm.url) {
              updateProject({
                settings: {
                  ...currentProject.settings,
                  titleScreen: {
                    ...currentProject.settings.titleScreen,
                    bgm: validated
                  }
                }
              });
            }
          } catch (error) {
            console.warn('⚠️ タイトルBGM安定URL取得失敗:', error);
            setValidatedTitleBgmAsset(currentProject.settings.titleScreen.bgm);
          }
        }
      } else {
        setValidatedTitleBgmAsset(null);
      }
      
      isValidating = false;
    };
    
    // デバウンス処理で重複実行を防止
    const timeoutId = setTimeout(validateAssets, 100);
    
    return () => {
      clearTimeout(timeoutId);
      isValidating = false;
    };
  }, [selectedParagraph?.id, selectedParagraph?.content.background?.id, selectedParagraph?.content.background?.url, selectedParagraph?.content.titleImage?.id, selectedParagraph?.content.titleImage?.url, selectedParagraph?.content.bgm?.id, selectedParagraph?.content.bgm?.url, currentProject?.settings?.titleScreen?.bgm?.id, currentProject?.settings?.titleScreen?.bgm?.url, validatedBackgroundAsset?.id, validatedTitleImageAsset?.id, validatedBgmAsset?.id, validatedTitleBgmAsset?.id, updateProject]);

  // プロアクティブ修復システム無効化（グローバルマネージャーと統合済み）
  // Phase 20: グローバルアセットURL管理システムが全ての検証・修復を処理するため無効化

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8">
          <div className="w-20 h-20 mx-auto mb-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <Image className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            プロジェクトが読み込まれていません
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            ファイルを開いて編集を開始してください
          </p>
        </div>
      </div>
    );
  }

  if (!selectedParagraph) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8">
          <div className="w-20 h-20 mx-auto mb-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <Plus className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            パラグラフを選択してください
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            左のサイドバーから編集したいパラグラフを選択してください
          </p>
        </div>
      </div>
    );
  }

  const handleUpdateTitle = (title: string) => {
    updateParagraph(selectedParagraph.id, { title });
  };

  const handleUpdateText = (text: string) => {
    updateParagraph(selectedParagraph.id, {
      content: {
        ...selectedParagraph.content,
        text,
      },
    });
  };

  const handleUpdateType = (type: 'title' | 'start' | 'middle' | 'end') => {
    const updatedChoices = (type === 'end' || type === 'title') ? [] : selectedParagraph.content.choices;
    updateParagraph(selectedParagraph.id, {
      type,
      content: {
        ...selectedParagraph.content,
        choices: updatedChoices,
      },
    });
  };

  const handleAddChoice = () => {
    const newChoice = {
      id: generateId(),
      text: '新しい選択肢',
      targetParagraphId: '',
    };
    
    updateParagraph(selectedParagraph.id, {
      content: {
        ...selectedParagraph.content,
        choices: [...selectedParagraph.content.choices, newChoice],
      },
    });
  };

  const handleUpdateChoice = (choiceId: string, text: string, targetId: string) => {
    const updatedChoices = selectedParagraph.content.choices.map(choice =>
      choice.id === choiceId
        ? { ...choice, text, targetParagraphId: targetId }
        : choice
    );

    updateParagraph(selectedParagraph.id, {
      content: {
        ...selectedParagraph.content,
        choices: updatedChoices,
      },
    });
  };

  const handleDeleteChoice = (choiceId: string) => {
    const updatedChoices = selectedParagraph.content.choices.filter(
      choice => choice.id !== choiceId
    );

    updateParagraph(selectedParagraph.id, {
      content: {
        ...selectedParagraph.content,
        choices: updatedChoices,
      },
    });
  };

  const handleCreateNewParagraph = (): string => {
    const newParagraphId = addParagraph('middle');
    return newParagraphId || '';
  };

  const handleUpdateBackground = async (asset: Asset | null) => {
    updateParagraph(selectedParagraph.id, {
      content: {
        ...selectedParagraph.content,
        background: asset || undefined,
      },
    });
    
    // 選択されたアセットを即座に検証状態に反映
    if (asset) {
      try {
        // 検証キャッシュから現在のパラグラフを削除（強制再検証）
        validatedParagraphs.current.delete(selectedParagraph.id);
        
        // グローバルマネージャーから安定URLを取得
        const stableUrl = await globalAssetUrlManager.getStableUrl(currentProject.id, asset);
        const validated = { ...asset, url: stableUrl };
        setValidatedBackgroundAsset(validated);
        console.log('✅ 背景画像選択時の安定URL取得完了:', validated.name);
      } catch (error) {
        console.warn('⚠️ 背景画像選択時の検証失敗:', error);
        setValidatedBackgroundAsset(asset);
      }
    } else {
      setValidatedBackgroundAsset(null);
    }
  };

  const handleUpdateBgm = async (asset: Asset | null) => {
    updateParagraph(selectedParagraph.id, {
      content: {
        ...selectedParagraph.content,
        bgm: asset || undefined,
      },
    });
    
    // 選択されたアセットを即座に検証状態に反映
    if (asset) {
      try {
        // 検証キャッシュから現在のパラグラフを削除（強制再検証）
        validatedParagraphs.current.delete(selectedParagraph.id);
        
        // グローバルマネージャーから安定URLを取得
        const stableUrl = await globalAssetUrlManager.getStableUrl(currentProject.id, asset);
        const validated = { ...asset, url: stableUrl };
        setValidatedBgmAsset(validated);
        console.log('✅ BGM選択時の安定URL取得完了:', validated.name);
      } catch (error) {
        console.warn('⚠️ BGM選択時の検証失敗:', error);
        setValidatedBgmAsset(asset);
      }
    } else {
      setValidatedBgmAsset(null);
    }
  };

  // タイトルパラグラフ専用ハンドラー
  const handleUpdateTitleImage = async (asset: Asset | null) => {
    updateParagraph(selectedParagraph.id, {
      content: {
        ...selectedParagraph.content,
        titleImage: asset || undefined,
      },
    });
    
    // 選択されたアセットを即座に検証状態に反映
    if (asset) {
      try {
        // 検証キャッシュから現在のパラグラフを削除（強制再検証）
        validatedParagraphs.current.delete(selectedParagraph.id);
        
        // グローバルマネージャーから安定URLを取得
        const stableUrl = await globalAssetUrlManager.getStableUrl(currentProject.id, asset);
        const validated = { ...asset, url: stableUrl };
        setValidatedTitleImageAsset(validated);
        console.log('✅ タイトル画像選択時の安定URL取得完了:', validated.name);
      } catch (error) {
        console.warn('⚠️ タイトル画像選択時の検証失敗:', error);
        setValidatedTitleImageAsset(asset);
      }
    } else {
      setValidatedTitleImageAsset(null);
    }
  };

  const handleUpdateShowProjectTitle = (showProjectTitle: boolean) => {
    updateParagraph(selectedParagraph.id, {
      content: {
        ...selectedParagraph.content,
        showProjectTitle,
      },
    });
  };

  const handleUpdateTitleColor = (titleColor: string) => {
    updateParagraph(selectedParagraph.id, {
      content: {
        ...selectedParagraph.content,
        titleColor,
      },
    });
  };

  const handleUpdateTitleFontSize = (titleFontSize: number) => {
    updateParagraph(selectedParagraph.id, {
      content: {
        ...selectedParagraph.content,
        titleFontSize,
      },
    });
  };

  const availableBackgrounds = currentProject?.assets.filter(
    asset => isImageAsset(asset.category) && (asset.category === 'background' || asset.category === 'other')
  ) || [];

  const availableBgm = currentProject?.assets.filter(
    asset => isAudioAsset(asset.category) && (asset.category === 'bgm' || asset.category === 'other')
  ) || [];

  const availableImages = currentProject?.assets.filter(
    asset => isImageAsset(asset.category)
  ) || [];

  return (
    <div className="flex-1 overflow-y-auto h-full bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-16 py-8 space-y-8 min-h-full paragraph-editor-container">
        {/* ヘッダー */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100" style={{marginLeft: '5px'}}>
                  パラグラフ編集
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  selectedParagraph.type === 'title'
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
                    : selectedParagraph.type === 'start' 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                    : selectedParagraph.type === 'end'
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                }`}>
                  {selectedParagraph.type === 'title' ? 'タイトル' :
                   selectedParagraph.type === 'start' ? 'スタート' : 
                   selectedParagraph.type === 'end' ? 'エンド' : '中間'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 基本情報 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Image className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">基本情報</h2>
            </div>
          </div>
          
          <div style={{ padding: '2rem 3rem' }}>
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <Input
                    label="タイトル"
                    value={selectedParagraph.title}
                    onChange={(e) => handleUpdateTitle(e.target.value)}
                    placeholder="パラグラフのタイトルを入力"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    タイプ
                  </label>
                  <select
                    value={selectedParagraph.type}
                    onChange={(e) => handleUpdateType(e.target.value as 'title' | 'start' | 'middle' | 'end')}
                    className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all duration-200"
                  >
                    <option value="title">タイトル</option>
                    <option value="start">スタート</option>
                    <option value="middle">中間</option>
                    <option value="end">エンド</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <Textarea
                  label="本文"
                  value={selectedParagraph.content.text}
                  onChange={(e) => handleUpdateText(e.target.value)}
                  placeholder="パラグラフの本文を入力してください..."
                  rows={6}
                  className="resize-none"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>文字数: {selectedParagraph.content.text.length}</span>
                  <span>適度な文字数で読みやすくなります</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 選択肢編集 */}
        {selectedParagraph.type !== 'end' && selectedParagraph.type !== 'title' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                    <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">選択肢</h2>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleAddChoice}
                  disabled={selectedParagraph.content.choices.length >= 5}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  選択肢追加
                </Button>
              </div>
            </div>
            
            <div style={{ padding: '2rem 3rem' }}>

            {selectedParagraph.content.choices.length === 0 ? (
              <div className="text-left py-8 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                    <Plus className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-gray-700 dark:text-gray-300 font-medium">選択肢がありません</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">最初の選択肢を追加してストーリーを進めましょう</p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAddChoice}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  選択肢を追加
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedParagraph.content.choices.map((choice, index) => (
                  <div key={choice.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                    <ChoiceEditor
                      choice={choice}
                      index={index}
                      paragraphs={currentProject.paragraphs}
                      onUpdate={(text, targetId) =>
                        handleUpdateChoice(choice.id, text, targetId)
                      }
                      onDelete={() => handleDeleteChoice(choice.id)}
                      onCreateNewParagraph={handleCreateNewParagraph}
                      canDelete={selectedParagraph.content.choices.length > 1}
                    />
                  </div>
                ))}
              </div>
            )}

              <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-200 dark:border-gray-600">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  選択肢数: {selectedParagraph.content.choices.length}/5
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  選択肢が多いとプレイヤーの選択肢が増えます
                </div>
              </div>
            </div>
          </div>
        )}

        {/* アセット設定 - タイトルパラグラフ以外で表示 */}
        {selectedParagraph.type !== 'title' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Music className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">アセット</h2>
            </div>
          </div>
          
          <div style={{ padding: '2rem 3rem' }} className="space-y-8">
          
          {/* 背景画像設定 - タイトルパラグラフ以外で表示 */}
          {selectedParagraph.type !== 'title' && (
            <div className="space-y-3">
              <h3 className="text-md font-medium text-gray-800">背景画像</h3>
              
              {validatedBackgroundAsset ? (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  {/* 画像プレビュー */}
                  <div className="mb-4">
                    <div className="relative max-w-full">
                      <img
                        src={validatedBackgroundAsset.url}
                        alt={validatedBackgroundAsset.name}
                        className="w-full h-auto max-h-64 object-contain rounded border bg-gray-50"
                        style={{ maxWidth: '100%' }}
                        onError={(e) => {
                          console.error('🖼️ 背景画像読み込みエラー:', validatedBackgroundAsset.name);
                          console.error('エラーしたURL:', validatedBackgroundAsset.url);
                          
                          // 画像読み込み失敗時の視覚的フィードバック
                          e.currentTarget.style.display = 'none';
                          
                          // エラーメッセージを表示するための要素を作成
                          const errorDiv = document.createElement('div');
                          errorDiv.className = 'w-full h-64 flex items-center justify-center bg-red-50 border border-red-200 rounded text-red-600';
                          errorDiv.innerHTML = '🖼️ 画像の読み込みに失敗しました';
                          e.currentTarget.parentNode?.appendChild(errorDiv);
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* メタデータと削除ボタン */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {validatedBackgroundAsset.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {validatedBackgroundAsset.metadata.dimensions ? 
                          `${validatedBackgroundAsset.metadata.dimensions.width}×${validatedBackgroundAsset.metadata.dimensions.height}` : 
                          'サイズ不明'}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleUpdateBackground(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Image className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-3">背景画像が設定されていません</p>
                  {availableBackgrounds.length > 0 ? (
                    <select
                      onChange={(e) => {
                        const asset = availableBackgrounds.find(a => a.id === e.target.value);
                        if (asset) handleUpdateBackground(asset);
                      }}
                      className="block mx-auto px-3 py-2 border border-gray-300 rounded-md text-sm"
                      defaultValue=""
                    >
                      <option value="">画像を選択...</option>
                      {availableBackgrounds.map(asset => (
                        <option key={`${asset.id}-${asset.name}`} value={asset.id}>
                          {asset.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs text-gray-500">
                      アセット管理から背景画像をアップロードしてください
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {selectedParagraph.type !== 'title' && availableBackgrounds.length > 0 && validatedBackgroundAsset && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">他の背景画像に変更:</p>
              <select
                onChange={(e) => {
                  const asset = availableBackgrounds.find(a => a.id === e.target.value);
                  if (asset && asset.id !== validatedBackgroundAsset?.id) {
                    handleUpdateBackground(asset);
                  }
                }}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={validatedBackgroundAsset.id}
              >
                {availableBackgrounds.map(asset => (
                  <option key={`${asset.id}-${asset.name}`} value={asset.id}>
                    {asset.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* BGM設定 - タイトルパラグラフ以外で表示 */}
          {selectedParagraph.type !== 'title' && (
            <div className="space-y-3">
              <h3 className="text-md font-medium text-gray-800">BGM</h3>
              
              {validatedBgmAsset ? (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-24 h-16 bg-gray-100 rounded border flex items-center justify-center">
                      <Music className="w-8 h-8 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {validatedBgmAsset.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {validatedBgmAsset.metadata.duration ? 
                          `${Math.floor(validatedBgmAsset.metadata.duration / 60)}:${String(Math.floor(validatedBgmAsset.metadata.duration % 60)).padStart(2, '0')}` : 
                          '長さ不明'}
                      </p>
                      <audio 
                        controls 
                        className="mt-2 w-full h-8"
                        preload="metadata"
                        onError={(e) => {
                          console.error('BGM audio failed to load:', validatedBgmAsset.name);
                        }}
                      >
                        <source src={validatedBgmAsset.url} />
                        お使いのブラウザは音声再生に対応していません。
                      </audio>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleUpdateBgm(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Music className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-3">BGMが設定されていません</p>
                  {availableBgm.length > 0 ? (
                    <select
                      onChange={(e) => {
                        const asset = availableBgm.find(a => a.id === e.target.value);
                        if (asset) handleUpdateBgm(asset);
                      }}
                      className="block mx-auto px-3 py-2 border border-gray-300 rounded-md text-sm"
                      defaultValue=""
                    >
                      <option value="">BGMを選択...</option>
                      {availableBgm.map(asset => (
                        <option key={`${asset.id}-${asset.name}`} value={asset.id}>
                          {asset.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs text-gray-500">
                      アセット管理からBGMをアップロードしてください
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {selectedParagraph.type !== 'title' && availableBgm.length > 0 && validatedBgmAsset && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">他のBGMに変更:</p>
              <select
                onChange={(e) => {
                  const asset = availableBgm.find(a => a.id === e.target.value);
                  if (asset && asset.id !== validatedBgmAsset?.id) {
                    handleUpdateBgm(asset);
                  }
                }}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={validatedBgmAsset.id}
              >
                {availableBgm.map(asset => (
                  <option key={`${asset.id}-${asset.name}`} value={asset.id}>
                    {asset.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          </div>
          </div>
        )}

        {/* タイトルパラグラフ専用設定 */}
        {selectedParagraph.type === 'title' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Crown className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">タイトル画面設定</h3>
              </div>
            </div>

            <div className="p-8 space-y-6">
              {/* タイトル画像設定 */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Image className="w-4 h-4 inline mr-2" />
                  タイトル画像
                </label>
                
                {validatedTitleImageAsset ? (
                  <div className="space-y-3">
                    <div className="relative max-w-full">
                      <img
                        src={validatedTitleImageAsset.url}
                        alt={validatedTitleImageAsset.name}
                        className="w-full h-auto max-h-64 object-contain rounded border bg-gray-50"
                        style={{ maxWidth: '100%' }}
                        onError={(e) => {
                          console.error('Title image failed to load:', validatedTitleImageAsset.name);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {validatedTitleImageAsset.name}
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleUpdateTitleImage(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <TitleImageUploader
                    availableImages={availableImages}
                    onImageSelect={handleUpdateTitleImage}
                  />
                )}
              </div>

              {/* タイトル画像変更セレクト */}
              {availableImages.length > 0 && validatedTitleImageAsset && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">他のタイトル画像に変更:</p>
                  <select
                    onChange={(e) => {
                      const asset = availableImages.find(a => a.id === e.target.value);
                      if (asset && asset.id !== validatedTitleImageAsset?.id) {
                        handleUpdateTitleImage(asset);
                      }
                    }}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    value={validatedTitleImageAsset.id}
                  >
                    {availableImages.map(asset => (
                      <option key={`${asset.id}-${asset.name}`} value={asset.id}>
                        {asset.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* プロジェクトタイトル表示設定 */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="showProjectTitle"
                    checked={selectedParagraph.content.showProjectTitle ?? true}
                    onChange={(e) => handleUpdateShowProjectTitle(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="showProjectTitle" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    プロジェクトタイトルを表示する
                  </label>
                </div>

                {(selectedParagraph.content.showProjectTitle ?? true) && (
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          タイトル色
                        </label>
                        <input
                          type="color"
                          value={selectedParagraph.content.titleColor || '#ffffff'}
                          onChange={(e) => handleUpdateTitleColor(e.target.value)}
                          className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          フォントサイズ (px)
                        </label>
                        <Input
                          type="number"
                          value={selectedParagraph.content.titleFontSize || 48}
                          onChange={(e) => handleUpdateTitleFontSize(parseInt(e.target.value) || 48)}
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
              
              {/* タイトルBGM設定 */}
              <div className="space-y-3">
                <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <Music className="w-4 h-4" />
                  タイトルBGM
                </h4>
                
                {validatedTitleBgmAsset ? (
                  <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-12 bg-gray-100 dark:bg-gray-600 rounded border flex items-center justify-center">
                        <Music className="w-6 h-6 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {validatedTitleBgmAsset.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {validatedTitleBgmAsset.metadata.duration ? 
                            `${Math.floor(validatedTitleBgmAsset.metadata.duration / 60)}:${String(Math.floor(validatedTitleBgmAsset.metadata.duration % 60)).padStart(2, '0')}` : 
                            '長さ不明'}
                        </p>
                        <audio 
                          controls 
                          className="mt-2 w-full h-8"
                          preload="metadata"
                          onError={(e) => {
                            console.error('タイトルBGM再生エラー:', validatedTitleBgmAsset.name);
                            console.error('URL:', validatedTitleBgmAsset.url);
                          }}
                        >
                          <source src={validatedTitleBgmAsset.url} />
                          お使いのブラウザは音声再生に対応していません。
                        </audio>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          if (currentProject) {
                            updateProject({
                              settings: {
                                ...currentProject.settings,
                                titleScreen: {
                                  backgroundImage: undefined,
                                  titleImage: undefined,
                                  bgm: undefined,
                                  showProjectTitle: true,
                                  titlePosition: 'center',
                                  titleColor: '#ffffff',
                                  titleFontSize: 48,
                                  ...currentProject.settings?.titleScreen,
                                  bgm: undefined
                                }
                              }
                            });
                          }
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                    <Music className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">タイトルBGMが設定されていません</p>
                    {availableBgm.length > 0 ? (
                      <select
                        onChange={(e) => {
                          const asset = availableBgm.find(a => a.id === e.target.value);
                          if (asset && currentProject) {
                            updateProject({
                              settings: {
                                ...currentProject.settings,
                                titleScreen: {
                                  backgroundImage: undefined,
                                  titleImage: undefined,
                                  bgm: undefined,
                                  showProjectTitle: true,
                                  titlePosition: 'center',
                                  titleColor: '#ffffff',
                                  titleFontSize: 48,
                                  ...currentProject.settings?.titleScreen,
                                  bgm: asset
                                }
                              }
                            });
                          }
                        }}
                        className="block mx-auto px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        defaultValue=""
                      >
                        <option value="">タイトルBGMを選択...</option>
                        {availableBgm.map(asset => (
                          <option key={`${asset.id}-${asset.name}`} value={asset.id}>
                            {asset.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        アセット管理からBGMをアップロードしてください
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              {availableBgm.length > 0 && validatedTitleBgmAsset && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">他のBGMに変更:</p>
                  <select
                    onChange={(e) => {
                      const asset = availableBgm.find(a => a.id === e.target.value);
                      if (asset && asset.id !== validatedTitleBgmAsset?.id && currentProject) {
                        updateProject({
                          settings: {
                            ...currentProject.settings,
                            titleScreen: {
                              backgroundImage: undefined,
                              titleImage: undefined,
                              bgm: undefined,
                              showProjectTitle: true,
                              titlePosition: 'center',
                              titleColor: '#ffffff',
                              titleFontSize: 48,
                              ...currentProject.settings?.titleScreen,
                              bgm: asset
                            }
                          }
                        });
                      }
                    }}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    value={validatedTitleBgmAsset.id}
                  >
                    {availableBgm.map(asset => (
                      <option key={`${asset.id}-${asset.name}`} value={asset.id}>
                        {asset.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 下部余白 - 視覚的圧迫感軽減 */}
        <div className="h-20"></div>
      </div>
    </div>
  );
};