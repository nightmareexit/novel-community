export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  const headers = { 
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*"
  };

  try {
    // 1. 簡易権限チェック（実行者のユーザー名またはIDからDBを確認）
    const operatorName = url.searchParams.get('operator');
    if (!operatorName) {
      return Response.json({ success: false, error: '権限が確認できません（オペレーター未指定）' }, { status: 403, headers });
    }

    const opUser = await env.DB.prepare("SELECT * FROM users WHERE username = ? OR id = ?").bind(operatorName, operatorName).first();
    if (!opUser) {
      return Response.json({ success: false, error: '操作ユーザーが見つかりません。' }, { status: 403, headers });
    }

    // 管理者またはモデレーター権限、あるいはバッヂに「管理者」「モデレーター」が含まれているかチェック
    const isOwnerOrMod = opUser.role === 'admin' || opUser.role === 'moderator' || 
                         (opUser.badges && (opUser.badges.includes('管理者') || opUser.badges.includes('モデレーター')));
    
    if (!isOwnerOrMod) {
      return Response.json({ success: false, error: 'アクセス権限がありません（管理者・モデレーター限定）。' }, { status: 403, headers });
    }

    // --- ユーザー検索 ---
    if (action === 'search_user' && request.method === 'GET') {
      const query = url.searchParams.get('q');
      const { results } = await env.DB.prepare(
        "SELECT id, username, role, badges, selected_badges, bio FROM users WHERE username LIKE ? OR id = ?"
      ).bind(`%${query}%`, query).all();
      return Response.json({ success: true, users: results }, { headers });
    }

    // --- ユーザー更新（バッヂ付与や権限変更、利用停止など） ---
    if (action === 'update_user' && request.method === 'PUT') {
      const data = await request.json();
      await env.DB.prepare(
        "UPDATE users SET badges = ?, role = ? WHERE id = ? OR username = ?"
      ).bind(data.badges, data.role, data.id, data.username).run();
      return Response.json({ success: true, message: 'ユーザー情報を更新しました。' }, { headers });
    }

    // --- 作品検索 ---
    if (action === 'search_post' && request.method === 'GET') {
      const query = url.searchParams.get('q');
      const { results } = await env.DB.prepare(
        "SELECT * FROM posts WHERE title LIKE ? OR id = ?"
      ).bind(`%${query}%`, query).all();
      return Response.json({ success: true, posts: results }, { headers });
    }

    // --- 作品削除 ---
    if (action === 'delete_post' && request.method === 'DELETE') {
      const postId = url.searchParams.get('id');
      await env.DB.prepare("DELETE FROM posts WHERE id = ?").bind(postId).run();
      return Response.json({ success: true, message: '作品を削除しました。' }, { headers });
    }

    // --- 作品ステータス変更（非公開警告など） ---
    if (action === 'update_post_status' && request.method === 'PUT') {
      const data = await request.json();
      await env.DB.prepare("UPDATE posts SET status = ? WHERE id = ?").bind(data.status, data.id).run();
      return Response.json({ success: true, message: '作品の公開ステータスを更新しました。' }, { headers });
    }

    return Response.json({ success: false, error: '無効なアクションです。' }, { status: 400, headers });

  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500, headers });
  }
}
