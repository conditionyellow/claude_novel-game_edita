import React, { useState, useEffect, useRef } from 'react';
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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ゲーム開始時に最初のパラグラフを設定
  useEffect(() => {
    if (project && project.paragraphs.length > 0) {
      const startParagraph = project.paragraphs.find(p => p.type === 'start') || project.paragraphs[0];
      setCurrentParagraph(startParagraph);
    }
  }, [project]);

  // BGM制御のuseEffect
  useEffect(() => {
    if (!isGameStarted || !currentParagraph) return;

    const playBgm = (bgmUrl: string) => {
      if (audioRef.current) {
        if (audioRef.current.src !== bgmUrl) {
          audioRef.current.src = bgmUrl;
        }
        audioRef.current.loop = true;
        audioRef.current.volume = 0.7;
        audioRef.current.play().catch(error => {
          console.log('BGM autoplay prevented:', error);
        });
      }
    };

    const stopBgm = () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };

    if (currentParagraph.content.bgm) {
      playBgm(currentParagraph.content.bgm.url);
    } else {
      stopBgm();
    }

    // クリーンアップ関数
    return () => {
      if (!currentParagraph?.content.bgm) {
        stopBgm();
      }
    };
  }, [currentParagraph, isGameStarted]);

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
    
    // BGMを停止
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
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
      {/* BGM用のaudio要素（非表示） */}
      <audio ref={audioRef} style={{ display: 'none' }} />
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
      <div className="flex-1 flex flex-col justify-center items-center p-4">
        <div className="bg-gray-800 rounded-lg shadow-2xl max-w-5xl w-full h-[85vh] relative overflow-hidden">
          
          {/* 背景画像エリア（全画面表示） */}
          <div className="absolute inset-0 bg-gray-700 z-0">
            {currentParagraph.content.background ? (
              <img
                src={currentParagraph.content.background.url}
                alt={currentParagraph.content.background.name}
                className="w-full h-full object-contain bg-gray-900"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-gray-500 text-sm">
                  背景画像なし
                </div>
              </div>
            )}
          </div>

          {/* テキストエリア（オーバーレイ） */}
          <div className="absolute bottom-0 left-0 right-0 z-50 backdrop-blur-md p-6 max-h-[45%] min-h-[30%] overflow-y-auto border-t border-gray-600 shadow-2xl" style={{ position: 'absolute', bottom: '0', left: '0', right: '0' }}>
            
            {/* 本文エリア */}
            <div className="mb-4">
              <div 
                className="p-4 rounded-lg backdrop-blur-sm border border-gray-400 border-opacity-50"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
              >
                <p className="text-lg leading-relaxed whitespace-pre-wrap drop-shadow-lg" style={{ color: 'white', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.9), 1px 1px 2px rgba(0, 0, 0, 1)' }}>
                  {currentParagraph.content.text || '（テキストが設定されていません）'}
                </p>
              </div>
            </div>

            {/* 選択肢エリア */}
            {!isEndParagraph && currentParagraph.content.choices.length > 0 && (
              <div className="space-y-2">
                {currentParagraph.content.choices.map((choice, index) => (
                  <Button
                    key={choice.id}
                    onClick={() => selectChoice(choice.targetParagraphId)}
                    variant="secondary"
                    className="w-full text-left justify-start py-2 px-4 text-sm backdrop-blur-sm shadow-lg rounded-lg"
                    style={{ 
                      backgroundColor: 'rgba(0, 0, 0, 0.3)', 
                      color: 'white',
                      border: '2px solid rgba(255, 255, 255, 0.6)',
                      borderRadius: '8px'
                    }}
                    onMouseEnter={(e) => { 
                      e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.8)';
                    }}
                    onMouseLeave={(e) => { 
                      e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)';
                    }}
                  >
                    <span className="drop-shadow-md">{index + 1}. {choice.text}</span>
                  </Button>
                ))}
              </div>
            )}

            {/* エンド画面 */}
            {isEndParagraph && (
              <div className="mt-4 text-center">
                <div className="text-gray-300 mb-3 text-sm drop-shadow-md">
                  {currentParagraph.type === 'end' ? '--- END ---' : '--- 選択肢がありません ---'}
                </div>
                <Button 
                  onClick={resetGame}
                  variant="primary"
                  className="py-2 px-4 text-sm backdrop-blur-sm shadow-lg rounded-lg"
                  style={{ 
                    backgroundColor: 'rgba(37, 99, 235, 0.3)', 
                    color: 'white',
                    border: '2px solid rgba(59, 130, 246, 0.6)',
                    borderRadius: '8px'
                  }}
                >
                  <Home className="w-4 h-4 mr-2" />
                  <span className="drop-shadow-md">タイトルに戻る</span>
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