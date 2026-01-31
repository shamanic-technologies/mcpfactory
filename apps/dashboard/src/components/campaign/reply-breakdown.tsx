"use client";

interface ReplyBreakdownProps {
  willingToMeet: number;
  interested: number;
  notInterested: number;
  outOfOffice: number;
  unsubscribe: number;
}

export function ReplyBreakdown({ 
  willingToMeet, 
  interested, 
  notInterested, 
  outOfOffice,
  unsubscribe
}: ReplyBreakdownProps) {
  const total = willingToMeet + interested + notInterested + outOfOffice + unsubscribe;
  
  const categories = [
    { 
      label: "Willing to meet", 
      value: willingToMeet, 
      color: "bg-green-500",
      bgColor: "bg-green-100",
      icon: "🟢"
    },
    { 
      label: "Interested", 
      value: interested, 
      color: "bg-blue-500",
      bgColor: "bg-blue-100",
      icon: "🔵"
    },
    { 
      label: "Not interested", 
      value: notInterested, 
      color: "bg-red-500",
      bgColor: "bg-red-100",
      icon: "🔴"
    },
    { 
      label: "Out of office", 
      value: outOfOffice, 
      color: "bg-gray-400",
      bgColor: "bg-gray-100",
      icon: "⚪"
    },
    { 
      label: "Unsubscribe", 
      value: unsubscribe, 
      color: "bg-orange-500",
      bgColor: "bg-orange-100",
      icon: "🟠"
    },
  ].filter(c => c.value > 0);

  if (total === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-medium text-gray-800 mb-4">Reply Breakdown</h3>
        <p className="text-sm text-gray-500 text-center py-4">No replies yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-medium text-gray-800 mb-4">Reply Breakdown</h3>
      
      <div className="space-y-3">
        {categories.map((cat) => {
          const percentage = (cat.value / total) * 100;
          return (
            <div key={cat.label} className="flex items-center gap-3">
              <span className="text-sm">{cat.icon}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">{cat.label}</span>
                  <span className="text-sm font-medium text-gray-800">{cat.value}</span>
                </div>
                <div className={`h-2 ${cat.bgColor} rounded-full overflow-hidden`}>
                  <div 
                    className={`h-full ${cat.color} rounded-full transition-all`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
              <span className="text-xs text-gray-500 w-12 text-right">
                {percentage.toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
