/**
 * アセットURL管理ユーティリティ
 * ObjectURLのライフサイクル管理と参照切れ検出機能
 */

import { assetStorage } from './assetStorageManager';
import type { Asset } from '../types';

/**
 * ObjectURLの有効性を非同期でチェック
 */
export async function isObjectUrlValid(url: string): Promise<boolean> {
  try {
    // HEADメソッドがサポートされていない場合はGETを使用（Range指定で最小限のデータ取得）
    const response = await fetch(url, { 
      method: 'GET',
      headers: {
        'Range': 'bytes=0-0'
      }
    });
    return response.ok || response.status === 206; // 206 Partial Content も有効とみなす
  } catch (error) {
    // フォールバック: 軽量なGETリクエストで検証
    try {
      const response = await fetch(url);
      return response.ok;
    } catch (fallbackError) {
      return false;
    }
  }
}

/**
 * アセットのURL有効性を一括チェック
 */
// 検証結果をキャッシュしてパフォーマンス向上
const validationCache = new Map<string, { timestamp: number; isValid: boolean }>();
const CACHE_DURATION = 5000; // 5秒キャッシュ

export async function validateAssetUrls(assets: Asset[]): Promise<{
  validAssets: Asset[];
  invalidAssets: Asset[];
  validationResults: Array<{ asset: Asset; isValid: boolean }>;
}> {
  const now = Date.now();
  console.log('🔍 アセットURL一括検証開始:', assets.length, '個のアセット');
  
  const validationPromises = assets.map(async (asset) => {
    if (asset.url.startsWith('blob:')) {
      // キャッシュをチェック
      const cached = validationCache.get(asset.url);
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        console.log(`💾 ${asset.name}: キャッシュから${cached.isValid ? '有効' : '無効'}`);
        return { asset, isValid: cached.isValid };
      }
      
      const isValid = await isObjectUrlValid(asset.url);
      
      // 結果をキャッシュ
      validationCache.set(asset.url, { timestamp: now, isValid });
      
      console.log(`${isValid ? '✅' : '❌'} ${asset.name}: ${isValid ? '有効' : '無効'}`);
      return { asset, isValid };
    } else {
      // Base64や他の形式は常に有効とみなす
      return { asset, isValid: true };
    }
  });
  
  const validationResults = await Promise.all(validationPromises);
  
  const validAssets = validationResults
    .filter(result => result.isValid)
    .map(result => result.asset);
    
  const invalidAssets = validationResults
    .filter(result => !result.isValid)
    .map(result => result.asset);
  
  console.log('📊 検証結果:', {
    総数: assets.length,
    有効: validAssets.length,
    無効: invalidAssets.length
  });
  
  return { validAssets, invalidAssets, validationResults };
}

/**
 * 検証キャッシュをクリア（メモリ管理）
 */
export function clearValidationCache(): void {
  validationCache.clear();
  console.log('🧹 アセット検証キャッシュをクリアしました');
}

/**
 * 無効なObjectURLを持つアセットのURL再生成
 */
export async function regenerateInvalidAssetUrls(
  projectId: string, 
  invalidAssets: Asset[]
): Promise<Asset[]> {
  console.log('🔄 無効アセットURL再生成開始:', invalidAssets.length, '個');
  
  const regeneratedAssets: Asset[] = [];
  
  for (const asset of invalidAssets) {
    try {
      console.log(`🔧 再生成中: ${asset.name}`);
      
      const newUrl = await assetStorage.getAssetUrl(projectId, asset.id);
      
      const regeneratedAsset = {
        ...asset,
        url: newUrl,
        metadata: {
          ...asset.metadata,
          lastUsed: new Date()
        }
      };
      
      regeneratedAssets.push(regeneratedAsset);
      console.log(`✅ 再生成完了: ${asset.name}`);
      
    } catch (error) {
      console.warn(`⚠️ 再生成失敗: ${asset.name}`, error);
      // エラーの場合でも元のアセットを保持
      regeneratedAssets.push(asset);
    }
  }
  
  console.log('🎯 URL再生成完了:', regeneratedAssets.length, '個処理');
  return regeneratedAssets;
}

/**
 * プロアクティブアセット参照修復
 * 全てのObjectURLを無条件で再生成（最も確実な方法）
 */
export async function proactivelyRegenerateAllObjectUrls(
  projectId: string,
  assets: Asset[]
): Promise<Asset[]> {
  console.log('🚀 プロアクティブURL再生成開始:', assets.length, '個のアセット');
  
  const regeneratedAssets: Asset[] = [];
  let regeneratedCount = 0;
  
  for (const asset of assets) {
    if (asset.url.startsWith('blob:')) {
      try {
        console.log(`🔄 プロアクティブ再生成: ${asset.name}`);
        
        const newUrl = await assetStorage.getAssetUrl(projectId, asset.id);
        
        regeneratedAssets.push({
          ...asset,
          url: newUrl,
          metadata: {
            ...asset.metadata,
            lastUsed: new Date()
          }
        });
        
        regeneratedCount++;
        console.log(`✅ プロアクティブ再生成完了: ${asset.name}`);
        
      } catch (error) {
        console.warn(`⚠️ プロアクティブ再生成失敗: ${asset.name}`, error);
        regeneratedAssets.push(asset);
      }
    } else {
      // Base64や他の形式はそのまま維持
      regeneratedAssets.push(asset);
    }
  }
  
  console.log(`🎯 プロアクティブ再生成完了: ${regeneratedCount}個のObjectURLを再生成`);
  return regeneratedAssets;
}

/**
 * アセットURL自動修復（設定可能な戦略）
 */
export async function autoRepairAssetUrls(
  projectId: string,
  assets: Asset[],
  strategy: 'validation-based' | 'proactive' = 'validation-based'
): Promise<Asset[]> {
  console.log(`🔧 アセットURL自動修復開始 (戦略: ${strategy})`);
  
  if (assets.length === 0) {
    console.log('アセットが存在しないため、修復をスキップ');
    return assets;
  }
  
  if (strategy === 'proactive') {
    // プロアクティブ戦略：全ObjectURLを無条件で再生成
    return await proactivelyRegenerateAllObjectUrls(projectId, assets);
  } else {
    // 検証ベース戦略：有効性チェック後に必要分のみ再生成
    const { validAssets, invalidAssets } = await validateAssetUrls(assets);
    
    if (invalidAssets.length === 0) {
      console.log('✅ 全てのアセットURLが有効です');
      return assets;
    }
    
    const regeneratedInvalidAssets = await regenerateInvalidAssetUrls(projectId, invalidAssets);
    
    // 有効アセットと再生成アセットを統合
    return [...validAssets, ...regeneratedInvalidAssets];
  }
}