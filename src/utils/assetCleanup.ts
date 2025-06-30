import { assetStorage } from './assetStorageManager';
import { Project, Asset } from '../types';

/**
 * アセット整合性チェック・修復ユーティリティ
 */
export class AssetCleanupManager {
  /**
   * プロジェクトのアセット整合性をチェック
   */
  static async checkProjectIntegrity(project: Project): Promise<{
    validAssets: Asset[];
    invalidAssets: Asset[];
    orphanedAssets: Asset[];
  }> {
    const validAssets: Asset[] = [];
    const invalidAssets: Asset[] = [];
    
    // プロジェクトが参照している全アセットをチェック
    for (const asset of project.assets) {
      try {
        const storedAsset = await assetStorage.getAsset(project.id, asset.id);
        if (storedAsset) {
          validAssets.push(asset);
        } else {
          console.warn(`Invalid asset reference: ${asset.name} (${asset.id})`);
          invalidAssets.push(asset);
        }
      } catch (error) {
        console.error(`Error checking asset ${asset.name}:`, error);
        invalidAssets.push(asset);
      }
    }
    
    // IndexedDBに存在するがプロジェクトで参照されていないアセット
    const storedAssets = await assetStorage.getProjectAssets(project.id);
    const referencedIds = new Set(project.assets.map(a => a.id));
    const orphanedAssets = storedAssets.filter(asset => !referencedIds.has(asset.id));
    
    return { validAssets, invalidAssets, orphanedAssets };
  }

  /**
   * 無効なアセット参照を削除
   */
  static cleanupInvalidReferences(project: Project, validAssets: Asset[]): Project {
    return {
      ...project,
      assets: validAssets,
      paragraphs: project.paragraphs.map(paragraph => ({
        ...paragraph,
        backgroundImage: validAssets.find(a => a.id === paragraph.backgroundImage?.split('/').pop())
          ? paragraph.backgroundImage
          : undefined,
        bgm: validAssets.find(a => a.id === paragraph.bgm?.split('/').pop())
          ? paragraph.bgm
          : undefined,
      }))
    };
  }

  /**
   * 孤立したアセットを削除
   */
  static async cleanupOrphanedAssets(projectId: string, orphanedAssets: Asset[]): Promise<void> {
    console.log(`Cleaning up ${orphanedAssets.length} orphaned assets...`);
    
    for (const asset of orphanedAssets) {
      try {
        await assetStorage.deleteAsset(projectId, asset.id);
        console.log(`Deleted orphaned asset: ${asset.name}`);
      } catch (error) {
        console.error(`Failed to delete orphaned asset ${asset.name}:`, error);
      }
    }
  }

  /**
   * プロジェクト全体のクリーンアップ
   */
  static async cleanupProject(project: Project): Promise<Project> {
    console.log('🧹 Starting project cleanup...');
    
    const { validAssets, invalidAssets, orphanedAssets } = await this.checkProjectIntegrity(project);
    
    console.log(`📊 Cleanup stats:
      - Valid assets: ${validAssets.length}
      - Invalid references: ${invalidAssets.length}
      - Orphaned assets: ${orphanedAssets.length}`);

    // 無効な参照を削除
    const cleanedProject = this.cleanupInvalidReferences(project, validAssets);
    
    // 孤立したアセットを削除
    if (orphanedAssets.length > 0) {
      await this.cleanupOrphanedAssets(project.id, orphanedAssets);
    }

    console.log('✅ Project cleanup completed');
    return cleanedProject;
  }

  /**
   * ObjectURL の有効性をチェック
   */
  static async validateObjectUrls(assets: Asset[]): Promise<Asset[]> {
    const validatedAssets: Asset[] = [];
    
    for (const asset of assets) {
      if (asset.url.startsWith('blob:')) {
        try {
          // ObjectURL の有効性をチェック
          const response = await fetch(asset.url);
          if (response.ok) {
            validatedAssets.push(asset);
          } else {
            console.warn(`Invalid ObjectURL for asset: ${asset.name}`);
            // 無効なObjectURLの場合、URLを空にして再生成を促す
            validatedAssets.push({
              ...asset,
              url: ''
            });
          }
        } catch (error) {
          console.warn(`Failed to validate ObjectURL for asset: ${asset.name}`, error);
          validatedAssets.push({
            ...asset,
            url: ''
          });
        }
      } else {
        validatedAssets.push(asset);
      }
    }
    
    return validatedAssets;
  }
}