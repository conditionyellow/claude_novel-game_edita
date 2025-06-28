import React from 'react';
import { Choice, Paragraph } from '../../types';
import { Input, Button } from '../UI';
import { Trash2, Plus } from 'lucide-react';

interface ChoiceEditorProps {
  choice: Choice;
  index: number;
  paragraphs: Paragraph[];
  onUpdate: (text: string, targetId: string) => void;
  onDelete: () => void;
  onCreateNewParagraph: () => string; // 新規パラグラフ作成関数
  canDelete: boolean;
}

export const ChoiceEditor: React.FC<ChoiceEditorProps> = ({
  choice,
  index,
  paragraphs,
  onUpdate,
  onDelete,
  onCreateNewParagraph,
  canDelete,
}) => {
  const handleTextChange = (text: string) => {
    onUpdate(text, choice.targetParagraphId);
  };

  const handleTargetChange = (targetId: string) => {
    if (targetId === 'CREATE_NEW') {
      // 新規パラグラフを作成して接続
      const newParagraphId = onCreateNewParagraph();
      onUpdate(choice.text, newParagraphId);
    } else {
      onUpdate(choice.text, targetId);
    }
  };

  const handleCreateNewParagraph = () => {
    const newParagraphId = onCreateNewParagraph();
    onUpdate(choice.text, newParagraphId);
  };

  return (
    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
      <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
        {index + 1}
      </div>
      
      <div className="flex-1 space-y-3">
        <Input
          label="選択肢テキスト"
          value={choice.text}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="選択肢のテキストを入力"
        />
        
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            接続先パラグラフ
          </label>
          <div className="flex gap-2">
            <select
              value={choice.targetParagraphId}
              onChange={(e) => handleTargetChange(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- 接続先を選択 --</option>
              {paragraphs.map((paragraph) => (
                <option key={paragraph.id} value={paragraph.id}>
                  {paragraph.title} ({paragraph.type === 'start' ? 'スタート' : paragraph.type === 'end' ? 'エンド' : '中間'})
                </option>
              ))}
              <option value="CREATE_NEW">+ 新しいパラグラフを作成</option>
            </select>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCreateNewParagraph}
              className="px-3 py-2"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {!choice.targetParagraphId && (
            <p className="text-sm text-red-600">接続先を設定してください</p>
          )}
        </div>
      </div>
      
      <div className="flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          disabled={!canDelete}
          className="p-2"
        >
          <Trash2 className="w-4 h-4 text-red-500" />
        </Button>
      </div>
    </div>
  );
};