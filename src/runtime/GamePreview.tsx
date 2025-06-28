import React, { useState, useEffect } from 'react';
import { Paragraph, NovelProject } from '../types';
import { Play, RotateCcw, Home } from 'lucide-react';
import { Button } from '../components/UI';

interface GamePreviewProps {
  project: NovelProject;
}

export const GamePreview: React.FC<GamePreviewProps> = ({ project }) => {
  const [currentParagraph, setCurrentParagraph] = useState<Paragraph | null>(null);
  const [gameHistory, setGameHistory] = useState<string[]>([]);
  const [isGameStarted, setIsGameStarted] = useState(false);

  // ゲーム開始時に最初のパラグラフを設定
  useEffect(() => {
    if (project && project.paragraphs.length > 0) {
      const startParagraph = project.paragraphs.find(p => p.type === 'start') || project.paragraphs[0];
      setCurrentParagraph(startParagraph);
    }
  }, [project]);

  const startGame = () => {
    setIsGameStarted(true);
    setGameHistory([]);
    const startParagraph = project.paragraphs.find(p => p.type === 'start') || project.paragraphs[0];
    setCurrentParagraph(startParagraph);
    if (startParagraph) {
      setGameHistory([startParagraph.id]);
    }
  };

  const resetGame = () => {
    setIsGameStarted(false);
    setGameHistory([]);
    const startParagraph = project.paragraphs.find(p => p.type === 'start') || project.paragraphs[0];
    setCurrentParagraph(startParagraph);
  };

  const selectChoice = (targetParagraphId: string) => {
    const targetParagraph = project.paragraphs.find(p => p.id === targetParagraphId);
    if (targetParagraph) {
      setCurrentParagraph(targetParagraph);
      setGameHistory(prev => [...prev, targetParagraphId]);
    }
  };

  const goBack = () => {
    if (gameHistory.length > 1) {
      const newHistory = gameHistory.slice(0, -1);
      const previousParagraphId = newHistory[newHistory.length - 1];
      const previousParagraph = project.paragraphs.find(p => p.id === previousParagraphId);
      
      if (previousParagraph) {
        setCurrentParagraph(previousParagraph);
        setGameHistory(newHistory);
      }
    }
  };

  if (!project || project.paragraphs.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            プロジェクトが空です
          </h3>
          <p className="text-gray-600">
            パラグラフを追加してからプレビューしてください。
          </p>
        </div>
      </div>
    );
  }

  if (!isGameStarted) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {project.title}
          </h2>
          <p className="text-gray-600 mb-6">
            {project.description || 'ノベルゲームのプレビュー'}
          </p>
          <div className="space-y-3">
            <Button 
              onClick={startGame}
              className="w-full"
              variant="primary"
            >
              <Play className="w-4 h-4 mr-2" />
              ゲーム開始
            </Button>
            <div className="text-sm text-gray-500">
              パラグラフ数: {project.paragraphs.length}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentParagraph) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <h3 className="text-lg font-semibold text-red-600 mb-2">
            エラー
          </h3>
          <p className="text-gray-600 mb-4">
            表示するパラグラフが見つかりません。
          </p>
          <Button onClick={resetGame} variant="secondary">
            <Home className="w-4 h-4 mr-2" />
            タイトルに戻る
          </Button>
        </div>
      </div>
    );
  }

  const isEndParagraph = currentParagraph.type === 'end' || currentParagraph.content.choices.length === 0;

  return (
    <div className="flex-1 flex flex-col bg-gray-900 text-white">
      {/* ゲームコントロール */}
      <div className="bg-gray-800 p-3 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button 
              onClick={resetGame} 
              variant="ghost" 
              size="sm"
              className="text-white hover:bg-gray-700"
            >
              <Home className="w-4 h-4 mr-1" />
              タイトル
            </Button>
            <Button 
              onClick={goBack} 
              variant="ghost" 
              size="sm"
              disabled={gameHistory.length <= 1}
              className="text-white hover:bg-gray-700 disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              戻る
            </Button>
          </div>
          <div className="text-sm text-gray-400">
            {currentParagraph.title || 'パラグラフ'}
          </div>
        </div>
      </div>

      {/* ゲーム画面 */}
      <div className="flex-1 flex flex-col justify-center items-center p-8">
        <div className="bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full min-h-[400px] flex flex-col">
          
          {/* 背景画像エリア */}
          <div className="flex-1 bg-gray-700 rounded-t-lg relative overflow-hidden min-h-[200px]">
            {currentParagraph.content.background ? (
              <img
                src={currentParagraph.content.background.url}
                alt={currentParagraph.content.background.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-gray-500 text-sm">
                  背景画像なし
                </div>
              </div>
            )}
          </div>

          {/* テキストエリア */}
          <div className="bg-black bg-opacity-80 p-6 rounded-b-lg">
            <div className="prose prose-invert max-w-none">
              <p className="text-lg leading-relaxed whitespace-pre-wrap">
                {currentParagraph.content.text || '（テキストが設定されていません）'}
              </p>
            </div>

            {/* 選択肢 */}
            {!isEndParagraph && currentParagraph.content.choices.length > 0 && (
              <div className="mt-6 space-y-3">
                {currentParagraph.content.choices.map((choice, index) => (
                  <Button
                    key={choice.id}
                    onClick={() => selectChoice(choice.targetParagraphId)}
                    variant="secondary"
                    className="w-full text-left justify-start bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
                  >
                    {index + 1}. {choice.text}
                  </Button>
                ))}
              </div>
            )}

            {/* エンド画面 */}
            {isEndParagraph && (
              <div className="mt-6 text-center">
                <div className="text-gray-400 mb-4">
                  {currentParagraph.type === 'end' ? '--- END ---' : '--- 選択肢がありません ---'}
                </div>
                <Button 
                  onClick={resetGame}
                  variant="primary"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Home className="w-4 h-4 mr-2" />
                  タイトルに戻る
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* デバッグ情報 */}
      <div className="bg-gray-800 p-3 border-t border-gray-700 text-xs">
        <div className="flex items-center justify-between text-gray-400">
          <span>パラグラフID: {currentParagraph.id}</span>
          <span>タイプ: {currentParagraph.type}</span>
          <span>履歴: {gameHistory.length}歩</span>
        </div>
      </div>
    </div>
  );
};