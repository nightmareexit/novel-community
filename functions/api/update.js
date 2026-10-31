export async function onRequestPut(context) {
    try {
        const { request, env } = context;
        const data = await request.json();
        const { id, bio, avatar, selected_badges } = data;

        if (!id) {
            return new Response(JSON.stringify({ success: false, error: 'ユーザーIDが必要です' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // データベース（D1）のユーザー情報を更新
        await env.DB.prepare(
            `UPDATE users SET bio = ?, avatar = ?, selected_badges = ? WHERE id = ?`
        ).bind(bio || '', avatar || '', selected_badges || '', id).run();

        // 更新後の最新ユーザー情報を取得して返す
        const updatedUser = await env.DB.prepare(
            `SELECT id, username, role, badges, bio, avatar, selected_badges FROM users WHERE id = ?`
        ).bind(id).first();

        return new Response(JSON.stringify({ success: true, user: updatedUser }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
