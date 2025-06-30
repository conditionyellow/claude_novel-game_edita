/**
 * アセット参照修復専用フック
 * パラグラフ設定画面での確実なアセット参照修復機能
 */

import { useCallback } from 'react';
import { useEditorStore } from '../stores/editorStore';
import { autoRepairAssetUrls } from '../utils/assetUrlManager';
import type { Asset } from '../types';

export const useAssetRepair = () => {
  const { currentProject, updateProject } = useEditorStore();

  /**
   * 指定したアセットの参照修復を実行
   */
  const repairAssetReference = useCallback(async (asset: Asset): Promise<Asset> => {
    if (!currentProject) {
      console.warn('🚫 プロジェクトが存在しないため、アセット修復をスキップ');
      return asset;
    }

    console.log(`🔧 アセット参照修復開始: ${asset.name}`);

    try {
      // 単一アセットの修復
      const repairedAssets = await autoRepairAssetUrls(
        currentProject.id,
        [asset],
        'validation-based'
      );

      const repairedAsset = repairedAssets[0];

      // URLが変更された場合のみプロジェクトを更新
      if (repairedAsset.url !== asset.url) {
        console.log(`📝 ${asset.name}: プロジェクト内参照を更新中...`);

        // アセットリスト内の参照を更新
        const updatedAssets = currentProject.assets.map(a =>
          a.id === asset.id ? repairedAsset : a
        );

        // パラグラフ内の参照も更新
        const updatedParagraphs = currentProject.paragraphs.map(p => ({
          ...p,
          content: {
            ...p.content,
            background: p.content.background?.id === asset.id ? repairedAsset : p.content.background,
            titleImage: p.content.titleImage?.id === asset.id ? repairedAsset : p.content.titleImage,
            bgm: p.content.bgm?.id === asset.id ? repairedAsset : p.content.bgm,
          }
        }));

        updateProject({
          assets: updatedAssets,
          paragraphs: updatedParagraphs
        });

        console.log(`✅ ${asset.name}: 参照修復完了`);
        console.log(`旧URL: ${asset.url.substring(0, 30)}...`);
        console.log(`新URL: ${repairedAsset.url.substring(0, 30)}...`);
      } else {
        console.log(`✅ ${asset.name}: 参照は既に有効です`);
      }

      return repairedAsset;
    } catch (error) {
      console.error(`❌ ${asset.name}: 参照修復失敗`, error);
      return asset;
    }
  }, [currentProject, updateProject]);

  /**
   * パラグラフ内の全アセット参照を一括修復
   */
  const repairParagraphAssets = useCallback(async (paragraphId: string): Promise<void> => {
    if (!currentProject) {
      console.warn('🚫 プロジェクトが存在しないため、パラグラフアセット修復をスキップ');
      return;
    }

    const paragraph = currentProject.paragraphs.find(p => p.id === paragraphId);
    if (!paragraph) {
      console.warn(`🚫 パラグラフ ${paragraphId} が見つかりません`);
      return;
    }

    console.log(`🔧 パラグラフアセット一括修復開始: ${paragraph.title}`);

    const assetsToRepair: Asset[] = [];

    // 修復対象のアセットを収集
    if (paragraph.content.background) assetsToRepair.push(paragraph.content.background);
    if (paragraph.content.titleImage) assetsToRepair.push(paragraph.content.titleImage);
    if (paragraph.content.bgm) assetsToRepair.push(paragraph.content.bgm);

    if (assetsToRepair.length === 0) {
      console.log(`✅ ${paragraph.title}: 修復対象のアセットなし`);
      return;
    }

    console.log(`📋 ${paragraph.title}: ${assetsToRepair.length}個のアセットを修復中...`);

    try {
      // 並列で修復実行
      const repairedAssets = await Promise.all(
        assetsToRepair.map(asset => repairAssetReference(asset))
      );

      console.log(`✅ ${paragraph.title}: 全アセット修復完了`);
      console.log('修復されたアセット:', repairedAssets.map(a => a.name));
    } catch (error) {
      console.error(`❌ ${paragraph.title}: アセット修復失敗`, error);
    }
  }, [currentProject, repairAssetReference]);

  /**
   * プロジェクト全体のアセット参照を修復
   */
  const repairAllProjectAssets = useCallback(async (): Promise<void> => {
    if (!currentProject) {
      console.warn('🚫 プロジェクトが存在しないため、全体修復をスキップ');
      return;
    }

    console.log(`🔧 プロジェクト全体アセット修復開始: ${currentProject.title}`);

    try {
      const repairedAssets = await autoRepairAssetUrls(
        currentProject.id,
        currentProject.assets,
        'proactive' // プロアクティブ戦略で確実に修復
      );

      // プロジェクト全体を更新
      const updatedParagraphs = currentProject.paragraphs.map(p => {
        const updatedContent = { ...p.content };

        // 各アセット参照を更新
        if (p.content.background) {
          const repairedBg = repairedAssets.find(a => a.id === p.content.background!.id);
          if (repairedBg) updatedContent.background = repairedBg;
        }

        if (p.content.titleImage) {
          const repairedTitle = repairedAssets.find(a => a.id === p.content.titleImage!.id);
          if (repairedTitle) updatedContent.titleImage = repairedTitle;
        }

        if (p.content.bgm) {
          const repairedBgm = repairedAssets.find(a => a.id === p.content.bgm!.id);
          if (repairedBgm) updatedContent.bgm = repairedBgm;
        }

        return { ...p, content: updatedContent };
      });

      updateProject({
        assets: repairedAssets,
        paragraphs: updatedParagraphs
      });

      console.log(`✅ ${currentProject.title}: プロジェクト全体修復完了`);
    } catch (error) {
      console.error(`❌ ${currentProject.title}: プロジェクト全体修復失敗`, error);
    }
  }, [currentProject, updateProject]);

  return {
    repairAssetReference,
    repairParagraphAssets,
    repairAllProjectAssets
  };
};