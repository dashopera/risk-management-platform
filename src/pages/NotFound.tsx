export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6">
      <h1 className="text-6xl font-bold text-gray-300">404</h1>
      <p className="text-gray-500 mt-4 text-lg">页面不存在</p>
      <a href="/" className="mt-6 text-blue-600 hover:text-blue-700 text-sm">
        返回首页
      </a>
    </div>
  );
}
