import React, { useState } from 'react';
import { Edit3, ToggleLeft, ToggleRight, FileDown, ChevronDown, ChevronUp, MapPin } from 'lucide-react';

export default function CityLimitsCard({ 
  city, 
  offices, 
  onEditCity, 
  officeToggleMutation, 
  downloadPdf, 
  downloadingPdf 
}: any) {
  const [showAllOffices, setShowAllOffices] = useState(false);

  const displayedOffices = showAllOffices ? offices : offices.slice(0, 2);
  const hasMoreOffices = offices.length > 2;

  const leftLimit = city.whatsappMonthlyLimit === 0 ? 'Unlimited' : Math.max(0, city.whatsappMonthlyLimit - city.monthlySent);
  const isUnlimited = city.whatsappMonthlyLimit === 0;

  return (
    <div className="card mb-6 overflow-hidden">
      {/* City Header / Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <MapPin size={20} className="text-primary-600" />
            {city.name}
          </h2>
          <p className="text-sm text-gray-500">{city.state} {city.district ? `· ${city.district}` : ''} (Code: {city.code})</p>
        </div>
        <button
          onClick={() => onEditCity(city)}
          className="btn-secondary text-sm flex items-center gap-2"
        >
          <Edit3 size={16} />
          Update Limits
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Used Limit</p>
          <p className="text-2xl font-bold text-gray-900">{city.monthlySent}</p>
        </div>
        <div className="bg-primary-50 rounded-xl p-4 border border-primary-100">
          <p className="text-xs font-medium text-primary-600 uppercase tracking-wider mb-1">Total Left Limit</p>
          <p className="text-2xl font-bold text-primary-900">{isUnlimited ? 'Unlimited' : leftLimit}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
          <p className="text-xs font-medium text-green-600 uppercase tracking-wider mb-1">Total Sent (Success)</p>
          <p className="text-2xl font-bold text-green-900">{city.totalSent}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-100">
          <p className="text-xs font-medium text-red-600 uppercase tracking-wider mb-1">Total Failed</p>
          <p className="text-2xl font-bold text-red-900">{city.failed}</p>
        </div>
      </div>

      {/* Offices Section */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-4 px-2">City Offices ({offices.length})</h3>
        
        {offices.length === 0 ? (
          <p className="text-sm text-gray-500 px-2 italic">No offices found for this city.</p>
        ) : (
          <div className="space-y-3">
            {displayedOffices.map((office: any) => (
              <div key={office.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-base">{office.name}</h4>
                  <p className="text-xs text-gray-500">Code: {office.code}</p>
                </div>
                
                <div className="flex items-center gap-6 flex-1 justify-between sm:justify-end">
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-0.5">Total Sent</p>
                    <p className="text-sm font-semibold text-green-600">{office.totalSent}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-0.5">Total Failed</p>
                    <p className="text-sm font-semibold text-red-600">{office.failed}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => officeToggleMutation.mutate(office.id)}
                      className={`flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors min-w-[100px] ${
                        office.whatsappDisabled
                          ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                          : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                      }`}
                      disabled={officeToggleMutation.isPending}
                    >
                      {office.whatsappDisabled ? (
                        <>
                          <ToggleLeft size={16} className="text-red-500" />
                          Disabled
                        </>
                      ) : (
                        <>
                          <ToggleRight size={16} className="text-green-500" />
                          Enabled
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => downloadPdf(office.id, office.code)}
                      className="btn-icon bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
                      disabled={downloadingPdf === office.id}
                      title="Download PDF Report"
                    >
                      <FileDown size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {hasMoreOffices && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => setShowAllOffices(!showAllOffices)}
              className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 py-2 px-4 rounded-full hover:bg-primary-50 transition-colors"
            >
              {showAllOffices ? (
                <>Hide Offices <ChevronUp size={16} /></>
              ) : (
                <>See all {offices.length} Offices <ChevronDown size={16} /></>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
