mod api;
mod client;
mod utils;

use crate::utils::setup::{app_setup, init_logger};
use api::*;
use client::state::AppState;
use rustls::crypto::ring::default_provider;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    default_provider()
        .install_default()
        .expect("Failed to install rustls crypto provider");

    tauri::Builder::default()
        // 单实例 https://tauri.app/zh-cn/plugin/single-instance/
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            // 默认情况下，当应用程序已经在运行时启动新实例时，不会采取任何操作。当用户尝试打开一个新实例时，为了聚焦正在运行实例的窗口，修改回调闭包如下
            if let Some((_, webview_window)) = app.webview_windows().iter().next() {
                let _ = webview_window.set_focus();
            }
        }))
        // 窗口状态插件暂时注释，默认的1200×800很合适，避免手动调整后恢复原始比较麻烦
        // .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_system_fonts::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_fs::init()) // 文件系统插件(导入导出)
        .plugin(tauri_plugin_store::Builder::new().build()) // 状态存储插件(连接、设置的自动保存和读取)
        .plugin(tauri_plugin_dialog::init()) // 弹框选择文件
        .plugin(tauri_plugin_opener::init()) // 打开外部链接
        .plugin(init_logger().build()) // 日志插件
        .setup(app_setup)
        .manage(AppState::default()) // 状态管理，保持Redis连接
        .invoke_handler(tauri::generate_handler![
            greet,
            test_conn,
            masters,
            conn_list,
            connect,
            disconnect,
            db_list,
            select_db,
            info,
            info_list,
            chart,
            chart_list,
            node_list,
            scan,
            field_scan,
            get,
            ttl,
            set,
            del,
            rename,
            field_add,
            field_set,
            field_del,
            execute_command,
            slow_log,
            memory_usage,
            config_get,
            config_set,
            client_list,
            publish,
            subscribe,
            subscribe_stop,
            monitor,
            monitor_stop,
            batch_del,
            batch_ttl,
            export_csv,
            import_csv,
            mock_data,
            check_import_conn_list,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
