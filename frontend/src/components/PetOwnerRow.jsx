const PetOwnerRow = ({ customer, onView }) => {
  return (
    <tr className="hover:bg-slate-50/50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs mr-3">
            {customer.name.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-slate-800">{customer.name}</p>
            <p className="text-xs text-slate-500">{customer.phone}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-slate-600">{customer.city}</td>
      <td className="px-6 py-4">
        <div className="flex -space-x-2">
          {customer.pets?.map((pet, i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-sm"
              title={`${pet.pet_name} (${pet.breed})`}
            >
              {pet.pet_type === 'dog' ? '🐕' : '🐈'}
            </div>
          ))}
        </div>
      </td>
      <td className="px-6 py-4 text-slate-600">{customer.total_orders}</td>
      <td className="px-6 py-4 font-medium text-slate-800">₹{customer.total_spent?.toLocaleString()}</td>
      <td className="px-6 py-4 text-slate-600">
        {customer.last_order_days_ago != null ? `${customer.last_order_days_ago} days ago` : '—'}
      </td>
      <td className="px-6 py-4 text-right">
        <button
          onClick={() => onView(customer._id)}
          className="text-primary hover:text-orange-700 font-medium text-sm transition-colors"
        >
          View
        </button>
      </td>
    </tr>
  );
};

export default PetOwnerRow;
