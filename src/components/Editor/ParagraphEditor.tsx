import React from 'react';
import { useEditorStore } from '../../stores/editorStore';
import { Input, Textarea, Button } from '../UI';
import { ChoiceEditor } from './ChoiceEditor';
import { Plus, Image, X } from 'lucide-react';
import { generateId } from '../../utils';
import { Asset } from '../../types';

export const ParagraphEditor: React.FC = () => {
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
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">プロジェクトが読み込まれていません</p>
      </div>
    );
  }

  if (!selectedParagraph) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">パラグラフを選択してください</p>
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

  const availableBackgrounds = currentProject?.assets.filter(
    asset => asset.type === 'image' && (asset.category === 'background' || asset.category === 'other')
  ) || [];

  return (
    <div className="flex-1 overflow-y-auto h-full">
      <div className="max-w-4xl mx-auto p-6 space-y-6 min-h-full">
        {/* ヘッダー */}
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-bold text-gray-900">パラグラフ編集</h1>
          <p className="text-sm text-gray-600 mt-1">
            選択中: {selectedParagraph.title}
          </p>
        </div>

        {/* 基本情報 */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="タイトル"
              value={selectedParagraph.title}
              onChange={(e) => handleUpdateTitle(e.target.value)}
              placeholder="パラグラフのタイトルを入力"
            />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                タイプ
              </label>
              <select
                value={selectedParagraph.type}
                onChange={(e) => handleUpdateType(e.target.value as 'start' | 'middle' | 'end')}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="start">スタート</option>
                <option value="middle">中間</option>
                <option value="end">エンド</option>
              </select>
            </div>
          </div>

          <Textarea
            label="本文"
            value={selectedParagraph.content.text}
            onChange={(e) => handleUpdateText(e.target.value)}
            placeholder="パラグラフの本文を入力してください..."
            rows={8}
          />
        </div>

        {/* 選択肢編集 */}
        {selectedParagraph.type !== 'end' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">選択肢</h2>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAddChoice}
                disabled={selectedParagraph.content.choices.length >= 5}
              >
                <Plus className="w-4 h-4 mr-1" />
                選択肢追加
              </Button>
            </div>

            {selectedParagraph.content.choices.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">選択肢がありません</p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAddChoice}
                  className="mt-2"
                >
                  最初の選択肢を追加
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedParagraph.content.choices.map((choice, index) => (
                  <ChoiceEditor
                    key={choice.id}
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
                ))}
              </div>
            )}

            <div className="text-sm text-gray-600">
              最大5個まで選択肢を追加できます。
              現在: {selectedParagraph.content.choices.length}/5
            </div>
          </div>
        )}

        {/* アセット設定 */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">アセット</h2>
          
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
        </div>

        {/* 下部余白 - スクロール時の視認性確保 */}
        <div className="h-24"></div>
      </div>
    </div>
  );
};