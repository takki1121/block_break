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
        console.log('音声ファイルの読み込みを開始...');
        
        for (let soundName in this.soundFiles) {
            try {
                this.sounds[soundName] = loadSound(this.soundFiles[soundName]);
                console.log(`音声読み込み成功: ${soundName}`);
            } catch (error) {
                console.warn(`音声ファイルの読み込みに失敗: ${this.soundFiles[soundName]}`);
                this.sounds[soundName] = null;
            }
        }
    },
    
    /**
     * 音声再生機能
     * @param {string} soundName - 再生する音声名
     * @param {number} volume - 音量 (0.0 - 1.0)
     */
    playSound(soundName, volume = 0.5) {
        if (this.isMuted) return;
        
        if (this.sounds[soundName]) {
            try {
                // 音量設定
                this.sounds[soundName].setVolume(volume);
                
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
        console.log(`音声: ${this.isMuted ? 'OFF' : 'ON'}`);
        
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
        this.isLoaded = true;
        console.log('音響システム初期化完了');
        console.log('読み込み済み音声:', Object.keys(this.sounds));
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
        
        console.log('読み込み成功:', loadedSounds);
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
     * 音響システムの詳細情報を取得
     * @returns {object} システム情報
     */
    getSystemInfo() {
        return {
            isLoaded: this.isLoaded,
            isMuted: this.isMuted,
            availableSounds: Object.keys(this.sounds),
            loadedCount: Object.values(this.sounds).filter(sound => sound !== null).length,
            totalCount: Object.keys(this.soundFiles).length
        };
    }
};