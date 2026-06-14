const StatCard = ({ title, value, icon: Icon, trend }) => {
  return (
    <div className="card p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
        <Icon className="w-32 h-32" />
      </div>
      <div className="flex justify-between items-start mb-4 z-10">
        <h3 className="text-slate-500 font-medium text-sm">{title}</h3>
        <div className="p-2 bg-primary/10 text-primary rounded-lg">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="z-10">
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">{value}</h2>
        {trend && (
          <p className="text-sm mt-2 font-medium text-success flex items-center">
            <span className="mr-1">↑</span> {trend}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatCard;
