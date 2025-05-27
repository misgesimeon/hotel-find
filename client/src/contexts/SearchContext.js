import React, { createContext, useContext, useState } from 'react';

const SearchContext = createContext();

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

export const SearchProvider = ({ children }) => {
  const [searchData, setSearchData] = useState({
    name: '',
    priceRange: [0, 10000],
    amenities: {
      wifi: false,
      parking: false,
      pool: false,
      restaurant: false,
      gym: false,
      spa: false,
      bar: false,
      concierge: false,
      room_service: false,
      laundry: false,
      business_center: false,
      meeting_rooms: false
    },
  });

  const updateSearchData = (newData) => {
    setSearchData(prev => ({
      ...prev,
      ...newData
    }));
  };

  const resetSearch = () => {
    setSearchData({
      name: '',
      priceRange: [0, 10000],
      amenities: {
        wifi: false,
        parking: false,
        pool: false,
        restaurant: false,
        gym: false,
        spa: false,
        bar: false,
        concierge: false,
        room_service: false,
        laundry: false,
        business_center: false,
        meeting_rooms: false
      },
    });
  };

  return (
    <SearchContext.Provider value={{ searchData, updateSearchData, resetSearch }}>
      {children}
    </SearchContext.Provider>
  );
};

export default SearchContext; 