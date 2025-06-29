import React from 'react';
import { useEditorStore } from '../../stores/editorStore';
import { Input, Textarea, Button } from '../UI';
import { ChoiceEditor } from './ChoiceEditor';
import { Plus, Image, X, Music, ChevronDown, ChevronUp } from 'lucide-react';
import { generateId } from '../../utils';
import { Asset } from '../../types';

export const ParagraphEditor: React.FC = () => {
  const [isHeaderCollapsed, setIsHeaderCollapsed] = React.useState(false);
  
  const { 
    currentProject, 
    selectedParagraphId, 
    updateParagraph,
    addParagraph
  } = useEditorStore();

  const selectedParagraph = currentProject?.paragraphs.find(
    p => p.id === selectedParagraphId
  );

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

  const handleUpdateType = (type: 'start' | 'middle' | 'end') => {
    const updatedChoices = type === 'end' ? [] : selectedParagraph.content.choices;
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

  const handleUpdateBackground = (asset: Asset | null) => {
    updateParagraph(selectedParagraph.id, {
      content: {
        ...selectedParagraph.content,
        background: asset || undefined,
      },
    });
  };

  const handleUpdateBgm = (asset: Asset | null) => {
    updateParagraph(selectedParagraph.id, {
      content: {
        ...selectedParagraph.content,
        bgm: asset || undefined,
      },
    });
  };

  const availableBackgrounds = currentProject?.assets.filter(
    asset => asset.type === 'image' && (asset.category === 'background' || asset.category === 'other')
  ) || [];

  const availableBgm = currentProject?.assets.filter(
    asset => asset.type === 'audio' && (asset.category === 'bgm' || asset.category === 'other')
  ) || [];

  return (
    <div className="flex-1 overflow-y-auto h-full bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-16 py-8 space-y-8 min-h-full paragraph-editor-container">
        {/* 折りたたみ可能なヘッダー */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div 
            className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {isHeaderCollapsed ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  )}
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    パラグラフ編集
                  </h1>
                </div>
                {isHeaderCollapsed && (
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedParagraph.title}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  selectedParagraph.type === 'start' 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                    : selectedParagraph.type === 'end'
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                }`}>
                  {selectedParagraph.type === 'start' ? 'スタート' : 
                   selectedParagraph.type === 'end' ? 'エンド' : '中間'}
                </div>
              </div>
            </div>
          </div>
          
          {!isHeaderCollapsed && (
            <div className="px-8 pb-8 animate-slide-in">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                選択中: <span className="font-medium">{selectedParagraph.title}</span>
              </p>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full" />
                  選択肢: {selectedParagraph.content.choices.length}個
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full" />
                  文字数: {selectedParagraph.content.text.length}
                </div>
                {selectedParagraph.content.background && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full" />
                    背景画像あり
                  </div>
                )}
                {selectedParagraph.content.bgm && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                    BGMあり
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 基本情報 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden" style={{ margin: '0 2rem' }}>
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
                    onChange={(e) => handleUpdateType(e.target.value as 'start' | 'middle' | 'end')}
                    className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all duration-200"
                  >
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
        {selectedParagraph.type !== 'end' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden" style={{ margin: '0 2rem' }}>
            <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                    <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">選択肢</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">最大5個まで追加可能</p>
                  </div>
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

        {/* アセット設定 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden" style={{ margin: '0 2rem' }}>
          <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Music className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">アセット</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">背景画像やBGMを設定</p>
              </div>
            </div>
          </div>
          
          <div style={{ padding: '2rem 3rem' }} className="space-y-8">
          
          {/* 背景画像設定 */}
          <div className="space-y-3">
            <h3 className="text-md font-medium text-gray-800">背景画像</h3>
            
            {selectedParagraph.content.background ? (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-4">
                  <img
                    src={selectedParagraph.content.background.url}
                    alt={selectedParagraph.content.background.name}
                    className="w-24 h-16 object-cover rounded border"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {selectedParagraph.content.background.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedParagraph.content.background.metadata.dimensions ? 
                        `${selectedParagraph.content.background.metadata.dimensions.width}×${selectedParagraph.content.background.metadata.dimensions.height}` : 
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
                      <option key={asset.id} value={asset.id}>
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

          {availableBackgrounds.length > 0 && selectedParagraph.content.background && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">他の背景画像に変更:</p>
              <select
                onChange={(e) => {
                  const asset = availableBackgrounds.find(a => a.id === e.target.value);
                  if (asset && asset.id !== selectedParagraph.content.background?.id) {
                    handleUpdateBackground(asset);
                  }
                }}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={selectedParagraph.content.background.id}
              >
                {availableBackgrounds.map(asset => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* BGM設定 */}
          <div className="space-y-3">
            <h3 className="text-md font-medium text-gray-800">BGM</h3>
            
            {selectedParagraph.content.bgm ? (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-4">
                  <div className="w-24 h-16 bg-gray-100 rounded border flex items-center justify-center">
                    <Music className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {selectedParagraph.content.bgm.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedParagraph.content.bgm.metadata.duration ? 
                        `${Math.floor(selectedParagraph.content.bgm.metadata.duration / 60)}:${String(Math.floor(selectedParagraph.content.bgm.metadata.duration % 60)).padStart(2, '0')}` : 
                        '長さ不明'}
                    </p>
                    <audio 
                      controls 
                      className="mt-2 w-full h-8"
                      preload="metadata"
                    >
                      <source src={selectedParagraph.content.bgm.url} />
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
                      <option key={asset.id} value={asset.id}>
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

          {availableBgm.length > 0 && selectedParagraph.content.bgm && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">他のBGMに変更:</p>
              <select
                onChange={(e) => {
                  const asset = availableBgm.find(a => a.id === e.target.value);
                  if (asset && asset.id !== selectedParagraph.content.bgm?.id) {
                    handleUpdateBgm(asset);
                  }
                }}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={selectedParagraph.content.bgm.id}
              >
                {availableBgm.map(asset => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          </div>
        </div>

        {/* 下部余白 - スクロール時の視認性確保 */}
        <div className="h-24"></div>
      </div>
    </div>
  );
};