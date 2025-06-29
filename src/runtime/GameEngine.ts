import { NovelProject, Paragraph, Asset } from '../types';

/**
 * 軽量ノベルゲームエンジン
 * 配布用ゲームで使用するランタイムエンジン
 */
export class GameEngine {
  private project: NovelProject;
  private currentParagraph: Paragraph | null = null;
  private history: string[] = [];
  private gameData: any = {};
  private audioElement: HTMLAudioElement | null = null;

  constructor(project: NovelProject) {
    this.project = project;
    this.init();
  }

  private init() {
    // 開始パラグラフを検索
    const startParagraph = this.project.paragraphs.find(p => p.type === 'start');
    if (startParagraph) {
      this.currentParagraph = startParagraph;
    }
  }

  /**
   * ゲームを開始
   */
  start(): GameState {
    if (!this.currentParagraph) {
      throw new Error('開始パラグラフが見つかりません');
    }
    
    this.history = [];
    return this.getCurrentState();
  }

  /**
   * 選択肢を選択してゲームを進行
   */
  selectChoice(choiceIndex: number): GameState {
    if (!this.currentParagraph) {
      throw new Error('現在のパラグラフが無効です');
    }

    const choice = this.currentParagraph.content.choices[choiceIndex];
    if (!choice) {
      throw new Error('無効な選択肢です');
    }

    // 履歴に追加
    this.history.push(this.currentParagraph.id);

    // 次のパラグラフに移動
    const nextParagraph = this.project.paragraphs.find(p => p.id === choice.targetParagraphId);
    if (!nextParagraph) {
      throw new Error('次のパラグラフが見つかりません');
    }

    this.currentParagraph = nextParagraph;
    return this.getCurrentState();
  }

  /**
   * 前のパラグラフに戻る
   */
  goBack(): GameState | null {
    if (this.history.length === 0) {
      return null;
    }

    const previousId = this.history.pop()!;
    const previousParagraph = this.project.paragraphs.find(p => p.id === previousId);
    
    if (previousParagraph) {
      this.currentParagraph = previousParagraph;
      return this.getCurrentState();
    }

    return null;
  }

  /**
   * ゲームをリセット
   */
  reset(): GameState {
    this.init();
    this.history = [];
    this.stopAudio();
    return this.getCurrentState();
  }

  /**
   * 現在のゲーム状態を取得
   */
  getCurrentState(): GameState {
    if (!this.currentParagraph) {
      throw new Error('現在のパラグラフが無効です');
    }

    return {
      currentParagraph: this.currentParagraph,
      isGameEnd: this.isGameEnd(),
      canGoBack: this.history.length > 0,
      history: [...this.history],
      backgroundImage: this.getBackgroundImageUrl(),
      bgm: this.getBgmUrl()
    };
  }

  /**
   * ゲーム終了判定
   */
  private isGameEnd(): boolean {
    if (!this.currentParagraph) return true;
    
    return this.currentParagraph.type === 'end' || 
           this.currentParagraph.content.choices.length === 0;
  }

  /**
   * 背景画像URLを取得
   */
  private getBackgroundImageUrl(): string | null {
    if (!this.currentParagraph?.content.background) {
      return null;
    }
    
    return this.currentParagraph.content.background.url;
  }

  /**
   * BGM URLを取得
   */
  private getBgmUrl(): string | null {
    if (!this.currentParagraph?.content.bgm) {
      return null;
    }
    
    return this.currentParagraph.content.bgm.url;
  }

  /**
   * BGMを再生
   */
  playBgm(url: string): void {
    this.stopAudio();
    
    this.audioElement = new Audio(url);
    this.audioElement.loop = true;
    this.audioElement.volume = 0.7;
    
    // ブラウザのautoplay制限を考慮
    this.audioElement.play().catch(error => {
      console.warn('BGM再生に失敗:', error);
    });
  }

  /**
   * BGMを停止
   */
  stopAudio(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
    }
  }

  /**
   * セーブデータを作成
   */
  createSaveData(): SaveData {
    return {
      currentParagraphId: this.currentParagraph?.id || '',
      history: [...this.history],
      gameData: { ...this.gameData },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * セーブデータから復元
   */
  loadSaveData(saveData: SaveData): GameState {
    const paragraph = this.project.paragraphs.find(p => p.id === saveData.currentParagraphId);
    if (!paragraph) {
      throw new Error('セーブデータが無効です');
    }

    this.currentParagraph = paragraph;
    this.history = [...saveData.history];
    this.gameData = { ...saveData.gameData };

    return this.getCurrentState();
  }
}

/**
 * ゲーム状態
 */
export interface GameState {
  currentParagraph: Paragraph;
  isGameEnd: boolean;
  canGoBack: boolean;
  history: string[];
  backgroundImage: string | null;
  bgm: string | null;
}

/**
 * セーブデータ
 */
export interface SaveData {
  currentParagraphId: string;
  history: string[];
  gameData: any;
  timestamp: string;
}