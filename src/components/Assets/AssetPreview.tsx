import React, { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Download, Info } from 'lucide-react';
import { Asset } from '../../types';
import { Button } from '../UI';

interface AssetPreviewProps {
  asset: Asset;
  onClose: () => void;
  onSelect?: (asset: Asset) => void;
}

export const AssetPreview: React.FC<AssetPreviewProps> = ({
  asset,
  onClose,
  onSelect
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    
    const audio = audioRef.current;
    if (audio) {
      audio.volume = newVolume;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = (parseFloat(e.target.value) / 100) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const getCategoryLabel = (category: Asset['category']) => {
    const labels = {
      background: '背景画像',
      character: 'キャラクター画像',
      bgm: 'BGM',
      se: '効果音',
      other: 'その他'
    };
    return labels[category];
  };

  const downloadAsset = () => {
    const link = document.createElement('a');
    link.href = asset.url;
    link.download = asset.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{asset.name}</h2>
              <p className="text-sm text-gray-500">{getCategoryLabel(asset.category)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onSelect && (
              <Button onClick={() => onSelect(asset)}>
                選択
              </Button>
            )}
            <Button variant="secondary" onClick={downloadAsset}>
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="secondary" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex">
          {/* メインコンテンツ */}
          <div className="flex-1 p-6">
            {asset.type === 'image' ? (
              // 画像プレビュー
              <div className="text-center">
                <img
                  src={asset.url}
                  alt={asset.name}
                  className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg object-contain"
                />
                {asset.metadata.dimensions && (
                  <p className="mt-4 text-sm text-gray-500">
                    {asset.metadata.dimensions.width} × {asset.metadata.dimensions.height} ピクセル
                  </p>
                )}
              </div>
            ) : (
              // 音声プレビュー
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mx-auto flex items-center justify-center mb-4">
                    <Volume2 className="w-16 h-16 text-white" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">{asset.name}</h3>
                </div>

                {/* 音声コントロール */}
                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <audio ref={audioRef} src={asset.url} preload="metadata" />
                  
                  {/* 再生ボタンと時間表示 */}
                  <div className="flex items-center gap-4">
                    <Button
                      onClick={togglePlay}
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                    >
                      {isPlaying ? (
                        <Pause className="w-6 h-6" />
                      ) : (
                        <Play className="w-6 h-6 ml-1" />
                      )}
                    </Button>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <span>{formatTime(currentTime)}</span>
                        <span>/</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={duration ? (currentTime / duration) * 100 : 0}
                        onChange={handleSeek}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* 音量コントロール */}
                  <div className="flex items-center gap-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={toggleMute}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </Button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-sm text-gray-600 w-8">
                      {Math.round((isMuted ? 0 : volume) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* サイドバー - 詳細情報 */}
          <div className="w-80 bg-gray-50 p-6 border-l border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-gray-600" />
              <h3 className="font-medium text-gray-900">詳細情報</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ファイル名</label>
                <p className="text-sm text-gray-900 break-all">{asset.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
                <p className="text-sm text-gray-900">{getCategoryLabel(asset.category)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ファイルサイズ</label>
                <p className="text-sm text-gray-900">{formatFileSize(asset.metadata.size)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">形式</label>
                <p className="text-sm text-gray-900">{asset.metadata.format}</p>
              </div>

              {asset.metadata.dimensions && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">解像度</label>
                  <p className="text-sm text-gray-900">
                    {asset.metadata.dimensions.width} × {asset.metadata.dimensions.height}
                  </p>
                </div>
              )}

              {asset.metadata.duration !== undefined && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">再生時間</label>
                  <p className="text-sm text-gray-900">{formatTime(asset.metadata.duration)}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">アップロード日時</label>
                <p className="text-sm text-gray-900">{formatDate(asset.metadata.uploadedAt)}</p>
              </div>

              {asset.metadata.lastUsed && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">最終使用日時</label>
                  <p className="text-sm text-gray-900">{formatDate(asset.metadata.lastUsed)}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                <p className="text-xs text-gray-500 font-mono break-all">{asset.id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};