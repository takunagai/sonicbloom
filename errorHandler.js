/**
 * 統一されたエラーハンドリングシステム
 * アプリケーション全体のエラー管理とロギングを担当
 */

/**
 * エラーレベル定義
 */
const ErrorLevel = {
    DEBUG: 'debug',
    INFO: 'info', 
    WARN: 'warn',
    ERROR: 'error',
    FATAL: 'fatal'
};

/**
 * エラーカテゴリ定義
 */
const ErrorCategory = {
    SYSTEM: 'system',
    SOUND: 'sound',
    GRAPHICS: 'graphics',
    USER_INPUT: 'user_input',
    PERFORMANCE: 'performance',
    NETWORK: 'network'
};

/**
 * アプリケーション固有のエラークラス
 */
class AppError extends Error {
    /**
     * @param {string} message - エラーメッセージ
     * @param {string} category - エラーカテゴリ
     * @param {string} level - エラーレベル
     * @param {Object} context - 追加のコンテキスト情報
     */
    constructor(message, category = ErrorCategory.SYSTEM, level = ErrorLevel.ERROR, context = {}) {
        super(message);
        this.name = 'AppError';
        this.category = category;
        this.level = level;
        this.context = context;
        this.timestamp = new Date().toISOString();
        this.stack = Error.captureStackTrace ? Error.captureStackTrace(this, AppError) : this.stack;
    }
}

/**
 * 統一エラーハンドラークラス
 */
class ErrorHandler {
    constructor() {
        this.errors = [];
        this.maxErrorHistory = 100;
        this.errorCallbacks = new Map();
        this.consoleEnabled = true;
        this.uiNotificationEnabled = true;
        
        // グローバルエラーハンドラーの設定
        this.setupGlobalHandlers();
    }

    /**
     * グローバルエラーハンドラーの設定
     */
    setupGlobalHandlers() {
        // 未処理のJavaScriptエラー
        window.addEventListener('error', (event) => {
            this.handleError(new AppError(
                event.message,
                ErrorCategory.SYSTEM,
                ErrorLevel.ERROR,
                {
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    error: event.error
                }
            ));
        });

        // Promise rejection
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(new AppError(
                `Unhandled Promise Rejection: ${event.reason}`,
                ErrorCategory.SYSTEM,
                ErrorLevel.ERROR,
                { reason: event.reason }
            ));
        });

        // p5.js特有のエラー（もし存在すれば）
        if (typeof window.p5 !== 'undefined') {
            // p5.jsのエラーハンドリング拡張可能
        }
    }

    /**
     * エラーの処理
     * @param {Error|AppError} error - 処理するエラー
     * @param {Object} additionalContext - 追加のコンテキスト
     */
    handleError(error, additionalContext = {}) {
        const appError = error instanceof AppError ? error : new AppError(
            error.message,
            ErrorCategory.SYSTEM,
            ErrorLevel.ERROR,
            { originalError: error, ...additionalContext }
        );

        // エラー履歴に追加
        this.addToHistory(appError);

        // コンソールへの出力
        if (this.consoleEnabled) {
            this.logToConsole(appError);
        }

        // UIへの通知
        if (this.uiNotificationEnabled) {
            this.notifyUI(appError);
        }

        // 登録されたコールバックの実行
        this.executeCallbacks(appError);

        // 重大なエラーの場合は追加処理
        if (appError.level === ErrorLevel.FATAL) {
            this.handleFatalError(appError);
        }
    }

    /**
     * エラー履歴への追加
     * @param {AppError} error - 追加するエラー
     */
    addToHistory(error) {
        this.errors.push(error);
        
        // 履歴サイズの制限
        if (this.errors.length > this.maxErrorHistory) {
            this.errors.splice(0, this.errors.length - this.maxErrorHistory);
        }
    }

    /**
     * コンソールへのログ出力
     * @param {AppError} error - 出力するエラー
     */
    logToConsole(error) {
        const prefix = `[${error.level.toUpperCase()}] [${error.category}]`;
        const message = `${prefix} ${error.message}`;
        
        switch (error.level) {
            case ErrorLevel.DEBUG:
                console.debug(message, error.context);
                break;
            case ErrorLevel.INFO:
                console.info(message, error.context);
                break;
            case ErrorLevel.WARN:
                console.warn(message, error.context);
                break;
            case ErrorLevel.ERROR:
            case ErrorLevel.FATAL:
                console.error(message, error.context);
                if (error.stack) {
                    console.error('Stack trace:', error.stack);
                }
                break;
            default:
                console.log(message, error.context);
        }
    }

    /**
     * UIへの通知
     * @param {AppError} error - 通知するエラー
     */
    notifyUI(error) {
        try {
            // サウンドシステムエラーの場合は特別な処理
            if (error.category === ErrorCategory.SOUND) {
                this.updateSoundStatus(error);
            }

            // 重要なエラーの場合は画面に表示
            if (error.level === ErrorLevel.ERROR || error.level === ErrorLevel.FATAL) {
                this.showErrorNotification(error);
            }
        } catch (notificationError) {
            console.error('Failed to notify UI about error:', notificationError);
        }
    }

    /**
     * サウンドステータスの更新
     * @param {AppError} error - サウンド関連エラー
     */
    updateSoundStatus(error) {
        const statusElement = document.getElementById('sound-status-text');
        const statusContainer = document.getElementById('sound-status');
        
        if (statusElement && statusContainer) {
            const message = `🔴 サウンドエラー: ${error.message}`;
            statusElement.textContent = message;
            statusContainer.style.backgroundColor = Config.UI.STATUS_COLORS.ERROR;
        }
    }

    /**
     * エラー通知の表示
     * @param {AppError} error - 表示するエラー
     */
    showErrorNotification(error) {
        // シンプルなエラー通知の実装
        // 実際のプロダクションでは、より洗練されたUI通知システムを使用
        if (error.level === ErrorLevel.FATAL) {
            // 致命的エラーの場合はアラート表示も検討
            console.error('FATAL ERROR:', error.message);
        }
    }

    /**
     * エラーコールバックの実行
     * @param {AppError} error - エラー
     */
    executeCallbacks(error) {
        const callbacks = this.errorCallbacks.get(error.category) || [];
        callbacks.forEach(callback => {
            try {
                callback(error);
            } catch (callbackError) {
                console.error('Error in error callback:', callbackError);
            }
        });
    }

    /**
     * 致命的エラーの処理
     * @param {AppError} error - 致命的エラー
     */
    handleFatalError(error) {
        console.error('FATAL ERROR DETECTED:', error);
        
        // アプリケーションの安全な停止処理
        try {
            // グローバルな停止フラグの設定など
            if (typeof window.isPaused !== 'undefined') {
                window.isPaused = true;
            }
        } catch (stopError) {
            console.error('Failed to stop application safely:', stopError);
        }
    }

    /**
     * エラーコールバックの登録
     * @param {string} category - エラーカテゴリ
     * @param {Function} callback - コールバック関数
     */
    registerCallback(category, callback) {
        if (!this.errorCallbacks.has(category)) {
            this.errorCallbacks.set(category, []);
        }
        this.errorCallbacks.get(category).push(callback);
    }

    /**
     * エラー履歴の取得
     * @param {string} category - 取得するカテゴリ（省略時は全て）
     * @param {number} limit - 取得件数制限
     * @returns {AppError[]} エラー履歴
     */
    getErrorHistory(category = null, limit = null) {
        let filtered = category ? 
            this.errors.filter(error => error.category === category) : 
            this.errors;
            
        if (limit) {
            filtered = filtered.slice(-limit);
        }
        
        return filtered;
    }

    /**
     * エラー統計の取得
     * @returns {Object} エラー統計情報
     */
    getErrorStats() {
        const stats = {
            total: this.errors.length,
            byCategory: {},
            byLevel: {},
            recent: this.errors.filter(error => 
                new Date() - new Date(error.timestamp) < 300000 // 5分以内
            ).length
        };

        this.errors.forEach(error => {
            stats.byCategory[error.category] = (stats.byCategory[error.category] || 0) + 1;
            stats.byLevel[error.level] = (stats.byLevel[error.level] || 0) + 1;
        });

        return stats;
    }

    /**
     * エラー履歴のクリア
     */
    clearHistory() {
        this.errors = [];
    }

    /**
     * コンソール出力の有効/無効切り替え
     * @param {boolean} enabled - 有効かどうか
     */
    setConsoleEnabled(enabled) {
        this.consoleEnabled = enabled;
    }

    /**
     * UI通知の有効/無効切り替え
     * @param {boolean} enabled - 有効かどうか
     */
    setUINotificationEnabled(enabled) {
        this.uiNotificationEnabled = enabled;
    }
}

/**
 * 便利なヘルパー関数群
 */
const ErrorUtils = {
    /**
     * 安全な関数実行（エラーを自動処理）
     * @param {Function} fn - 実行する関数
     * @param {string} context - エラー時のコンテキスト情報
     * @param {*} defaultValue - エラー時のデフォルト戻り値
     * @returns {*} 関数の戻り値またはデフォルト値
     */
    safeExecute(fn, context = 'Unknown operation', defaultValue = null) {
        try {
            return fn();
        } catch (error) {
            errorHandler.handleError(new AppError(
                `${context}: ${error.message}`,
                ErrorCategory.SYSTEM,
                ErrorLevel.WARN,
                { originalError: error }
            ));
            return defaultValue;
        }
    },

    /**
     * 非同期関数の安全な実行
     * @param {Function} asyncFn - 実行する非同期関数
     * @param {string} context - エラー時のコンテキスト情報
     * @returns {Promise} プロミス
     */
    async safeExecuteAsync(asyncFn, context = 'Unknown async operation') {
        try {
            return await asyncFn();
        } catch (error) {
            errorHandler.handleError(new AppError(
                `${context}: ${error.message}`,
                ErrorCategory.SYSTEM,
                ErrorLevel.WARN,
                { originalError: error }
            ));
            return null;
        }
    },

    /**
     * パフォーマンス監視付きの関数実行
     * @param {Function} fn - 実行する関数
     * @param {string} name - 処理名
     * @param {number} warningThreshold - 警告閾値（ms）
     * @returns {*} 関数の戻り値
     */
    executeWithPerformanceMonitoring(fn, name, warningThreshold = 16) { // 60fps基準
        const startTime = performance.now();
        const result = this.safeExecute(fn, `Performance monitoring: ${name}`);
        const duration = performance.now() - startTime;
        
        if (duration > warningThreshold) {
            errorHandler.handleError(new AppError(
                `Slow operation detected: ${name} took ${duration.toFixed(2)}ms`,
                ErrorCategory.PERFORMANCE,
                ErrorLevel.WARN,
                { duration, name, warningThreshold }
            ));
        }
        
        return result;
    }
};

// グローバルインスタンスの作成
const errorHandler = new ErrorHandler();

// グローバルアクセス用
window.errorHandler = errorHandler;
window.ErrorHandler = ErrorHandler;
window.AppError = AppError;
window.ErrorLevel = ErrorLevel;
window.ErrorCategory = ErrorCategory;
window.ErrorUtils = ErrorUtils;