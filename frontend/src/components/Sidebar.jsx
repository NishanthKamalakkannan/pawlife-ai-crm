import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Megaphone, PlusCircle, PawPrint } from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Campaigns', path: '/campaigns', icon: Megaphone },
    { name: 'New Campaign', path: '/campaigns/new', icon: PlusCircle },
  ];

  return (
    <div className="w-64 bg-secondary text-slate-300 flex flex-col h-full shadow-lg z-10">
      <div className="h-20 flex items-center px-8 border-b border-slate-700/50">
        <PawPrint className="text-primary w-8 h-8 mr-3" />
        <span className="text-2xl font-bold text-white tracking-wide">PawLife</span>
      </div>
      
      <nav className="flex-1 py-6 px-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/campaigns'}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                    : 'hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5 mr-3" />
              <span className="font-medium">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-slate-700/50">
        <div className="flex items-center space-x-3 px-4 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-orange-400 flex items-center justify-center text-white font-bold text-sm">
            M
          </div>
          <div>
            <p className="text-sm font-medium text-white">Marketer</p>
            <p className="text-xs text-slate-400">pawlife.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
