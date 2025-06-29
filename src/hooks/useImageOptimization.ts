/**
 * 画像最適化フック
 * デバイスサイズとコンテナサイズに応じた画像表示最適化
 */

import { useState, useEffect, useRef } from 'react';

interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'jpg' | 'png';
}

interface OptimizedImageInfo {
  displayWidth: number;
  displayHeight: number;
  scaleFactor: number;
  isOptimized: boolean;
}

export const useImageOptimization = (
  imageUrl: string,
  containerRef: React.RefObject<HTMLElement>,
  options: ImageOptimizationOptions = {}
) => {
  const [imageInfo, setImageInfo] = useState<OptimizedImageInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>();

  const {
    maxWidth = Math.min(window.innerWidth * 0.8, 1200),
    maxHeight = Math.min(window.innerHeight * 0.7, 800),
    quality = 0.9,
    format = 'auto'
  } = options;

  useEffect(() => {
    if (!imageUrl) return;

    setIsLoading(true);
    setError(null);

    const img = new Image();
    imageRef.current = img;

    img.onload = () => {
      const containerWidth = containerRef.current?.clientWidth || maxWidth;
      const containerHeight = containerRef.current?.clientHeight || maxHeight;

      // 利用可能なスペースを計算（パディングとモバイル対応を考慮）
      const isMobile = window.innerWidth < 768;
      const paddingFactor = isMobile ? 0.9 : 0.95;
      
      const availableWidth = Math.min(containerWidth * paddingFactor, maxWidth);
      const availableHeight = Math.min(containerHeight * paddingFactor, maxHeight);

      // 画像のアスペクト比を保持しながら最適なサイズを計算
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      
      let displayWidth = img.naturalWidth;
      let displayHeight = img.naturalHeight;

      // 幅が制限を超える場合
      if (displayWidth > availableWidth) {
        displayWidth = availableWidth;
        displayHeight = displayWidth / aspectRatio;
      }

      // 高さが制限を超える場合
      if (displayHeight > availableHeight) {
        displayHeight = availableHeight;
        displayWidth = displayHeight * aspectRatio;
      }

      const scaleFactor = displayWidth / img.naturalWidth;
      const isOptimized = scaleFactor < 1;

      setImageInfo({
        displayWidth,
        displayHeight,
        scaleFactor,
        isOptimized,
      });

      setIsLoading(false);
    };

    img.onerror = () => {
      setError('画像の読み込みに失敗しました');
      setIsLoading(false);
    };

    img.src = imageUrl;

    return () => {
      if (imageRef.current) {
        imageRef.current.onload = null;
        imageRef.current.onerror = null;
      }
    };
  }, [imageUrl, maxWidth, maxHeight, containerRef]);

  // ウィンドウリサイズ時の再計算
  useEffect(() => {
    const handleResize = () => {
      if (imageRef.current && imageRef.current.complete) {
        // 画像の onload を再実行して再計算
        const event = new Event('load');
        imageRef.current.dispatchEvent(event);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    imageInfo,
    isLoading,
    error,
    optimizedStyle: imageInfo ? {
      width: `${imageInfo.displayWidth}px`,
      height: `${imageInfo.displayHeight}px`,
      maxWidth: '100%',
      maxHeight: '100%',
      objectFit: 'contain' as const,
    } : undefined,
  };
};