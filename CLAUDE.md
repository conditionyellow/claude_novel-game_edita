# ノベルゲームエディタ - プロジェクト仕様書

> Webベースのノベルゲーム作成・編集ツール

## ドキュメント構成

このプロジェクトの詳細情報は以下のドキュメントに分散して管理されています：

### 📋 [プロジェクト概要](docs/overview.md)
- プロジェクトの目的と主要機能
- 技術スタック選択理由
- アーキテクチャ概念
- エディタ機能仕様
- ビルドシステム設計

### 🏗️ [データ構造・型定義](docs/data-schema.md)
- コアデータ構造（パラグラフ・プロジェクト・アセット）
- TypeScript型定義
- 状態管理スキーマ
- バリデーション・API型定義
- React Flow・エクスポート型定義

### ✅ [実装状況・開発ステータス](docs/implementation-status.md)
- 完了済み機能（Phase 1-20）
- 技術的特徴と品質
- 次回実装予定機能
- 現在実装済み機能詳細
- アセット管理システム状況・安定性強化完了

### 🔧 [技術的課題と解決策](docs/technical-notes.md)
- 開発中に遭遇した主要課題
- Phase別技術実装詳細
- パフォーマンス最適化
- セキュリティ考慮事項
- 今後の技術的課題

### 🚀 [開発環境・ロードマップ](docs/development.md)
- 技術スタック詳細
- プロジェクト構造
- 段階的開発ロードマップ
- 今後の開発計画
- 品質管理・テスト戦略

### 📖 [ユーザーマニュアル](USER_MANUAL.md)
- エンドユーザー向け使用方法
- クイックスタートガイド
- 機能詳細説明
- トラブルシューティング

## プロジェクト概要

### 目的
映画のシーンに似た「パラグラフ」という単位を基本構造とした、Webベースのノベルゲーム作成・編集ツールの開発。エディタで作成したゲームは、PCブラウザやスマートフォンでプレイ可能なHTML5ゲームとして出力される。

### 主要機能
- **パラグラフベースエディタ**: 本文、選択肢、画像、BGMを含むシーン単位での編集
- **ビジュアルフローエディタ**: ドラッグ&ドロップによるパラグラフ間の関係性編集
- **アセット管理システム**: 画像・音声ファイルの統合管理
- **ゲームプレビュー**: エディタ内でのリアルタイムテスト
- **HTML5ビルド**: 配布可能なゲームの自動生成

### 技術スタック
- **フロントエンド**: React + TypeScript + Vite
- **状態管理**: Zustand
- **スタイリング**: Tailwind CSS
- **フローエディタ**: React Flow
- **データ管理**: JSON + IndexedDB

## 開発状況

### ✅ 完了済み（Phase 1-21）
- **Core Editor System**: パラグラフ編集・選択肢システム・状態管理
- **Visual Flow Editor**: React Flow統合・自動レイアウト
- **Asset Management**: ファイル管理・プレビュー・IndexedDB保存・**URL安定性強化完了**
- **Game Runtime**: プレビューシステム・BGM再生・ビルド機能
- **Modern UI**: デザインシステム・レスポンシブ対応
- **UX Enhancement**: ツールチップ・モバイル最適化
- **Project Management**: タイトル編集・タイトルパラグラフ
- **Content Protection**: 右クリック・ドラッグ&ドロップ防止・開発者ツール制限

### ⏳ 次回実装予定（Phase 22+）
- **キャラクター立ち絵システム**: 立ち絵表示・位置制御
- **リッチテキストエディタ**: 本文装飾機能
- **音響効果システム**: SE管理・再生制御
- **シナリオ分岐システム**: 条件分岐・変数管理
- **PWA完全対応**: オフライン動作・インストール対応

## 技術的特徴

### レスポンシブ設計
3段階ブレークポイント（デスクトップ・タブレット・スマートフォン）で全デバイス対応

### パフォーマンス最適化
- IndexedDB活用による大容量アセット管理
- Force-Directed Algorithm による高度なレイアウト自動配置
- **グローバルアセット管理による安定性・メモリ効率の大幅向上**

### アクセシビリティ
- キーボードナビゲーション完全対応
- スクリーンリーダー対応
- 48px最小タッチターゲット

### クロスプラットフォーム対応
- 主要ブラウザ完全対応（Chrome・Firefox・Safari・Edge）
- モバイルブラウザ最適化（iOS Safari・Android Chrome）

## プロジェクト構造

```
novel-game-editor/
├── src/
│   ├── components/        # UIコンポーネント
│   ├── stores/           # 状態管理（Zustand）
│   ├── types/            # TypeScript型定義
│   ├── utils/            # ユーティリティ
│   ├── hooks/            # カスタムフック
│   ├── runtime/          # ゲームランタイム
│   └── services/         # ビルドサービス
├── docs/                 # 分散ドキュメント
├── public/               # 静的アセット
└── USER_MANUAL.md       # ユーザーマニュアル
```

## 開発・品質保証

### 開発環境
- **Vite Dev Server**: HMR対応高速開発
- **TypeScript**: 完全型安全性
- **ESLint + Prettier**: コード品質管理

### 動作確認済み
- **実稼働テスト**: iOS・Android・Windows・macOS実機確認完了
- **パフォーマンス**: エディタ起動<3秒・ビルド<30秒・ゲーム起動<2秒
- **全機能テスト**: エディタ・プレビュー・ビルド・アセット管理の完全動作確認

---

## 重要な変更履歴

- **2024-06-30**: **Phase 21 コンテンツ保護システム実装完了** 🛡️
  - 右クリック・ドラッグ&ドロップ保護機能追加
  - 開発者ツールアクセス制限（F12・Ctrl+Shift+I等）
  - CSS多層保護・JavaScript保護統合実装
  - ゲーム画面・タイトル画面全体保護達成
- **2024-06-30**: **Phase 20 アセット安定性強化システム実装完了** 🎉
  - グローバルアセットURL管理システム導入
  - ObjectURL安定性問題の根本解決
  - エディタ・プレビュー間URL同期完全達成
  - メモリ効率・パフォーマンス大幅向上
- **2024-06-30**: ドキュメント構造化・docs/ディレクトリ分散管理開始
- **2024-06-29**: Phase 18-19 タイトルパラグラフシステム実装完了
- **2024-06-29**: Phase 4.5 アセット参照修復システム実装
- **2024-06-29**: Phase 6-8 モダンUI・UX改善システム実装
- **2024-06-28**: Phase 1-5 コアシステム・ビルド機能実装完了

---

*このプロジェクトは継続的に改善・拡張されています。最新の情報は各ドキュメントを参照してください。*