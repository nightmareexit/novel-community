function initSidebar(activePage = '') {
    // サイドバーのメニュー項目（ここで順番を自由に入れ替え可能！）
    const menuItems = [
        { href: '/create', label: '＋ 作成する', className: 'side-btn btn-create-main' },
        { href: '/', label: '🏠 ホーム', key: 'home' },
        { href: '/profile', label: '👤 プロフィール', key: 'profile' },
        { href: '/bookmarks.html', label: '🔖 ブックマーク', key: 'bookmarks' },
        // ★ 今後追加したいページ（管理者画面やお知らせなど）もここに自由に追加できます！
        // { href: '/admin.html', label: '👑 管理者専用', key: 'admin' },
        // { href: '/news.html', label: '📢 お知らせ', key: 'news' }
    ];

    // サイドバー全体のHTMLを動的に生成
    const sidebarHtml = `
        <style>
            sidebar { width: 220px; background: #ffffff; border-right: 1px solid #e1e4e8; padding: 20px 12px; display: flex; flex-direction: column; gap: 8px; position: sticky; top: 0; height: 100vh; box-sizing: border-box; flex-shrink: 0; transition: transform 0.3s ease; z-index: 1000; }
            .logo-area { font-size: 15px; font-weight: bold; color: #2c3e50; margin-bottom: 5px; padding-left: 5px; display: flex; justify-content: space-between; align-items: center; }
            .side-btn { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: 8px; color: #333; text-decoration: none; font-size: 14px; font-weight: bold; transition: 0.2s; }
            .side-btn:hover { background: #f0f3f6; color: #3498db; }
            .side-btn.active { background: #eef2f7; color: #3498db; }
            .btn-create-main { background: #3498db; color: white !important; border-radius: 8px; text-align: center; justify-content: center; margin-bottom: 5px; box-shadow: 0 4px 10px rgba(52, 152, 219, 0.3); }
            .btn-create-main:hover { background: #2980b9 !important; }
            
            /* サイドバー下部のコンテストバナーエリア */
            .sidebar-banner { margin-top: auto; padding-top: 15px; border-top: 1px solid #e1e4e8; text-align: center; }
            .sidebar-banner img { width: 100%; border-radius: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); transition: 0.2s; }
            .sidebar-banner img:hover { transform: scale(1.02); }

            .menu-toggle { display: none; background: #2c3e50; color: white; border: none; padding: 8px 12px; font-size: 14px; border-radius: 6px; cursor: pointer; position: fixed; top: 12px; left: 12px; z-index: 1100; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
            .sidebar-overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); z-index: 999; }

            @media (max-width: 768px) {
                .menu-toggle { display: block; }
                sidebar { position: fixed; left: -240px; top: 0; height: 100vh; width: 220px; box-shadow: 4px 0 15px rgba(0,0,0,0.1); padding-top: 60px; }
                sidebar.open { left: 0; }
                .sidebar-overlay.open { display: block; }
            }
        </style>

        <button class="menu-toggle" onclick="toggleSidebar()">☰ メニュー</button>
        <div class="sidebar-overlay" id="sidebarOverlay" onclick="toggleSidebar()"></div>

        <sidebar id="appSidebar">
            <div class="logo-area">
                <span>🎨 創作コミュニティ</span>
                <span style="cursor:pointer; font-size:18px; padding: 0 5px;" onclick="toggleSidebar()">✕</span>
            </div>
            ${menuItems.map(item => `
                <a href="${item.href}" class="${item.className || 'side-btn'} ${activePage === item.key ? 'active' : ''}">${item.label}</a>
            `).join('')}

            <!-- 💡 サイドバー下部のコンテスト・イベント告知バナー（ここから自由にリンクや画像を変えられます！） -->
            <div class="sidebar-banner">
                <a href="/contest.html">
                    <div style="background: linear-gradient(135deg, #e74c3c, #f39c12); color: white; padding: 10px; border-radius: 6px; font-size: 12px; font-weight: bold; text-align: center;">
                        🏆 第1回 創作コンテスト開催中！<br>
                        <span style="font-size: 10px; opacity: 0.9;">詳細はこちら ❯</span>
                    </div>
                </a>
            </div>
        </sidebar>
    `;

    // <body> の一番最初にサイドバー構造を自動挿入
    document.body.insertAdjacentHTML('afterbegin', sidebarHtml);
}

function toggleSidebar() {
    const sidebar = document.getElementById('appSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar && overlay) {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('open');
    }
}
