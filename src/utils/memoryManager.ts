/**
 * メモリ管理ユーティリティ
 * ObjectURLのクリーンアップとリソース管理
 */

export class MemoryManager {
  private static objectUrls = new Set<string>();
  private static intervals = new Set<NodeJS.Timeout>();
  private static timeouts = new Set<NodeJS.Timeout>();

  /**
   * ObjectURLを作成し、管理対象に追加
   */
  static createObjectURL(blob: Blob): string {
    const url = URL.createObjectURL(blob);
    this.objectUrls.add(url);
    return url;
  }

  /**
   * 特定のObjectURLを削除
   */
  static revokeObjectURL(url: string): void {
    if (this.objectUrls.has(url)) {
      URL.revokeObjectURL(url);
      this.objectUrls.delete(url);
    }
  }

  /**
   * 管理対象のすべてのObjectURLを削除
   */
  static revokeAllObjectURLs(): void {
    this.objectUrls.forEach(url => {
      URL.revokeObjectURL(url);
    });
    this.objectUrls.clear();
  }

  /**
   * setIntervalを管理対象に追加
   */
  static setInterval(callback: () => void, delay: number): NodeJS.Timeout {
    const id = setInterval(callback, delay);
    this.intervals.add(id);
    return id;
  }

  /**
   * 管理対象のintervalをクリア
   */
  static clearInterval(id: NodeJS.Timeout): void {
    if (this.intervals.has(id)) {
      clearInterval(id);
      this.intervals.delete(id);
    }
  }

  /**
   * setTimeoutを管理対象に追加
   */
  static setTimeout(callback: () => void, delay: number): NodeJS.Timeout {
    const id = setTimeout(callback, delay);
    this.timeouts.add(id);
    return id;
  }

  /**
   * 管理対象のtimeoutをクリア
   */
  static clearTimeout(id: NodeJS.Timeout): void {
    if (this.timeouts.has(id)) {
      clearTimeout(id);
      this.timeouts.delete(id);
    }
  }

  /**
   * すべてのリソースをクリーンアップ
   */
  static cleanup(): void {
    this.revokeAllObjectURLs();
    
    this.intervals.forEach(id => clearInterval(id));
    this.intervals.clear();
    
    this.timeouts.forEach(id => clearTimeout(id));
    this.timeouts.clear();
  }

  /**
   * メモリ使用量の取得
   */
  static getMemoryInfo(): {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } | null {
    const memoryInfo = (performance as any).memory;
    
    if (!memoryInfo) {
      return null;
    }

    return {
      usedJSHeapSize: Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024), // MB
      totalJSHeapSize: Math.round(memoryInfo.totalJSHeapSize / 1024 / 1024), // MB
      jsHeapSizeLimit: Math.round(memoryInfo.jsHeapSizeLimit / 1024 / 1024), // MB
    };
  }

  /**
   * メモリ使用量の警告チェック
   */
  static checkMemoryUsage(): boolean {
    const memoryInfo = this.getMemoryInfo();
    
    if (!memoryInfo) {
      return false;
    }

    const usageRatio = memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit;
    
    if (usageRatio > 0.8) {
      console.warn('[MemoryManager] High memory usage detected:', {
        usage: `${(usageRatio * 100).toFixed(1)}%`,
        used: `${memoryInfo.usedJSHeapSize}MB`,
        limit: `${memoryInfo.jsHeapSizeLimit}MB`,
        managedUrls: this.objectUrls.size,
      });
      return true;
    }

    return false;
  }

  /**
   * ガベージコレクションの強制実行（開発時のみ）
   */
  static forceGarbageCollection(): void {
    if (process.env.NODE_ENV === 'development' && (window as any).gc) {
      try {
        (window as any).gc();
        console.log('[MemoryManager] Forced garbage collection');
      } catch (error) {
        console.warn('[MemoryManager] Could not force garbage collection:', error);
      }
    }
  }
}

// ページのアンロード時にクリーンアップ
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    MemoryManager.cleanup();
  });

  // 定期的なメモリチェック（開発時のみ）
  if (process.env.NODE_ENV === 'development') {
    MemoryManager.setInterval(() => {
      MemoryManager.checkMemoryUsage();
    }, 30000); // 30秒ごと
  }
}