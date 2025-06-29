import { NovelProject } from '../types';
import { AssetStorageManager } from '../utils/assetStorageManager';
import JSZip from 'jszip';

/**
 * ゲームビルダー
 * エディタプロジェクトを配布可能なHTML5ゲームに変換
 */
export class GameBuilder {
  private project: NovelProject;
  private assetStorage = AssetStorageManager.getInstance();

  constructor(project: NovelProject) {
    this.project = project;
  }

  /**
   * ゲームをビルドしてZIPファイルを生成
   */
  async buildGame(): Promise<Blob> {
    try {
      console.log('=== ゲームビルド開始 ===');
      console.log('プロジェクト:', this.project.title);
      console.log('アセット総数:', this.project.assets.length);
      
      // アセットを最適化・収集
      console.log('アセット収集開始...');
      const assets = await this.collectAssets();
      console.log('アセット収集完了。収集されたアセット数:', assets.size);
      
      // 収集されたアセットの詳細をログ出力
      assets.forEach((blob, fileName) => {
        console.log(`収集済みアセット: ${fileName} (${blob.size} bytes, ${blob.type})`);
      });
      
      // 全てを埋め込んだHTMLファイルを生成
      console.log('HTML生成開始...');
      const html = this.generateHTML();
      console.log('HTML生成完了。サイズ:', html.length, 'characters');
      
      // ZIPファイルを作成（スタンドアロンHTML + アセット）
      console.log('ZIP作成開始...');
      const zip = await this.createZip({
        html,
        assets
      });
      console.log('ZIP作成完了。サイズ:', zip.size, 'bytes');
      console.log('=== ゲームビルド完了 ===');

      return zip;
    } catch (error) {
      console.error('ビルドエラー:', error);
      throw new Error('ゲームのビルドに失敗しました');
    }
  }

  /**
   * アセットを収集・最適化
   */
  private async collectAssets(): Promise<Map<string, Blob>> {
    const assets = new Map<string, Blob>();
    
    console.log('アセット収集詳細開始...');
    
    for (const asset of this.project.assets) {
      try {
        console.log(`アセット処理中: ${asset.name} (ID: ${asset.id})`);
        console.log(`アセットURL: ${asset.url ? asset.url.substring(0, 100) + '...' : 'なし'}`);
        
        let blob: Blob | null = null;
        
        // 1. Base64 URLから直接Blobを作成（最も確実）
        if (asset.url && asset.url.startsWith('data:')) {
          console.log(`Base64 URLからBlob変換を試行: ${asset.name}`);
          blob = this.dataURLtoBlob(asset.url);
          if (blob) {
            console.log(`Base64変換成功: ${asset.name} (${blob.size} bytes)`);
          }
        }
        
        // 2. それでも失敗したらIndexedDBから試行
        if (!blob) {
          console.log(`IndexedDBからBlob取得を試行: ${asset.name}`);
          try {
            blob = await this.assetStorage.getAssetBlob(asset.id);
            if (blob) {
              console.log(`IndexedDB取得成功: ${asset.name} (${blob.size} bytes)`);
            }
          } catch (error) {
            console.warn(`IndexedDB取得失敗: ${asset.name}`, error);
          }
        }
        
        if (blob) {
          // アセットファイル名を生成
          const fileName = this.generateAssetFileName(asset);
          assets.set(fileName, blob);
          console.log(`✅ アセット追加成功: ${fileName} (${blob.size} bytes, ${blob.type})`);
        } else {
          console.error(`❌ アセット ${asset.id} (${asset.name}) のBlob取得に完全に失敗`);
          console.log(`アセット詳細:`, {
            id: asset.id,
            name: asset.name,
            type: asset.type,
            category: asset.category,
            hasUrl: !!asset.url,
            urlType: asset.url ? (asset.url.startsWith('data:') ? 'Base64' : 'Other') : 'None',
            metadata: asset.metadata
          });
        }
      } catch (error) {
        console.error(`アセット ${asset.id} の処理中にエラー:`, error);
      }
    }
    
    console.log(`🎯 合計 ${assets.size} 個のアセットを収集しました`);
    
    // 収集されたアセットの詳細一覧
    console.log('📋 収集済みアセット一覧:');
    assets.forEach((blob, fileName) => {
      console.log(`  - ${fileName}: ${blob.size} bytes (${blob.type})`);
    });
    
    return assets;
  }

  /**
   * Data URLをBlobに変換
   */
  private dataURLtoBlob(dataURL: string): Blob | null {
    try {
      const arr = dataURL.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      
      return new Blob([u8arr], { type: mime });
    } catch (error) {
      console.error('Data URL to Blob conversion failed:', error);
      return null;
    }
  }

  /**
   * アセットファイル名を生成
   */
  private generateAssetFileName(asset: any): string {
    // 拡張子を決定（複数の方法で試行）
    let extension = '';
    
    if (asset.metadata?.format) {
      extension = asset.metadata.format.toLowerCase();
    } else if (asset.name) {
      // ファイル名から拡張子を抽出
      const nameParts = asset.name.split('.');
      if (nameParts.length > 1) {
        extension = nameParts[nameParts.length - 1].toLowerCase();
      }
    } else if (asset.url && asset.url.startsWith('data:')) {
      // Data URLからMIMEタイプを抽出して拡張子を推定
      const mimeMatch = asset.url.match(/data:([^;]+)/);
      if (mimeMatch) {
        const mimeType = mimeMatch[1];
        switch (mimeType) {
          case 'image/jpeg':
            extension = 'jpg';
            break;
          case 'image/png':
            extension = 'png';
            break;
          case 'image/gif':
            extension = 'gif';
            break;
          case 'image/webp':
            extension = 'webp';
            break;
          case 'audio/mpeg':
            extension = 'mp3';
            break;
          case 'audio/wav':
            extension = 'wav';
            break;
          case 'audio/ogg':
            extension = 'ogg';
            break;
          default:
            extension = 'bin';
        }
      }
    }
    
    // デフォルト拡張子
    if (!extension) {
      extension = asset.type === 'image' ? 'png' : 'mp3';
    }
    
    // カテゴリフォルダ内にファイルを配置
    return `assets/${asset.category}/${asset.id}.${extension}`;
  }

  /**
   * HTMLテンプレートを生成
   */
  private generateHTML(): string {
    // ストーリーデータをHTMLに埋め込んでCORS問題を回避
    const storyDataJson = this.generateStoryData();
    
    return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.project.title}</title>
    <meta name="description" content="${this.project.description}">
    <style>
        ${this.generateCSS()}
    </style>
</head>
<body>
    <div id="game-container">
        <div id="loading-screen">
            <div class="loading-spinner"></div>
            <p>Loading...</p>
        </div>
        
        <div id="title-screen" style="display: none;">
            <div class="title-content">
                <h1 class="game-title">${this.project.title}</h1>
                <p class="game-description">${this.project.description}</p>
                <button id="start-button" class="start-btn">ゲーム開始</button>
                <button id="load-button" class="load-btn" style="display: none;">続きから</button>
            </div>
        </div>
        
        <div id="game-screen" style="display: none;">
            <div id="background-container"></div>
            
            <div class="game-ui">
                <div id="text-area">
                    <div id="paragraph-title"></div>
                    <div id="paragraph-text"></div>
                </div>
                
                <div id="choices-area"></div>
                
                <div class="game-controls">
                    <button id="back-button" class="control-btn">戻る</button>
                    <button id="menu-button" class="control-btn">メニュー</button>
                </div>
            </div>
        </div>
        
        <div id="end-screen" style="display: none;">
            <div class="end-content">
                <h2>ゲーム終了</h2>
                <p>ありがとうございました！</p>
                <button id="restart-button" class="restart-btn">最初から</button>
                <button id="title-button" class="title-btn">タイトルに戻る</button>
            </div>
        </div>
        
        <div id="menu-overlay" style="display: none;">
            <div class="menu-content">
                <h3>メニュー</h3>
                <button id="save-button" class="menu-btn">セーブ</button>
                <button id="load-menu-button" class="menu-btn">ロード</button>
                <button id="settings-button" class="menu-btn">設定</button>
                <button id="title-menu-button" class="menu-btn">タイトルに戻る</button>
                <button id="close-menu-button" class="menu-btn">閉じる</button>
            </div>
        </div>
    </div>
    
    <!-- ストーリーデータ埋め込み -->
    <script type="application/json" id="story-data">
        ${storyDataJson}
    </script>
    
    <script>
        ${this.generateInlineRuntime()}
    </script>
</body>
</html>`;
  }

  /**
   * インラインJavaScriptランタイムを生成（CORS回避版）
   */
  private generateInlineRuntime(): string {
    return `${this.getGameEngineSource()}

// ゲーム初期化
function Game() {
    this.engine = null;
    this.currentState = null;
    this.init();
}

Game.prototype.init = function() {
    try {
        // HTMLに埋め込まれたストーリーデータを読み込み
        var storyElement = document.getElementById('story-data');
        if (!storyElement) {
            throw new Error('ストーリーデータが見つかりません');
        }
        
        var projectData = JSON.parse(storyElement.textContent);
        
        // ゲームエンジンを初期化
        this.engine = new GameEngine(projectData);
        
        // UIを初期化
        this.initUI();
        
        // ローディング画面を非表示
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('title-screen').style.display = 'block';
        
    } catch (error) {
        console.error('ゲーム初期化エラー:', error);
        alert('ゲームの読み込みに失敗しました');
    }
};

Game.prototype.initUI = function() {
    var self = this;
    
    // ゲーム開始ボタン
    document.getElementById('start-button').addEventListener('click', function() {
        self.startGame();
    });

    // 戻るボタン
    document.getElementById('back-button').addEventListener('click', function() {
        self.goBack();
    });

    // メニューボタン
    document.getElementById('menu-button').addEventListener('click', function() {
        self.showMenu();
    });

    // リスタートボタン
    document.getElementById('restart-button').addEventListener('click', function() {
        self.restartGame();
    });

    // タイトルに戻るボタン
    document.getElementById('title-button').addEventListener('click', function() {
        self.showTitle();
    });

    // メニュー関連
    document.getElementById('close-menu-button').addEventListener('click', function() {
        self.hideMenu();
    });

    document.getElementById('title-menu-button').addEventListener('click', function() {
        self.hideMenu();
        self.showTitle();
    });

    // セーブ・ロード機能
    this.initSaveLoad();
};

Game.prototype.initSaveLoad = function() {
    var self = this;
    
    document.getElementById('save-button').addEventListener('click', function() {
        self.saveGame();
    });

    document.getElementById('load-button').addEventListener('click', function() {
        self.loadGame();
    });

    document.getElementById('load-menu-button').addEventListener('click', function() {
        self.loadGame();
    });

    // セーブデータが存在する場合は「続きから」ボタンを表示
    var saveKey = 'novelsave_' + this.engine.project.title.replace(/[^a-zA-Z0-9\u3042-\u3096\u30A0-\u30FC\u4E00-\u9FAF]/g, '_');
    if (localStorage.getItem(saveKey) || localStorage.getItem('novelsave')) {
        document.getElementById('load-button').style.display = 'block';
    }
};

Game.prototype.startGame = function() {
    this.currentState = this.engine.start();
    this.showGameScreen();
    this.updateGameUI();
};

Game.prototype.goBack = function() {
    var newState = this.engine.goBack();
    if (newState) {
        this.currentState = newState;
        this.updateGameUI();
    }
};

Game.prototype.restartGame = function() {
    this.currentState = this.engine.reset();
    this.showGameScreen();
    this.updateGameUI();
};

Game.prototype.showTitle = function() {
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('end-screen').style.display = 'none';
    document.getElementById('title-screen').style.display = 'block';
    this.engine.stopAudio();
};

Game.prototype.showGameScreen = function() {
    document.getElementById('title-screen').style.display = 'none';
    document.getElementById('end-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
};

Game.prototype.showEndScreen = function() {
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('end-screen').style.display = 'block';
};

Game.prototype.showEndMessage = function() {
    // エンド状態のメッセージを選択肢エリアに表示
    var container = document.getElementById('choices-area');
    container.innerHTML = '';
    var self = this;
    
    // エンドメッセージを表示
    var endMessage = document.createElement('div');
    endMessage.className = 'end-message';
    endMessage.style.cssText = 'text-align: center; padding: 20px; margin: 10px 0; background: rgba(0, 0, 0, 0.3); border: 2px solid rgba(255, 255, 255, 0.6); border-radius: 8px; cursor: pointer; transition: all 0.3s ease; text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.9), 1px 1px 2px rgba(0, 0, 0, 1);';
    endMessage.innerHTML = '<div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 10px; color: #fff;">--- END ---</div><div style="color: #ccc; font-size: 0.9rem;">画面をクリックして続行</div>';
    
    // クリックイベントを追加
    endMessage.addEventListener('click', function() {
        self.showEndScreen();
    });
    
    // ホバー効果を追加
    endMessage.addEventListener('mouseenter', function() {
        this.style.background = 'rgba(255, 255, 255, 0.2)';
        this.style.borderColor = 'rgba(255, 255, 255, 0.8)';
    });
    
    endMessage.addEventListener('mouseleave', function() {
        this.style.background = 'rgba(0, 0, 0, 0.3)';
        this.style.borderColor = 'rgba(255, 255, 255, 0.6)';
    });
    
    container.appendChild(endMessage);
};

Game.prototype.showMenu = function() {
    document.getElementById('menu-overlay').style.display = 'flex';
};

Game.prototype.hideMenu = function() {
    document.getElementById('menu-overlay').style.display = 'none';
};

Game.prototype.selectChoice = function(index) {
    this.currentState = this.engine.selectChoice(index);
    this.updateGameUI();
};

Game.prototype.updateGameUI = function() {
    var currentParagraph = this.currentState.currentParagraph;
    var isGameEnd = this.currentState.isGameEnd;
    var canGoBack = this.currentState.canGoBack;
    var backgroundImage = this.currentState.backgroundImage;
    var bgm = this.currentState.bgm;

    // タイトルとテキストを更新
    document.getElementById('paragraph-title').textContent = currentParagraph.title;
    document.getElementById('paragraph-text').textContent = currentParagraph.content.text;

    // 背景画像を更新
    this.updateBackground(backgroundImage);

    // BGMを更新
    this.updateBgm(bgm);

    // 戻るボタンの状態を更新
    document.getElementById('back-button').disabled = !canGoBack;

    // 選択肢を更新
    this.updateChoices(currentParagraph.content.choices);

    // ゲーム終了判定
    var self = this;
    if (isGameEnd) {
        // 即座にエンド状態に移行（自動遷移は行わない）
        self.showEndMessage();
    }
};

Game.prototype.updateBackground = function(imageUrl) {
    var container = document.getElementById('background-container');
    if (imageUrl) {
        container.style.backgroundImage = 'url(' + imageUrl + ')';
    } else {
        container.style.backgroundImage = '';
    }
};

Game.prototype.updateBgm = function(bgmUrl) {
    if (bgmUrl) {
        this.engine.playBgm(bgmUrl);
    } else {
        this.engine.stopAudio();
    }
};

Game.prototype.updateChoices = function(choices) {
    var container = document.getElementById('choices-area');
    container.innerHTML = '';
    var self = this;

    for (var i = 0; i < choices.length; i++) {
        var choice = choices[i];
        var button = document.createElement('button');
        button.className = 'choice-btn';
        button.textContent = (i + 1) + '. ' + choice.text;
        button.addEventListener('click', (function(index) {
            return function() { self.selectChoice(index); };
        })(i));
        container.appendChild(button);
    }
};

Game.prototype.saveGame = function() {
    var saveData = this.engine.createSaveData();
    // プロジェクトタイトルベースのセーブキーを生成
    var saveKey = 'novelsave_' + this.engine.project.title.replace(/[^a-zA-Z0-9\u3042-\u3096\u30A0-\u30FC\u4E00-\u9FAF]/g, '_');
    // セーブデータにプロジェクト情報を追加
    var extendedSaveData = {
        ...saveData,
        projectTitle: this.engine.project.title,
        projectId: this.engine.project.id
    };
    localStorage.setItem(saveKey, JSON.stringify(extendedSaveData));
    alert('「' + this.engine.project.title + '」のセーブが完了しました');
    this.hideMenu();
};

Game.prototype.loadGame = function() {
    try {
        // プロジェクトタイトルベースのセーブキーを生成
        var saveKey = 'novelsave_' + this.engine.project.title.replace(/[^a-zA-Z0-9\u3042-\u3096\u30A0-\u30FC\u4E00-\u9FAF]/g, '_');
        var saveDataStr = localStorage.getItem(saveKey);
        
        // 新形式のセーブデータが見つからない場合、旧形式も確認
        if (!saveDataStr) {
            saveDataStr = localStorage.getItem('novelsave');
            if (saveDataStr) {
                // 旧形式から新形式に移行
                var oldSaveData = JSON.parse(saveDataStr);
                var newSaveData = {
                    ...oldSaveData,
                    projectTitle: this.engine.project.title,
                    projectId: this.engine.project.id
                };
                localStorage.setItem(saveKey, JSON.stringify(newSaveData));
                localStorage.removeItem('novelsave'); // 旧データを削除
                saveDataStr = JSON.stringify(newSaveData);
            }
        }
        
        if (!saveDataStr) {
            alert('「' + this.engine.project.title + '」のセーブデータが見つかりません');
            return;
        }

        var saveData = JSON.parse(saveDataStr);
        this.currentState = this.engine.loadSaveData(saveData);
        this.showGameScreen();
        this.updateGameUI();
        this.hideMenu();
        alert('「' + this.engine.project.title + '」のセーブデータを読み込みました');
    } catch (error) {
        console.error('ロードエラー:', error);
        alert('セーブデータの読み込みに失敗しました');
    }
};

// ゲーム開始
window.addEventListener('DOMContentLoaded', function() {
    new Game();
});`;
  }

  /**
   * JavaScriptランタイムを生成
   */
  private async generateRuntime(): Promise<string> {
    // GameEngineクラスのソースコードを文字列として取得
    const gameEngineSource = await this.getGameEngineSource();
    
    return `${gameEngineSource}

// ゲーム初期化
class Game {
    constructor() {
        this.engine = null;
        this.currentState = null;
        this.init();
    }

    async init() {
        try {
            // ストーリーデータを読み込み
            const response = await fetch('story.json');
            const projectData = await response.json();
            
            // ゲームエンジンを初期化
            this.engine = new GameEngine(projectData);
            
            // UIを初期化
            this.initUI();
            
            // ローディング画面を非表示
            document.getElementById('loading-screen').style.display = 'none';
            document.getElementById('title-screen').style.display = 'block';
            
        } catch (error) {
            console.error('ゲーム初期化エラー:', error);
            alert('ゲームの読み込みに失敗しました');
        }
    }

    initUI() {
        // ゲーム開始ボタン
        document.getElementById('start-button').addEventListener('click', () => {
            this.startGame();
        });

        // 戻るボタン
        document.getElementById('back-button').addEventListener('click', () => {
            this.goBack();
        });

        // メニューボタン
        document.getElementById('menu-button').addEventListener('click', () => {
            this.showMenu();
        });

        // リスタートボタン
        document.getElementById('restart-button').addEventListener('click', () => {
            this.restartGame();
        });

        // タイトルに戻るボタン
        document.getElementById('title-button').addEventListener('click', () => {
            this.showTitle();
        });

        // メニュー関連
        document.getElementById('close-menu-button').addEventListener('click', () => {
            this.hideMenu();
        });

        document.getElementById('title-menu-button').addEventListener('click', () => {
            this.hideMenu();
            this.showTitle();
        });

        // セーブ・ロード機能
        this.initSaveLoad();
    }

    initSaveLoad() {
        document.getElementById('save-button').addEventListener('click', () => {
            this.saveGame();
        });

        document.getElementById('load-button').addEventListener('click', () => {
            this.loadGame();
        });

        document.getElementById('load-menu-button').addEventListener('click', () => {
            this.loadGame();
        });

        // セーブデータが存在する場合は「続きから」ボタンを表示
        if (localStorage.getItem('novelsave')) {
            document.getElementById('load-button').style.display = 'block';
        }
    }

    startGame() {
        this.currentState = this.engine.start();
        this.showGameScreen();
        this.updateGameUI();
    }

    goBack() {
        const newState = this.engine.goBack();
        if (newState) {
            this.currentState = newState;
            this.updateGameUI();
        }
    }

    restartGame() {
        this.currentState = this.engine.reset();
        this.showGameScreen();
        this.updateGameUI();
    }

    showTitle() {
        document.getElementById('game-screen').style.display = 'none';
        document.getElementById('end-screen').style.display = 'none';
        document.getElementById('title-screen').style.display = 'block';
        this.engine.stopAudio();
    }

    showGameScreen() {
        document.getElementById('title-screen').style.display = 'none';
        document.getElementById('end-screen').style.display = 'none';
        document.getElementById('game-screen').style.display = 'block';
    }

    showEndScreen() {
        document.getElementById('game-screen').style.display = 'none';
        document.getElementById('end-screen').style.display = 'block';
    }

    showMenu() {
        document.getElementById('menu-overlay').style.display = 'flex';
    }

    hideMenu() {
        document.getElementById('menu-overlay').style.display = 'none';
    }

    selectChoice(index) {
        this.currentState = this.engine.selectChoice(index);
        this.updateGameUI();
    }

    updateGameUI() {
        const { currentParagraph, isGameEnd, canGoBack, backgroundImage, bgm } = this.currentState;

        // タイトルとテキストを更新
        document.getElementById('paragraph-title').textContent = currentParagraph.title;
        document.getElementById('paragraph-text').textContent = currentParagraph.content.text;

        // 背景画像を更新
        this.updateBackground(backgroundImage);

        // BGMを更新
        this.updateBgm(bgm);

        // 戻るボタンの状態を更新
        document.getElementById('back-button').disabled = !canGoBack;

        // 選択肢を更新
        this.updateChoices(currentParagraph.content.choices);

        // ゲーム終了判定
        if (isGameEnd) {
            setTimeout(() => this.showEndScreen(), 1000);
        }
    }

    updateBackground(imageUrl) {
        const container = document.getElementById('background-container');
        if (imageUrl) {
            container.style.backgroundImage = \`url(\${imageUrl})\`;
        } else {
            container.style.backgroundImage = '';
        }
    }

    updateBgm(bgmUrl) {
        if (bgmUrl) {
            this.engine.playBgm(bgmUrl);
        } else {
            this.engine.stopAudio();
        }
    }

    updateChoices(choices) {
        const container = document.getElementById('choices-area');
        container.innerHTML = '';

        choices.forEach((choice, index) => {
            const button = document.createElement('button');
            button.className = 'choice-btn';
            button.textContent = \`\${index + 1}. \${choice.text}\`;
            button.addEventListener('click', () => this.selectChoice(index));
            container.appendChild(button);
        });
    }

    saveGame() {
        const saveData = this.engine.createSaveData();
        localStorage.setItem('novelsave', JSON.stringify(saveData));
        alert('ゲームをセーブしました');
        this.hideMenu();
    }

    loadGame() {
        try {
            const saveDataStr = localStorage.getItem('novelsave');
            if (!saveDataStr) {
                alert('セーブデータが見つかりません');
                return;
            }

            const saveData = JSON.parse(saveDataStr);
            this.currentState = this.engine.loadSaveData(saveData);
            this.showGameScreen();
            this.updateGameUI();
            this.hideMenu();
        } catch (error) {
            console.error('ロードエラー:', error);
            alert('セーブデータの読み込みに失敗しました');
        }
    }
}

// ゲーム開始
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});`;
  }

  /**
   * GameEngineのソースコードを取得
   */
  private getGameEngineSource(): string {
    return `// GameEngineクラスの実装
class GameEngine {
    constructor(project) {
        this.project = project;
        this.currentParagraph = null;
        this.history = [];
        this.gameData = {};
        this.audioElement = null;
        this.init();
    }

    init() {
        var startParagraph = this.project.paragraphs.find(function(p) { return p.type === 'start'; });
        if (startParagraph) {
            this.currentParagraph = startParagraph;
        }
    }

    start() {
        if (!this.currentParagraph) {
            throw new Error('開始パラグラフが見つかりません');
        }
        this.history = [];
        return this.getCurrentState();
    }

    selectChoice(choiceIndex) {
        if (!this.currentParagraph) {
            throw new Error('現在のパラグラフが無効です');
        }

        var choice = this.currentParagraph.content.choices[choiceIndex];
        if (!choice) {
            throw new Error('無効な選択肢です');
        }

        this.history.push(this.currentParagraph.id);
        var self = this;
        var nextParagraph = this.project.paragraphs.find(function(p) { return p.id === choice.targetParagraphId; });
        if (!nextParagraph) {
            throw new Error('次のパラグラフが見つかりません');
        }

        this.currentParagraph = nextParagraph;
        return this.getCurrentState();
    }

    goBack() {
        if (this.history.length === 0) {
            return null;
        }

        var previousId = this.history.pop();
        var self = this;
        var previousParagraph = this.project.paragraphs.find(function(p) { return p.id === previousId; });
        
        if (previousParagraph) {
            this.currentParagraph = previousParagraph;
            return this.getCurrentState();
        }

        return null;
    }

    reset() {
        this.init();
        this.history = [];
        this.stopAudio();
        return this.getCurrentState();
    }

    getCurrentState() {
        if (!this.currentParagraph) {
            throw new Error('現在のパラグラフが無効です');
        }

        return {
            currentParagraph: this.currentParagraph,
            isGameEnd: this.isGameEnd(),
            canGoBack: this.history.length > 0,
            history: this.history.slice(),
            backgroundImage: this.getBackgroundImageUrl(),
            bgm: this.getBgmUrl()
        };
    }

    isGameEnd() {
        if (!this.currentParagraph) return true;
        return this.currentParagraph.type === 'end' || 
               this.currentParagraph.content.choices.length === 0;
    }

    getBackgroundImageUrl() {
        if (!this.currentParagraph || !this.currentParagraph.content.background) {
            return null;
        }
        return this.currentParagraph.content.background.url;
    }

    getBgmUrl() {
        if (!this.currentParagraph || !this.currentParagraph.content.bgm) {
            return null;
        }
        return this.currentParagraph.content.bgm.url;
    }

    playBgm(url) {
        this.stopAudio();
        this.audioElement = new Audio(url);
        this.audioElement.loop = true;
        this.audioElement.volume = 0.7;
        var self = this;
        this.audioElement.play().catch(function(error) {
            console.warn('BGM再生に失敗:', error);
        });
    }

    stopAudio() {
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement = null;
        }
    }

    createSaveData() {
        return {
            currentParagraphId: this.currentParagraph ? this.currentParagraph.id : '',
            history: this.history.slice(),
            gameData: this.copyObject(this.gameData),
            timestamp: new Date().toISOString()
        };
    }

    copyObject(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    loadSaveData(saveData) {
        var self = this;
        var paragraph = this.project.paragraphs.find(function(p) { return p.id === saveData.currentParagraphId; });
        if (!paragraph) {
            throw new Error('セーブデータが無効です');
        }

        this.currentParagraph = paragraph;
        this.history = saveData.history.slice();
        this.gameData = this.copyObject(saveData.gameData);

        return this.getCurrentState();
    }
}`;
  }

  /**
   * CSSスタイルを生成
   */
  private generateCSS(): string {
    return `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Hiragino Kaku Gothic Pro', 'ヒラギノ角ゴ Pro W3', Meiryo, 'メイリオ', Osaka, 'MS PGothic', arial, helvetica, sans-serif;
    background: #000;
    color: #fff;
    overflow: hidden;
}

#game-container {
    width: 100vw;
    height: 100vh;
    position: relative;
}

/* ローディング画面 */
#loading-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    min-height: 100vh;
    background: #000;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1000;
}

.loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #333;
    border-top: 4px solid #fff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 20px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* タイトル画面 */
#title-screen {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    min-height: 100vh;
    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
    position: fixed;
    top: 0;
    left: 0;
    z-index: 100;
}

.title-content {
    text-align: center;
    max-width: 600px;
    padding: 40px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    box-sizing: border-box;
}

.game-title {
    font-size: 3rem;
    margin-bottom: 20px;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
}

.game-description {
    font-size: 1.2rem;
    margin-bottom: 40px;
    line-height: 1.6;
    opacity: 0.9;
}

.start-btn, .load-btn {
    background: #fff;
    color: #2a5298;
    border: none;
    padding: 15px 40px;
    font-size: 1.2rem;
    font-weight: bold;
    border-radius: 25px;
    cursor: pointer;
    margin: 10px auto;
    display: block;
    min-width: 200px;
    transition: all 0.3s ease;
}

.start-btn:hover, .load-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(255,255,255,0.3);
}

/* ゲーム画面 */
#game-screen {
    width: 100%;
    height: 100%;
    position: relative;
}

#background-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-size: contain;
    background-position: center top;
    background-repeat: no-repeat;
    background-color: #1a1a1a;
    z-index: 1;
}

.game-ui {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    padding: 15px;
    z-index: 10;
    max-height: 40vh;
    overflow-y: auto;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

#text-area {
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 15px;
    min-height: 100px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

#paragraph-title {
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 15px;
    color: #fff;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.9), 1px 1px 2px rgba(0, 0, 0, 1);
}

#paragraph-text {
    font-size: 1.1rem;
    line-height: 1.8;
    color: #f0f0f0;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.9), 1px 1px 2px rgba(0, 0, 0, 1);
}

#choices-area {
    margin-bottom: 15px;
}

.choice-btn {
    display: block;
    width: 100%;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
    border: 2px solid rgba(255, 255, 255, 0.6);
    color: #fff;
    padding: 12px 16px;
    margin: 6px 0;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
    text-align: left;
    transition: all 0.3s ease;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.9), 1px 1px 2px rgba(0, 0, 0, 1);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.choice-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    border-color: rgba(255, 255, 255, 0.8);
    transform: translateX(10px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.9), 1px 1px 2px rgba(0, 0, 0, 1);
}

.game-controls {
    display: flex;
    gap: 10px;
}

.control-btn {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.4);
    color: #fff;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.3s ease;
}

.control-btn:hover {
    background: rgba(255, 255, 255, 0.3);
}

.control-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* 終了画面 */
#end-screen {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    position: fixed;
    top: 0;
    left: 0;
    z-index: 100;
}

.end-content {
    text-align: center;
    max-width: 500px;
    padding: 40px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    box-sizing: border-box;
}

.end-content h2 {
    font-size: 2.5rem;
    margin-bottom: 20px;
}

.restart-btn, .title-btn {
    background: #fff;
    color: #764ba2;
    border: none;
    padding: 12px 30px;
    font-size: 1rem;
    font-weight: bold;
    border-radius: 20px;
    cursor: pointer;
    margin: 10px auto;
    display: inline-block;
    min-width: 150px;
    transition: all 0.3s ease;
}

.restart-btn:hover, .title-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(255,255,255,0.3);
}

/* メニューオーバーレイ */
#menu-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.menu-content {
    background: #333;
    padding: 40px;
    border-radius: 10px;
    text-align: center;
    min-width: 300px;
}

.menu-content h3 {
    font-size: 1.5rem;
    margin-bottom: 30px;
}

.menu-btn {
    display: block;
    width: 100%;
    background: #555;
    border: none;
    color: #fff;
    padding: 12px 20px;
    margin: 10px 0;
    border-radius: 5px;
    cursor: pointer;
    font-size: 1rem;
    transition: background 0.3s ease;
}

.menu-btn:hover {
    background: #777;
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
    .title-content {
        padding: 30px;
        max-width: 80%;
    }
    
    .game-title {
        font-size: 2rem;
    }
    
    .game-description {
        font-size: 1rem;
    }
    
    .start-btn, .load-btn {
        padding: 14px 35px;
        font-size: 1.1rem;
        min-width: 180px;
    }
    
    .end-content {
        padding: 30px;
        max-width: 80%;
    }
    
    .restart-btn, .title-btn {
        padding: 12px 25px;
        font-size: 0.95rem;
        min-width: 140px;
    }
    
    #background-container {
        background-position: center top;
        background-size: contain;
    }
    
    .game-ui {
        padding: 12px;
        max-height: 45vh;
    }
    
    #text-area {
        padding: 16px;
        min-height: 80px;
    }
    
    #paragraph-title {
        font-size: 1.3rem;
    }
    
    #paragraph-text {
        font-size: 1rem;
    }
    
    .choice-btn {
        padding: 12px 15px;
        font-size: 0.9rem;
    }
}

@media (max-width: 480px) {
    .title-content {
        padding: 20px;
        max-width: 90%;
        margin: auto;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }
    
    .game-title {
        font-size: 1.8rem;
        margin-bottom: 1rem;
    }
    
    .game-description {
        font-size: 0.9rem;
        margin-bottom: 2rem;
    }
    
    .start-btn, .load-btn {
        padding: 14px 32px;
        font-size: 1.1rem;
        width: 100%;
        max-width: 300px;
        margin: 0.5rem auto;
        display: block;
    }
    
    #background-container {
        background-position: center top;
        background-size: contain;
    }
    
    .game-ui {
        padding: 10px;
        max-height: 50vh;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    #text-area {
        padding: 10px;
        min-height: 60px;
        margin-bottom: 8px;
    }
    
    #choices-area {
        margin: 0;
        padding: 0;
        width: 100%;
        box-sizing: border-box;
    }
    
    .choice-btn {
        width: 100%;
        padding: 14px 16px;
        margin: 8px 0;
        font-size: 0.9rem;
        text-align: left;
        box-sizing: border-box;
        border-radius: 8px;
        word-wrap: break-word;
        white-space: normal;
        line-height: 1.4;
        min-height: 48px;
    }
    
    .choice-btn:hover {
        transform: none;
    }
    
    .end-content {
        padding: 20px;
        max-width: 90%;
        margin: auto;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }
    
    .end-content h2 {
        font-size: 2rem;
        margin-bottom: 1rem;
    }
    
    .restart-btn, .title-btn {
        padding: 12px 24px;
        font-size: 0.9rem;
        margin: 6px auto;
        display: inline-block;
        width: auto;
        min-width: 120px;
    }
}`;
  }

  /**
   * ストーリーデータJSONを生成
   */
  private generateStoryData(): string {
    // アセットURLを配布用パスに変換
    const modifiedProject = this.convertAssetUrls(this.project);
    return JSON.stringify(modifiedProject, null, 2);
  }

  /**
   * アセットURLを配布用パスに変換
   */
  private convertAssetUrls(project: NovelProject): NovelProject {
    const modifiedProject = { ...project };
    
    // アセット配列のURLを変換
    modifiedProject.assets = project.assets.map(asset => ({
      ...asset,
      url: './' + this.generateAssetFileName(asset)
    }));

    // パラグラフ内のアセット参照を更新
    modifiedProject.paragraphs = project.paragraphs.map(paragraph => ({
      ...paragraph,
      content: {
        ...paragraph.content,
        background: paragraph.content.background ? {
          ...paragraph.content.background,
          url: './' + this.generateAssetFileName(paragraph.content.background)
        } : undefined,
        bgm: paragraph.content.bgm ? {
          ...paragraph.content.bgm,
          url: './' + this.generateAssetFileName(paragraph.content.bgm)
        } : undefined
      }
    }));

    return modifiedProject;
  }

  /**
   * Web App Manifestを生成
   */
  private generateManifest(): string {
    return JSON.stringify({
      name: this.project.title,
      short_name: this.project.title.substring(0, 12),
      description: this.project.description,
      start_url: "/",
      display: "standalone",
      theme_color: "#000000",
      background_color: "#000000",
      icons: [
        {
          src: "icon-192.png",
          sizes: "192x192",
          type: "image/png"
        },
        {
          src: "icon-512.png",
          sizes: "512x512",
          type: "image/png"
        }
      ]
    }, null, 2);
  }

  /**
   * ZIPファイルを作成（JSZip使用）
   */
  private async createZip(files: {
    html: string;
    assets: Map<string, Blob>;
  }): Promise<Blob> {
    const zip = new JSZip();
    
    console.log('ZIP作成 - HTMLファイル追加中...');
    // メインHTMLファイル（全て埋め込み済み）
    zip.file('index.html', files.html);
    console.log('ZIP作成 - HTMLファイル追加完了');
    
    console.log('ZIP作成 - アセットファイル追加中...');
    console.log('追加予定アセット数:', files.assets.size);
    
    // アセットファイルを追加
    let addedCount = 0;
    files.assets.forEach((blob, fileName) => {
      console.log(`ZIP追加: ${fileName} (${blob.size} bytes)`);
      zip.file(fileName, blob);
      addedCount++;
    });
    
    console.log(`ZIP作成 - アセットファイル追加完了 (${addedCount}個)`);
    
    // ZIPの内容を確認
    console.log('ZIP内ファイル一覧:');
    zip.forEach((relativePath, file) => {
      console.log(`  - ${relativePath}`);
    });
    
    // ZIPファイルを生成
    console.log('ZIP圧縮開始...');
    const result = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6
      }
    });
    console.log('ZIP圧縮完了');
    
    return result;
  }

  /**
   * デフォルトアイコンを作成
   */
  private async createDefaultIcon(): Promise<Blob> {
    const canvas = document.createElement('canvas');
    canvas.width = 192;
    canvas.height = 192;
    const ctx = canvas.getContext('2d')!;
    
    // 簡易的なアイコンを描画
    ctx.fillStyle = '#2a5298';
    ctx.fillRect(0, 0, 192, 192);
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', 96, 96);
    
    return new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob || new Blob());
      }, 'image/png');
    });
  }
}