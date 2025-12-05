// 打包后关闭右键菜单
if (import.meta.env.PROD) {
  document.addEventListener('contextmenu', event => event.preventDefault());
}

export default function (app) {}
