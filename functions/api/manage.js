export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const method = request.method;

    const headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
    };

    try {
        // 1. 削除処理 (DELETE)
        if (method === "DELETE") {
            const id = url.searchParams.get("id");
            const username = url.searchParams.get("username"); // リクエストしたユーザー名

            if (!id || !username) {
                return new Response(JSON.stringify({ success: false, error: "必要な情報が不足しています" }), { status: 400, headers });
            }

            // 念のため、DBから対象の作品の作者を引いて本人かチェック
            const post = await env.DB.prepare("SELECT author FROM posts WHERE id = ?").bind(id).first();
            if (!post) {
                return new Response(JSON.stringify({ success: false, error: "作品が見つかりません" }), { status: 404, headers });
            }

            if (post.author !== username) {
                return new Response(JSON.stringify({ success: false, error: "権限がありません（作者本人のみ削除できます）" }), { status: 403, headers });
            }

            await env.DB.prepare("DELETE FROM posts WHERE id = ?").bind(id).run();
            return new Response(JSON.stringify({ success: true }), { headers });
        }

        // 2. 編集・非公開切り替え処理 (PUT または POST)
        if (method === "PUT" || method === "POST") {
            const body = await request.json();
            const { id, username, title, content, status, gender, age, occupation, origin, skills } = body;

            if (!id || !username) {
                return new Response(JSON.stringify({ success: false, error: "必要な情報が不足しています" }), { status: 400, headers });
            }

            // DBから対象の作品の作者を引いて本人かチェック
            const post = await env.DB.prepare("SELECT author FROM posts WHERE id = ?").bind(id).first();
            if (!post) {
                return new Response(JSON.stringify({ success: false, error: "作品が見つかりません" }), { status: 404, headers });
            }

            if (post.author !== username) {
                return new Response(JSON.stringify({ success: false, error: "権限がありません（作者本人のみ編集できます）" }), { status: 403, headers });
            }

            // データベースの該当作品を更新
            await env.DB.prepare(`
                UPDATE posts 
                SET title = COALESCE(?, title),
                    content = COALESCE(?, content),
                    status = COALESCE(?, status),
                    gender = COALESCE(?, gender),
                    age = COALESCE(?, age),
                    occupation = COALESCE(?, occupation),
                    origin = COALESCE(?, origin),
                    skills = COALESCE(?, skills)
                WHERE id = ?
            `).bind(
                title || null,
                content || null,
                status || null,
                gender || null,
                age || null,
                occupation || null,
                origin || null,
                skills || null,
                id
            ).run();

            return new Response(JSON.stringify({ success: true }), { headers });
        }

        return new Response(JSON.stringify({ success: false, error: "無効なリクエストメソッドです" }), { status: 405, headers });

    } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers });
    }
}
