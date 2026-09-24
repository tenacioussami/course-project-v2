const Loading = ({ label = 'Loading...' }) => (
  <div className="flex items-center justify-center py-16">
    <div className="flex items-center gap-3 text-gray-500">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      <span>{label}</span>
    </div>
  </div>
);

export default Loading;
