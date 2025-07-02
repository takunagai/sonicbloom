#!/usr/bin/env python3
"""
Interactive Particle Animation ローカルサーバー起動スクリプト
CORS問題を解決するためのHTTPサーバー
"""

import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8000

class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()

def main():
    try:
        # プロジェクトディレクトリに移動
        script_dir = os.path.dirname(os.path.abspath(__file__))
        os.chdir(script_dir)
        
        with socketserver.TCPServer(("", PORT), CORSRequestHandler) as httpd:
            print(f"🚀 Interactive Particle Animation サーバーを起動しています...")
            print(f"📍 URL: http://localhost:{PORT}")
            print(f"📁 ディレクトリ: {script_dir}")
            print("⭐ ブラウザが自動で開きます...")
            print("🛑 サーバーを停止するには Ctrl+C を押してください")
            print("-" * 50)
            
            # ブラウザを自動で開く
            webbrowser.open(f'http://localhost:{PORT}')
            
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n🛑 サーバーを停止しました")
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ ポート {PORT} は既に使用されています")
            print("💡 他のサーバーを停止するか、別のポートを使用してください")
        else:
            print(f"❌ エラーが発生しました: {e}")
    except Exception as e:
        print(f"❌ 予期しないエラー: {e}")

if __name__ == "__main__":
    main()