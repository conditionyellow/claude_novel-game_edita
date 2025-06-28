import React, { useCallback, useState } from 'react';
import { Upload, X, AlertCircle, CheckCircle } from 'lucide-react';
import { Asset, AssetUploadOptions, AssetValidationResult } from '../../types';
import { Button } from '../UI';
import { nanoid } from 'nanoid';

interface AssetUploaderProps {
  options: AssetUploadOptions;
  onUpload: (asset: Asset, file: File) => void; // Fileオブジェクトも渡すように変更
  onValidationError?: (errors: string[]) => void;
  className?: string;
}

export const AssetUploader: React.FC<AssetUploaderProps> = ({
  options,
  onUpload,
  onValidationError,
  className = ''
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationResult, setValidationResult] = useState<AssetValidationResult | null>(null);

  // ファイル形式とサイズの制限設定
  const defaultOptions = {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedFormats: options.category === 'background' || options.category === 'character' 
      ? ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      : ['audio/mpeg', 'audio/wav', 'audio/ogg'],
    autoOptimize: true,
    ...options
  };

  // ファイルバリデーション
  const validateFile = useCallback((file: File): AssetValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // ファイルサイズチェック
    if (file.size > defaultOptions.maxSize!) {
      errors.push(`ファイルサイズが上限（${(defaultOptions.maxSize! / 1024 / 1024).toFixed(1)}MB）を超えています`);
    }

    // ファイル形式チェック
    if (!defaultOptions.allowedFormats!.includes(file.type)) {
      errors.push(`サポートされていないファイル形式です（対応形式: ${defaultOptions.allowedFormats!.join(', ')}）`);
    }

    // 警告
    if (file.size > 5 * 1024 * 1024) {
      warnings.push('ファイルサイズが大きいため、最適化を推奨します');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      optimizedSize: defaultOptions.autoOptimize ? Math.floor(file.size * 0.7) : file.size
    };
  }, [defaultOptions]);

  // ファイル処理
  const processFile = useCallback(async (file: File): Promise<Asset> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const result = e.target?.result as string;
        
        // 画像の場合は寸法を取得
        let dimensions: { width: number; height: number } | undefined;
        if (file.type.startsWith('image/')) {
          const img = new Image();
          img.onload = () => {
            dimensions = { width: img.width, height: img.height };
            
            const asset: Asset = {
              id: nanoid(),
              name: file.name,
              url: result,
              type: file.type.startsWith('image/') ? 'image' : 'audio',
              category: options.category,
              metadata: {
                size: file.size,
                format: file.type,
                dimensions,
                uploadedAt: new Date(),
                ...(file.type.startsWith('audio/') && { duration: 0 }) // 将来的に音声長を取得
              }
            };
            
            resolve(asset);
          };
          img.src = result;
        } else {
          // 音声ファイルの場合
          const asset: Asset = {
            id: nanoid(),
            name: file.name,
            url: result,
            type: 'audio',
            category: options.category,
            metadata: {
              size: file.size,
              format: file.type,
              uploadedAt: new Date(),
              duration: 0 // 将来的に音声長を取得
            }
          };
          
          resolve(asset);
        }
      };
      
      reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'));
      reader.readAsDataURL(file);
    });
  }, [options.category]);

  // ファイルアップロード処理
  const handleFileUpload = useCallback(async (files: FileList) => {
    if (files.length === 0) return;

    const file = files[0]; // 現在は単一ファイルのみ対応
    const validation = validateFile(file);
    setValidationResult(validation);

    if (!validation.isValid) {
      onValidationError?.(validation.errors);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // プログレス表示のシミュレーション
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const next = prev + 10;
          if (next >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return next;
        });
      }, 100);

      const asset = await processFile(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // 少し待ってからコールバック実行
      setTimeout(() => {
        onUpload(asset, file); // Fileオブジェクトも渡す
        setIsUploading(false);
        setUploadProgress(0);
        setValidationResult(null);
      }, 300);

    } catch (error) {
      setIsUploading(false);
      setUploadProgress(0);
      const errorMessage = error instanceof Error ? error.message : 'アップロードに失敗しました';
      onValidationError?.([errorMessage]);
    }
  }, [validateFile, processFile, onUpload, onValidationError]);

  // ドラッグ&ドロップハンドラ
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    handleFileUpload(files);
  }, [handleFileUpload]);

  // ファイル選択ハンドラ
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

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

  return (
    <div className={`space-y-4 ${className}`}>
      {/* アップロードエリア */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
          ${isDragOver 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
          ${isUploading ? 'pointer-events-none opacity-75' : 'cursor-pointer'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!isUploading) {
            document.getElementById('file-input')?.click();
          }
        }}
      >
        <input
          id="file-input"
          type="file"
          accept={defaultOptions.allowedFormats!.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="space-y-4">
            <div className="animate-spin mx-auto">
              <Upload className="w-8 h-8 text-blue-500" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">アップロード中...</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">{uploadProgress}%</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="w-12 h-12 text-gray-400 mx-auto" />
            <div>
              <p className="text-lg font-medium text-gray-700">
                {getCategoryLabel(options.category)}をアップロード
              </p>
              <p className="text-sm text-gray-500 mt-1">
                ファイルをドラッグ&ドロップするか、クリックして選択
              </p>
            </div>
            <div className="text-xs text-gray-400 space-y-1">
              <p>対応形式: {defaultOptions.allowedFormats!.join(', ')}</p>
              <p>最大サイズ: {(defaultOptions.maxSize! / 1024 / 1024).toFixed(1)}MB</p>
            </div>
          </div>
        )}
      </div>

      {/* バリデーション結果表示 */}
      {validationResult && (
        <div className="space-y-2">
          {validationResult.errors.map((error, index) => (
            <div key={index} className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          ))}
          {validationResult.warnings.map((warning, index) => (
            <div key={index} className="flex items-center gap-2 p-3 bg-yellow-50 text-yellow-700 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{warning}</span>
            </div>
          ))}
          {validationResult.isValid && validationResult.warnings.length === 0 && (
            <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">ファイルは正常です</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};