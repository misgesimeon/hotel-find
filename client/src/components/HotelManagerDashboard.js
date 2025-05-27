import React, { useState } from 'react';
import AddHotelForm from './AddHotelForm';
import { ImageComponent } from '../utils/imageUtils';

const HotelManagerDashboard = () => {
  const [showAddForm, setShowAddForm] = useState(false);

  const handleImageError = (e) => {
    console.error('Image load error:', e.target.src);
    e.target.onerror = null;
    e.target.src = '/images/no-image.svg';
  };

  const getImageUrl = (image) => {
    if (!image) return '/images/no-image.svg';
    
    // Handle string URLs
    if (typeof image === 'string') {
      if (image.startsWith('blob:')) return image;
      if (image.startsWith('http')) return image;
      if (image.startsWith('/uploads/')) {
        return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${image}`;
      }
      return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/uploads/${image}`;
    }
    
    // Handle object URLs
    if (image.url) {
      if (image.url.startsWith('blob:')) return image.url;
      if (image.url.startsWith('http')) return image.url;
      if (image.url.startsWith('/uploads/')) {
        return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${image.url}`;
      }
      return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/uploads/${image.filename || image.url}`;
    }
    
    // Handle filename
    if (image.filename) {
      return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/uploads/${image.filename}`;
    }
    
    return '/images/no-image.svg';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Hotel Management Dashboard</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {showAddForm ? 'Cancel' : 'Add New Hotel'}
        </button>
      </div>

      {showAddForm ? (
        <AddHotelForm />
      ) : (
        <div>
          {/* Example of using ImageComponent */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Replace this with your actual hotel data */}
            {[].map((hotel) => (
              <div key={hotel.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <ImageComponent
                  src={hotel.imageUrl}
                  alt={hotel.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-lg font-semibold">{hotel.name}</h3>
                  <p className="text-gray-600">{hotel.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HotelManagerDashboard; 