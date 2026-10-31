export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  const headers = { 
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  };

  try {
    // ① 新規登録 (signup)
    if (action === "signup" && request.method === "POST") {
      const data = await request.json().catch(() => ({}));
      const username = data.username ? data.username.trim() : "";
      const password = data.password ? data.password.trim() : "";

      if (!username || !password) {
        return Response.json({ error: "ユーザー名とパスワードを入力してください" }, { status: 400, headers });
      }

      const existing = await env.DB.prepare(
        "SELECT * FROM users WHERE username = ?"
      ).bind(username).first();

      if (existing) {
        return Response.json({ error: "このユーザー名はすでに使われています" }, { status: 400, headers });
      }

      const initialRole = username === "iden" ? "admin" : "user";
      const initialBadges = username === "iden" ? "君主, 管理者" : "サポーター";

      const result = await env.DB.prepare(
        "INSERT INTO users (username, password, role, badges) VALUES (?, ?, ?, ?)"
      ).bind(username, password, initialRole, initialBadges).run();

      const newUser = await env.DB.prepare(
        "SELECT * FROM users WHERE id = ?"
      ).bind(result.meta.last_row_id).first();

      return Response.json({ success: true, message: "登録が完了しました！", user: newUser }, { headers });
    }

    // ② ログイン (login)
    if (action === "login" && request.method === "POST") {
      const data = await request.json().catch(() => ({}));
      const loginId = data.loginId ? data.loginId.trim() : "";
      const password = data.password ? data.password.trim() : "";

      if (!loginId || !password) {
        return Response.json({ error: "ユーザー名/IDとパスワードを入力してください" }, { status: 400, headers });
      }

      const user = await env.DB.prepare(
        "SELECT * FROM users WHERE username = ? OR id = ?"
      ).bind(loginId, loginId).first();

      if (!user) {
        return Response.json({ error: "ユーザーが見つかりません" }, { status: 404, headers });
      }

      if (user.password && user.password !== password) {
        return Response.json({ error: "パスワードが間違っています" }, { status: 401, headers });
      }

      return Response.json({ success: true, user }, { headers });
    }

    // ③ プロフィール更新 (update)
    if (action === "update" && (request.method === "PUT" || request.method === "POST")) {
      const data = await request.json().catch(() => ({}));
      const { id, bio, avatar, selected_badges } = data;

      if (!id) {
        return Response.json({ success: false, error: 'ユーザーIDが必要です' }, { status: 400, headers });
      }

      await env.DB.prepare(
        `UPDATE users SET bio = ?, avatar = ?, selected_badges = ? WHERE id = ?`
      ).bind(bio || '', avatar || '', selected_badges || '', id).run();

      const updatedUser = await env.DB.prepare(
        `SELECT id, username, role, badges, bio, avatar, selected_badges FROM users WHERE id = ?`
      ).bind(id).first();

      return Response.json({ success: true, user: updatedUser }, { headers });
    }

    // ④ ユーザー情報取得 (getuser)
    if (action === "getuser" && request.method === "GET") {
      const username = url.searchParams.get('username');
      if (!username) {
        return Response.json({ error: "ユーザー名が必要です" }, { status: 400, headers });
      }

      const user = await env.DB.prepare(
        "SELECT id, username, role, badges, bio, avatar, selected_badges FROM users WHERE username = ?"
      ).bind(username).first();

      if (!user) {
        return Response.json({ error: "ユーザーが見つかりません" }, { status: 404, headers });
      }

      return Response.json({ success: true, user }, { headers });
    }

    return Response.json({ error: "Invalid action or method" }, { status: 400, headers });

  } catch (err) {
    return Response.json({ error: "サーバーエラー: " + err.message }, { status: 500, headers });
  }
}
