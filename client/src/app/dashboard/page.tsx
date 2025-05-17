'use client';

import { useState, useEffect } from "react";
// Import auth utilities instead of the context
import { getMockUser } from "@/lib/auth-utils";

export default function DoctorDashboard() {
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [connectionMessage, setConnectionMessage] = useState('');

  // Use mock user directly
  const user = getMockUser();
  
  // Mock patients data
  const [patients, setPatients] = useState([
    {
      id: "patient-1",
      name: "John Smith",
      gender: "Male",
      age: 38,
      walletAddress: "0x1abc...def3",
      vitals: {
        heartRate: 75,
        bloodPressureSystolic: 120,
        bloodPressureDiastolic: 80,
        oxygen: 98,
        lastUpdated: new Date().toISOString(),
        blockchainHash: "0x7d8f45a31d89a51587e4b27230a684d761805c09eb85813e5313c3653b956b7a"
      }
    },
    {
      id: "patient-2",
      name: "Sarah Johnson",
      gender: "Female",
      age: 42,
      walletAddress: "0x4def...789a",
      vitals: {
        heartRate: 82,
        bloodPressureSystolic: 130, 
        bloodPressureDiastolic: 85,
        oxygen: 97,
        lastUpdated: new Date().toISOString(),
        blockchainHash: "0x3f7e512c8826a16e22eaa6a6c43eac21e84f8ab26ca9db313782e32bed86a82b"
      }
    }
  ]);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Refresh patient vitals
  const refreshVitals = (patientId) => {
    setPatients(patients.map(p => {
      if (p.id === patientId) {
        return {
          ...p,
          vitals: {
            ...p.vitals,
            heartRate: Math.floor(Math.random() * 30) + 60,
            bloodPressureSystolic: Math.floor(Math.random() * 40) + 110,
            bloodPressureDiastolic: Math.floor(Math.random() * 20) + 70,
            oxygen: Math.floor(Math.random() * 5) + 94,
            lastUpdated: new Date().toISOString(),
            blockchainHash: "0x" + Math.random().toString(16).substring(2, 64)
          }
        };
      }
      return p;
    }));
  };

  // Connect new patient
  const connectPatient = () => {
    if (!walletAddress) return;
    
    setLoading(true);
    
    setTimeout(() => {
      const newPatient = {
        id: `patient-${patients.length + 1}`,
        name: `New Patient ${patients.length + 1}`,
        gender: "Other",
        age: 35,
        walletAddress: walletAddress,
        vitals: {
          heartRate: 78,
          bloodPressureSystolic: 125,
          bloodPressureDiastolic: 82,
          oxygen: 99,
          lastUpdated: new Date().toISOString(),
          blockchainHash: "0x9c5a271b8d69ad1cafef7192d9a26676d733b636615826ce479389bb3a8f12f8"
        }
      };
      
      setPatients([...patients, newPatient]);
      setConnectionMessage(`Successfully connected with patient wallet: ${walletAddress}`);
      setWalletAddress('');
      setLoading(false);
    }, 1000);
  };

  // Simple sidebar icon component
  const SidebarIcon = ({ children }) => (
    <span className="h-5 w-5 mr-2 inline-flex items-center justify-center">{children}</span>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r min-h-screen p-4 flex flex-col justify-between">
          <div>
            <div className="mb-8">
              <h1 className="text-xl font-bold flex items-center">
                <SidebarIcon>🏥</SidebarIcon>
                HealthChain
              </h1>
              <p className="text-xs text-gray-500 mt-1">Blockchain Healthcare</p>
            </div>
            
            <nav className="space-y-1">
              <div className="p-2 rounded-md bg-blue-100 text-blue-800 font-medium flex items-center">
                <SidebarIcon>📊</SidebarIcon>
                Dashboard
              </div>
              <div className="p-2 rounded-md hover:bg-gray-100 flex items-center">
                <SidebarIcon>👥</SidebarIcon>
                Patients
              </div>
              <div className="p-2 rounded-md hover:bg-gray-100 flex items-center">
                <SidebarIcon>📅</SidebarIcon>
                Appointments
              </div>
              <div className="p-2 rounded-md hover:bg-gray-100 flex items-center">
                <SidebarIcon>📝</SidebarIcon>
                Reports
              </div>
              <div className="p-2 rounded-md hover:bg-gray-100 flex items-center">
                <SidebarIcon>⚙️</SidebarIcon>
                Settings
              </div>
            </nav>
          </div>
          
          {/* Doctor profile - now part of flex layout instead of absolute positioning */}
          <div className="mt-auto pt-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center">
                <div className="bg-blue-100 rounded-full p-2 h-10 w-10 flex items-center justify-center">
                  D
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">Dr. Michael Chen</p>
                  <p className="text-xs text-gray-500">Cardiologist</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex-1 p-6">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Doctor Dashboard</h1>
              <p className="text-gray-500">Remote patient monitoring with blockchain verification</p>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-md flex items-center">
                <SidebarIcon>📝</SidebarIcon>
                View Reports
              </button>
              <button className="px-3 py-2 bg-blue-600 text-white rounded-md flex items-center">
                <SidebarIcon>📅</SidebarIcon>
                Appointments
              </button>
            </div>
          </div>

          <div className="grid gap-4 grid-cols-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg shadow-sm border border-blue-200">
              <div className="flex justify-between">
                <h3 className="text-sm font-medium text-blue-700">Total Patients</h3>
                <span className="text-blue-500">👥</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{patients.length}</p>
              <p className="text-xs text-blue-700 mt-1">↑ 2 new this month</p>
            </div>
            
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-lg shadow-sm border border-amber-200">
              <div className="flex justify-between">
                <h3 className="text-sm font-medium text-amber-700">Alerts</h3>
                <span className="text-amber-500">🔔</span>
              </div>
              <p className="text-2xl font-bold text-amber-900">0</p>
              <p className="text-xs text-amber-700 mt-1">All vitals normal</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg shadow-sm border border-green-200">
              <div className="flex justify-between">
                <h3 className="text-sm font-medium text-green-700">Readings Today</h3>
                <span className="text-green-500">📈</span>
              </div>
              <p className="text-2xl font-bold text-green-900">12</p>
              <p className="text-xs text-green-700 mt-1">Updated 5 min ago</p>
            </div>
            
            <div className="bg-gradient-to-br from-rose-50 to-rose-100 p-4 rounded-lg shadow-sm border border-rose-200">
              <div className="flex justify-between">
                <h3 className="text-sm font-medium text-rose-700">Pending Actions</h3>
                <span className="text-rose-500">⚠️</span>
              </div>
              <p className="text-2xl font-bold text-rose-900">3</p>
              <p className="text-xs text-rose-700 mt-1">Requires review</p>
            </div>
          </div>

          <div className="grid gap-6 grid-cols-1 lg:grid-cols-3 mb-6">
            {/* Patient List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 lg:col-span-1">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-lg font-medium">My Patients</h2>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {patients.length} Total
                </span>
              </div>
              <div className="p-0 max-h-[500px] overflow-auto">
                <div className="divide-y">
                  {patients.map((patient) => (
                    <div 
                      key={patient.id}
                      onClick={() => setSelectedPatient(patient)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 ${
                        selectedPatient?.id === patient.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-white flex items-center justify-center font-medium">
                          {patient.name.charAt(0)}
                        </div>
                        <div className="ml-3">
                          <h3 className="font-medium">{patient.name}</h3>
                          <div className="text-xs text-gray-500">
                            {patient.gender} • {patient.age} yrs • Wallet: {patient.walletAddress}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 border-t bg-gray-50">
                <p className="text-sm font-medium mb-2">Connect New Patient</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Patient Wallet Address"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <button 
                    onClick={connectPatient}
                    disabled={!walletAddress}
                    className={`px-3 py-2 rounded-md text-white ${
                      walletAddress ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-300 cursor-not-allowed'
                    }`}
                  >
                    Connect
                  </button>
                </div>
                {connectionMessage && (
                  <div className="mt-2 text-xs text-green-700 bg-green-50 p-2 rounded flex items-center">
                    ✓ {connectionMessage}
                  </div>
                )}
              </div>
            </div>
            
            {/* Patient Vitals Display */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 lg:col-span-2">
              <div className="p-4 border-b flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-medium">
                    {selectedPatient ? `${selectedPatient.name}'s Vitals` : 'Select a Patient'}
                  </h2>
                  {selectedPatient && (
                    <p className="text-sm text-gray-500">
                      Live health data secured with blockchain
                    </p>
                  )}
                </div>
                {selectedPatient && (
                  <button 
                    onClick={() => refreshVitals(selectedPatient.id)}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm flex items-center"
                  >
                    🔄 Refresh
                  </button>
                )}
              </div>
              
              <div className="p-6">
                {selectedPatient ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                        <div className="flex justify-between">
                          <h3 className="mb-2 text-sm font-medium text-red-800">Heart Rate</h3>
                          <span className="text-red-500">❤️</span>
                        </div>
                        <div className="text-2xl font-bold text-red-900">{selectedPatient.vitals.heartRate} BPM</div>
                        <div className="mt-2 text-xs px-2 py-1 rounded inline-flex items-center" 
                          style={{ 
                            backgroundColor: selectedPatient.vitals.heartRate > 100 || selectedPatient.vitals.heartRate < 60 ? 
                              '#FEE2E2' : '#D1FAE5', 
                            color: selectedPatient.vitals.heartRate > 100 || selectedPatient.vitals.heartRate < 60 ? 
                              '#B91C1C' : '#047857'
                          }}>
                          {selectedPatient.vitals.heartRate > 100 ? "High" : 
                           selectedPatient.vitals.heartRate < 60 ? "Low" : "Normal"}
                        </div>
                      </div>
                      
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="flex justify-between">
                          <h3 className="mb-2 text-sm font-medium text-blue-800">Blood Pressure</h3>
                          <span className="text-blue-500">🩸</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-900">
                          {selectedPatient.vitals.bloodPressureSystolic}/{selectedPatient.vitals.bloodPressureDiastolic} mmHg
                        </div>
                        <div className="mt-2 text-xs px-2 py-1 rounded inline-flex items-center"
                          style={{ 
                            backgroundColor: selectedPatient.vitals.bloodPressureSystolic > 140 ? 
                              '#FEE2E2' : '#D1FAE5', 
                            color: selectedPatient.vitals.bloodPressureSystolic > 140 ? 
                              '#B91C1C' : '#047857'
                          }}>
                          {selectedPatient.vitals.bloodPressureSystolic > 140 ? "High" : "Normal"}
                        </div>
                      </div>
                      
                      <div className="p-4 bg-teal-50 rounded-lg border border-teal-100">
                        <div className="flex justify-between">
                          <h3 className="mb-2 text-sm font-medium text-teal-800">Blood Oxygen</h3>
                          <span className="text-teal-500">🫁</span>
                        </div>
                        <div className="text-2xl font-bold text-teal-900">{selectedPatient.vitals.oxygen}%</div>
                        <div className="mt-2 text-xs px-2 py-1 rounded inline-flex items-center"
                          style={{ 
                            backgroundColor: selectedPatient.vitals.oxygen < 95 ? 
                              '#FEF3C7' : '#D1FAE5', 
                            color: selectedPatient.vitals.oxygen < 95 ? 
                              '#92400E' : '#047857'
                          }}>
                          {selectedPatient.vitals.oxygen < 95 ? "Low" : "Normal"}
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div className="text-xs text-gray-600">
                          Last updated: {new Date(selectedPatient.vitals.lastUpdated).toLocaleString()}
                        </div>
                        <div className="flex items-center text-xs text-indigo-700 bg-indigo-100 px-2 py-1 rounded">
                          🔗 Blockchain Verified: {selectedPatient.vitals.blockchainHash.substring(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <div className="h-16 w-16 mb-4 bg-gray-200 rounded-full flex items-center justify-center text-2xl">
                      👤
                    </div>
                    <p className="mb-2">Select a patient to view vital signs</p>
                    <p className="text-xs text-gray-400">Patient health data is secured on blockchain</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 text-sm text-indigo-700">
            <div className="flex items-center">
              <span className="mr-2 text-lg">🔐</span>
              <span><strong>Blockchain verification:</strong> All patient data is securely recorded on-chain for tamper-proof medical records.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
