/**
 * 音響システム
 * ゲーム内の全ての音声ファイルの管理と再生を行う
 * 
 * @author ブロック崩しゲーム開発チーム
 * @version 1.0.0
 */

const audioSystem = {
    sounds: {},
    isLoaded: false,
    isMuted: false,
    masterVolume: 0.7,  // マスター音量 (0.0 - 1.0)
    
    // 音声ファイルの定義
    soundFiles: {
        click: 'mp3/click.mp3',        // ゲーム開始・ポーズ切り替え
        hakai: 'mp3/hakai.mp3',        // ブロック破壊音
        get: 'mp3/get.mp3',            // アイテム取得音
        reflect: 'mp3/reflect.mp3'     // ボール反射音
    },
    
    /**
     * 音声ファイルのプリロード
     * p5.jsのpreload()関数から呼び出される
     */
    preload() {
        for (let soundName in this.soundFiles) {
            try {
                this.sounds[soundName] = loadSound(this.soundFiles[soundName]); // 音声読み込み
                // 音声読み込み成功ログは省略
            } catch (error) {
                console.warn(`音声ファイルの読み込みに失敗: ${this.soundFiles[soundName]}`);
                this.sounds[soundName] = null;
            }
        }
    },
    
    /**
     * 音声再生機能
     * @param {string} soundName - 再生する音声名
     * @param {number} volume - 個別音量 (0.0 - 1.0)
     */
    playSound(soundName, volume = 0.5) {
        if (this.isMuted) return;
        
        if (this.sounds[soundName]) {
            try {
                // マスター音量と個別音量を掛け合わせて最終音量を決定
                const finalVolume = volume * this.masterVolume;
                this.sounds[soundName].setVolume(finalVolume);
                
                // 既に再生中の場合は停止してから再生
                if (this.sounds[soundName].isPlaying()) {
                    this.sounds[soundName].stop();
                }
                
                this.sounds[soundName].play();
            } catch (error) {
                console.warn(`音声再生エラー: ${soundName}`, error);
            }
        } else {
            console.warn(`音声が見つかりません: ${soundName}`);
        }
    },
    
    /**
     * ミュート切り替え
     */
    toggleMute() {
        this.isMuted = !this.isMuted;
        // 音声状態ログは省略
        
        // ミュート時は全音声停止
        if (this.isMuted) {
            this.stopAllSounds();
        }
    },
    
    /**
     * 全音声停止
     */
    stopAllSounds() {
        for (let soundName in this.sounds) {
            if (this.sounds[soundName] && this.sounds[soundName].isPlaying()) {
                this.sounds[soundName].stop();
            }
        }
    },
    
    /**
     * 音響システムの初期化完了チェック
     */
    initialize() {
        this.loadAudioSettings(); // 保存された設定を読み込み
        this.isLoaded = true;
        // 初期化完了ログは省略
    },
    
    /**
     * 音声ファイルの読み込み状態チェック
     */
    checkLoadStatus() {
        const loadedSounds = [];
        const failedSounds = [];
        
        for (let soundName in this.sounds) {
            if (this.sounds[soundName]) {
                loadedSounds.push(soundName);
            } else {
                failedSounds.push(soundName);
            }
        }
        
        // 読み込み成功ログは省略
        if (failedSounds.length > 0) {
            console.warn('読み込み失敗:', failedSounds);
        }
        
        return {
            loaded: loadedSounds,
            failed: failedSounds,
            isAllLoaded: failedSounds.length === 0
        };
    },
    
    /**
     * 特定の音声が読み込まれているかチェック
     * @param {string} soundName - チェックする音声名
     * @returns {boolean} 読み込み済みかどうか
     */
    isSoundLoaded(soundName) {
        return this.sounds[soundName] !== null && this.sounds[soundName] !== undefined;
    },
    
    /**
     * マスター音量の設定
     * @param {number} volume - 音量 (0.0 - 1.0)
     */
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        this.saveAudioSettings();
        // マスター音量設定ログは省略
    },

    /**
     * マスター音量の取得
     * @returns {number} 現在のマスター音量
     */
    getMasterVolume() {
        return this.masterVolume;
    },

    /**
     * ミュート状態の設定
     * @param {boolean} muted - ミュート状態
     */
    setMuted(muted) {
        this.isMuted = muted;
        if (this.isMuted) {
            this.stopAllSounds();
        }
        this.saveAudioSettings();
        // 音声状態ログは省略
    },

    /**
     * 音声設定の保存
     */
    saveAudioSettings() {
        try {
            const settings = {
                isMuted: this.isMuted,
                masterVolume: this.masterVolume
            };
            localStorage.setItem('audioSettings', JSON.stringify(settings));
        } catch (error) {
            console.warn('音声設定の保存に失敗:', error);
        }
    },

    /**
     * 音声設定の読み込み
     */
    loadAudioSettings() {
        try {
            const settings = localStorage.getItem('audioSettings');
            if (settings) {
                const parsed = JSON.parse(settings);
                this.isMuted = parsed.isMuted || false;
                this.masterVolume = parsed.masterVolume !== undefined ? parsed.masterVolume : 0.7;
                // 音声設定読込ログは省略
            }
        } catch (error) {
            console.warn('音声設定の読み込みに失敗:', error);
            // デフォルト値を設定
            this.isMuted = false;
            this.masterVolume = 0.7;
        }
    },

    /**
     * 音響システムの詳細情報を取得
     * @returns {object} システム情報
     */
    getSystemInfo() {
        return {
            isLoaded: this.isLoaded,
            isMuted: this.isMuted,
            masterVolume: this.masterVolume,
            availableSounds: Object.keys(this.sounds),
            loadedCount: Object.values(this.sounds).filter(sound => sound !== null).length,
            totalCount: Object.keys(this.soundFiles).length
        };
    }
};