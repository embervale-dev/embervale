#!/bin/sh
# Builds the single-file game (../index.html)
cd "$(dirname "$0")"
node ../art/build.js || exit 1
JS="0_icons_gen.js 0_icons.js 1_data.js 1b_story.js 1c_codex.js 1d_long.js 1e_more.js 1f_features.js 1g_weapons.js 1h_gear.js 1i_rarity.js 2_engine.js 2b_rarity.js 3_world.js 4_game.js 4b_long.js 5_models.js 5_render3d.js 5b_hud.js 5c_long_render.js 5d_anim.js 6_ui.js 6b_long_ui.js 6c_tutorial.js 6d_polish.js 6e_more.js 6f_a.js 6f_b.js 6f_c.js 6g_weapons.js 6h_tutorial2.js 6i_gear.js 6j_polish.js 6k_loot.js 6l_long2.js 6m_balance.js 6n_gui.js 6o_fit.js 6p_progress.js 6q_newbie.js 6r_resume.js 6s_music.js 6t_bosschoice.js 6u_uistyle.js 6v_audio.js 6w_fx.js 6x_ui2.js 6y_stalls.js 6z_long3.js 7a_net.js 7b_fixes.js 7c_chat.js 7d_looks.js 7e_mpsync.js 7f_mp2.js 7g_polish2.js 7h_balance2.js 7h_weapons3d.js 7_main.js"
cat $JS > /tmp/embervale_all.js
mk() { { cat head.html 0_sprite.html; printf '<script>\n'; cat vendor/three.bundle.js; printf '\n</script>\n<script>\n'; cat $JS $1; printf '\n</script>\n</body>\n</html>\n'; } > "$2"; }
mk "" "../index.html"
node mk_offline.js
mk test.js /tmp/embervale_test.html
