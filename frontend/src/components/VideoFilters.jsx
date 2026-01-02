import React, { useState } from "react";
import { Search, Filter, X, Calendar, HardDrive, Clock, ArrowUpDown } from "lucide-react";

const VideoFilters = ({ onFilterChange, onReset }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    sensitivity: "",
    sortBy: "createdAt",
    sortOrder: "desc",
    startDate: "",
    endDate: "",
  });

  const handleChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      search: "",
      status: "",
      sensitivity: "",
      sortBy: "createdAt",
      sortOrder: "desc",
      startDate: "",
      endDate: "",
    };
    setFilters(resetFilters);
    onReset();
  };

  const activeFilterCount = Object.values(filters).filter(
    (v) => v && v !== "createdAt" && v !== "desc"
  ).length;

  return (
    <div className="mb-6 space-y-4">
      {/* Search Bar */}
      <div className="flex items-center space-x-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search videos by title or description..."
            value={filters.search}
            onChange={(e) => handleChange("search", e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg border transition-all ${
            showFilters
              ? "bg-primary-600 text-white border-primary-600"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          }`}
        >
          <Filter className="h-5 w-5" />
          <span className="font-medium">Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-white text-primary-600 text-xs font-bold px-2 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleChange("status", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Sensitivity Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sensitivity
              </label>
              <select
                value={filters.sensitivity}
                onChange={(e) => handleChange("sensitivity", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Content</option>
                <option value="safe">Safe</option>
                <option value="flagged">Flagged</option>
                <option value="unchecked">Unchecked</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center space-x-1">
                <ArrowUpDown className="h-3 w-3" />
                <span>Sort By</span>
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleChange("sortBy", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="createdAt">Upload Date</option>
                <option value="title">Title</option>
                <option value="size">File Size</option>
                <option value="duration">Duration</option>
                <option value="analysisConfidence">Confidence</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order
              </label>
              <select
                value={filters.sortOrder}
                onChange={(e) => handleChange("sortOrder", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>From Date</span>
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleChange("startDate", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>To Date</span>
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleChange("endDate", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Reset Button */}
          <div className="flex justify-end pt-2 border-t border-gray-200">
            <button
              onClick={handleReset}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoFilters;
