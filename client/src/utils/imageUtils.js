export const handleImageError = (e) => {
  console.error('Image load error:', e.target.src);
  e.target.onerror = null;
  e.target.src = '/images/no-image.svg';
};

export const getDefaultImage = (type) => {
  return '/images/no-image.svg';
};

export const getImageUrl = (image) => {
  if (!image) return getDefaultImage('hotel');
  
  // Handle string URLs
  if (typeof image === 'string') {
    if (image.startsWith('blob:')) return image;
    if (image.startsWith('http')) return image;
    if (image.startsWith('/uploads/hotels/')) {
      return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${image}`;
    }
    if (image.startsWith('/uploads/rooms/')) {
      return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${image}`;
    }
    // Default to hotel images for backward compatibility
    return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/uploads/hotels/${image}`;
  }
  
  // Handle object URLs
  if (image.url) {
    if (image.url.startsWith('blob:')) return image.url;
    if (image.url.startsWith('http')) return image.url;
    if (image.url.startsWith('/uploads/hotels/')) {
      return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${image.url}`;
    }
    if (image.url.startsWith('/uploads/rooms/')) {
      return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${image.url}`;
    }
    // Default to hotel images for backward compatibility
    return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/uploads/hotels/${image.filename || image.url}`;
  }
  
  // Handle filename
  if (image.filename) {
    // Default to hotel images for backward compatibility
    return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/uploads/hotels/${image.filename}`;
  }
  
  return getDefaultImage('hotel');
};

export const ImageComponent = ({ src, alt, className = '', style = {} }) => {
  return (
    <img
      src={getImageUrl(src)}
      alt={alt}
      className={className}
      style={style}
      onError={handleImageError}
      crossOrigin="anonymous"
    />
  );
}; 