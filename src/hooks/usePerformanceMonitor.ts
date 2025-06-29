/**
 * パフォーマンス監視フック
 * レンダリング時間やメモリ使用量の追跡
 */

import { useEffect, useRef, useState } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  componentMountTime: number;
}

export const usePerformanceMonitor = (componentName: string) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    componentMountTime: 0,
  });
  
  const mountStartTime = useRef<number>(performance.now());
  const renderStartTime = useRef<number>(0);

  // レンダー開始時間を記録
  useEffect(() => {
    renderStartTime.current = performance.now();
  });

  // レンダー終了時間を計測
  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;
    
    const memoryInfo = (performance as any).memory;
    const memoryUsage = memoryInfo ? memoryInfo.usedJSHeapSize / 1024 / 1024 : 0; // MB

    setMetrics(prev => ({
      ...prev,
      renderTime,
      memoryUsage,
    }));

    // パフォーマンスログ（開発時のみ）
    if (process.env.NODE_ENV === 'development' && renderTime > 100) {
      console.warn(`[Performance] ${componentName} render time: ${renderTime.toFixed(2)}ms`);
    }
  });

  // マウント時間の計測
  useEffect(() => {
    const componentMountTime = performance.now() - mountStartTime.current;
    
    setMetrics(prev => ({
      ...prev,
      componentMountTime,
    }));

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${componentName} mount time: ${componentMountTime.toFixed(2)}ms`);
    }
  }, [componentName]);

  return metrics;
};