/* UserComparisonSelector.jsx */
import React, { useState } from "react";
import { User, Users, ArrowLeftRight, X, AlertTriangle, Search, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

// User lists
const IMPORT_USERS = [
  'FADWA.ERRAZIKI', 'AYOUB.SOURISTE', 'AYMANE.BERRIOUA', 'SANA.IDRISSI', 'AMINA.SAISS',
  'KHADIJA.OUFKIR', 'ZOHRA.HMOUDOU', 'SIMO.ONSI', 'YOUSSEF.ASSABIR', 'ABOULHASSAN.AMINA',
  'MEHDI.OUAZIR', 'OUMAIMA.EL.OUTMANI', 'HAMZA.ALLALI', 'MUSTAPHA.BOUJALA', 'HIND.EZZAOUI'
];

const EXPORT_USERS = [
  'IKRAM.OULHIANE', 'MOURAD.ELBAHAZ', 'MOHSINE.SABIL', 'AYA.HANNI',
  'ZAHIRA.OUHADDA', 'CHAIMAAE.EJJARI', 'HAFIDA.BOOHADDOU', 'KHADIJA.HICHAMI', 'FATIMA.ZAHRA.BOUGSIM'
];

// Helper to get team
const getUserTeam = (username) => {
  if (IMPORT_USERS.includes(username)) return "Import";
  if (EXPORT_USERS.includes(username)) return "Export";
  return "Unknown";
};

const UserComparisonSelector = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Filter users based on search term
  const filteredUsers = [...IMPORT_USERS, ...EXPORT_USERS]
    .filter((user) => user.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter((user) => !selectedUsers.includes(user));

  // Add user to selection
  const addUser = (user) => {
    if (selectedUsers.length < 2 && !selectedUsers.includes(user)) {
      setSelectedUsers((prev) => [...prev, user]);
      setSearchTerm("");
    }
  };

  // Remove user from selection
  const removeUser = (userToRemove) => {
    setSelectedUsers((prev) => prev.filter((u) => u !== userToRemove));
  };

  // Start comparison
  const startComparison = () => {
    if (selectedUsers.length === 2) {
      const team1 = getUserTeam(selectedUsers[0]);
      const team2 = getUserTeam(selectedUsers[1]);

      if (team1 !== team2 && team1 !== "Unknown" && team2 !== "Unknown") {
        const proceed = window.confirm(
          `You are comparing a ${team1} user with an ${team2} user.\n\nThis comparison may not be meaningful as they work in different teams.\n\nDo you still want to continue?`
        );
        if (!proceed) return;
      }

      navigate(`/statistics/performance/compare/${selectedUsers[0]}/${selectedUsers[1]}`);
    }
  };

  // Check if mixed team comparison
  const isMixedComparison = () => {
    if (selectedUsers.length !== 2) return false;
    const team1 = getUserTeam(selectedUsers[0]);
    const team2 = getUserTeam(selectedUsers[1]);
    return team1 !== team2 && team1 !== "Unknown" && team2 !== "Unknown";
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <ArrowLeftRight className="h-5 w-5 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Compare Users</h1>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 max-w-3xl mx-auto">
        {/* Warning Banner - Mixed Teams */}
        {isMixedComparison() && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-yellow-900">Cross-Team Comparison</h3>
                <p className="text-sm text-yellow-800 mt-1">
                  You are comparing an <strong>{getUserTeam(selectedUsers[0])}</strong> user with an <strong>{getUserTeam(selectedUsers[1])}</strong> user.
                  These users belong to different teams and their metrics may not be directly comparable.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Select Users to Compare
          </h2>

          {/* Selected Users Pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedUsers.map((user) => {
              const team = getUserTeam(user);
              return (
                <div
                  key={user}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                    team === "Import"
                      ? "bg-blue-100 text-blue-800"
                      : team === "Export"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <User className="h-3 w-3" />
                  {user.replace(".", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  <span className="text-xs ml-1 px-1.5 py-0.5 bg-white bg-opacity-30 rounded">
                    {team}
                  </span>
                  <button
                    onClick={() => removeUser(user)}
                    className="ml-1 hover:bg-opacity-50 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
            {selectedUsers.length === 0 && (
              <p className="text-gray-500 text-sm">No users selected</p>
            )}
          </div>

          {/* Search Input */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* User List */}
          {searchTerm && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm max-h-60 overflow-auto">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const team = getUserTeam(user);
                  return (
                    <div
                      key={user}
                      onClick={() => addUser(user)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          team === "Import" ? "bg-blue-500" : team === "Export" ? "bg-green-500" : "bg-gray-500"
                        }`}
                      ></div>
                      <span className="font-medium">
                        {user.replace(".", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                      <span className="text-sm text-gray-500 ml-auto">{team}</span>
                    </div>
                  );
                })
              ) : (
                <div className="px-4 py-8 text-center text-gray-500">
                  No users found
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          {!searchTerm && selectedUsers.length < 2 && (
            <p className="text-gray-500 text-sm mt-2">
              Type a name to search and add up to 2 users for comparison.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={startComparison}
            disabled={selectedUsers.length !== 2}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-lg transition ${
              selectedUsers.length === 2
                ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            <ArrowRight className="h-4 w-4" />
            Compare Users
          </button>

          {selectedUsers.length > 0 && (
            <button
              onClick={() => setSelectedUsers([])}
              className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition"
            >
              <X className="h-4 w-4" />
              Clear All
            </button>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900">Tip</h3>
              <p className="text-sm text-blue-800 mt-1">
                For meaningful insights, compare users from the same team (Import vs Import or Export vs Export).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserComparisonSelector;