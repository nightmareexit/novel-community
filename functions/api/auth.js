export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  const headers = { 
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  };

  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405, headers });
  }

  try {
    const data = await request.json().catch(() => ({}));

    // ① 新規登録 (signup)
    if (action === "signup") {
      const username = data.username ? data.username.trim() : "";
      const password = data.password ? data.password.trim() : "";

      if (!username || !password) {
        return Response.json({ error: "ユーザー名とパスワードを入力してください" }, { status: 400, headers });
      }

      // 既存チェック
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
    if (action === "login") {
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

    return Response.json({ error: "Invalid action" }, { status: 400, headers });

  } catch (err) {
    return Response.json({ error: "サーバーエラー: " + err.message }, { status: 500, headers });
  }
}
