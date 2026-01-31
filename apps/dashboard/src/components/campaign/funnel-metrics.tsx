"use client";

interface FunnelMetricsProps {
  leadsFound: number;
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
  emailsReplied: number;
}

export function FunnelMetrics({ 
  leadsFound, 
  emailsSent, 
  emailsOpened, 
  emailsClicked, 
  emailsReplied 
}: FunnelMetricsProps) {
  const steps = [
    { label: "Leads", value: leadsFound, rate: null },
    { label: "Sent", value: emailsSent, rate: leadsFound > 0 ? (emailsSent / leadsFound * 100) : 0 },
    { label: "Opened", value: emailsOpened, rate: emailsSent > 0 ? (emailsOpened / emailsSent * 100) : 0 },
    { label: "Clicked", value: emailsClicked, rate: emailsOpened > 0 ? (emailsClicked / emailsOpened * 100) : 0 },
    { label: "Replied", value: emailsReplied, rate: emailsSent > 0 ? (emailsReplied / emailsSent * 100) : 0 },
  ];

  const maxValue = Math.max(...steps.map(s => s.value), 1);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-medium text-gray-800 mb-6">Campaign Funnel</h3>
      
      <div className="flex items-end justify-between gap-2">
        {steps.map((step, i) => (
          <div key={step.label} className="flex-1 text-center">
            {/* Bar */}
            <div className="relative h-32 flex items-end justify-center mb-2">
              <div 
                className="w-full max-w-16 bg-primary-100 rounded-t transition-all"
                style={{ height: `${(step.value / maxValue) * 100}%`, minHeight: "8px" }}
              >
                <div 
                  className="w-full bg-primary-500 rounded-t transition-all"
                  style={{ 
                    height: i === 0 ? "100%" : `${steps[i-1].value > 0 ? (step.value / steps[i-1].value) * 100 : 0}%`,
                    minHeight: "4px"
                  }}
                />
              </div>
            </div>
            
            {/* Value */}
            <p className="text-lg font-bold text-gray-800">{step.value.toLocaleString()}</p>
            
            {/* Label */}
            <p className="text-xs text-gray-500">{step.label}</p>
            
            {/* Rate */}
            {step.rate !== null && (
              <p className="text-xs text-primary-600 font-medium">
                {step.rate.toFixed(1)}%
              </p>
            )}
            
            {/* Arrow */}
            {i < steps.length - 1 && (
              <div className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 text-gray-300">
                →
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
