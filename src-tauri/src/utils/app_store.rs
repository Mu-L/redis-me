//! 区分「应用商店 / MSIX」与官网直装，供关闭内置更新等逻辑使用。

/// 是否通过应用商店类渠道安装：Windows 为 MSIX（含微软商店/侧载）；macOS 为 Mac App Store（`_MASReceipt`）；其余为 `false`。
pub fn detect() -> bool {
    #[cfg(windows)]
    {
        windows_msix_packaged()
    }
    #[cfg(target_os = "macos")]
    {
        macos_app_store_receipt()
    }
    #[cfg(not(any(windows, target_os = "macos")))]
    {
        false
    }
}

#[cfg(target_os = "macos")]
fn macos_app_store_receipt() -> bool {
    let Ok(exe) = std::env::current_exe() else {
        return false;
    };
    let Some(contents) = exe.parent().and_then(|p| p.parent()) else {
        return false;
    };
    contents.join("_MASReceipt/receipt").exists()
}

#[cfg(windows)]
fn windows_msix_packaged() -> bool {
    const APPMODEL_ERROR_NO_PACKAGE: i32 = 15700;
    const ERROR_INSUFFICIENT_BUFFER: i32 = 122;
    const ERROR_SUCCESS: i32 = 0;

    #[link(name = "kernel32")]
    unsafe extern "system" {
        fn GetCurrentPackageFullName(
            package_full_name_length: *mut u32,
            package_full_name: *mut u16,
        ) -> i32;
    }

    unsafe {
        let mut len: u32 = 0;
        let hr = GetCurrentPackageFullName(&mut len, std::ptr::null_mut());
        if hr == APPMODEL_ERROR_NO_PACKAGE {
            return false;
        }
        if hr != ERROR_INSUFFICIENT_BUFFER || len == 0 {
            return false;
        }
        let mut buf = vec![0u16; len as usize];
        let hr2 = GetCurrentPackageFullName(&mut len, buf.as_mut_ptr());
        hr2 == ERROR_SUCCESS
    }
}
